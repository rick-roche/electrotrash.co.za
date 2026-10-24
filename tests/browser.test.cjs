const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const baseURL = process.env.SITE_URL || 'http://127.0.0.1:1313';
let browser;
before(async () => {
  browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_EXECUTABLE });
});
after(async () => { await browser?.close(); });

async function pageFor(t, path = '/posts/') {
  const context = await browser.newContext();
  t.after(() => context.close());
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  page.setDefaultNavigationTimeout(30000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  t.after(() => assert.deepEqual(errors, [], 'unexpected browser errors'));
  await page.goto(baseURL + path);
  return page;
}

test('processed theme assets stay on the preview origin', async t => {
  const context = await browser.newContext();
  t.after(() => context.close());
  const response = await context.request.get(baseURL + '/posts/');
  const html = await response.text();
  const stylesheet = html.match(/href=["']?([^\s"'>]*theme\/min[^\s"'>]*)/)[1];
  assert.equal(new URL(stylesheet, baseURL + '/posts/').origin, new URL(baseURL).origin);
});

test('legacy download IDs resolve without exposing a PHP handler', { skip: !process.env.CONTAINER_TESTS }, async t => {
  const context = await browser.newContext();
  t.after(() => context.close());
  const song = await context.request.get(baseURL + '/wp-content/plugins/wp-downloadMonitor/download.php?id=mtkidu-walk%20through%20joburg%28load%20sheddin%29.mp3', { maxRedirects: 0 });
  assert.equal(song.status(), 301);
  assert.equal(song.headers().location, 'https://media.electrotrash.co.za/mtkidu/mtkidu_-_mtkidu-walk_through_joburg(load_sheddin).mp3');
  const unavailable = await context.request.get(baseURL + '/wp-content/plugins/download-monitor/download.php?id=211');
  assert.equal(unavailable.status(), 410);
  assert.match(await unavailable.text(), /unavailable/);
  const unknown = await context.request.get(baseURL + '/wp-content/plugins/wp-downloadMonitor/download.php?id=unknown');
  assert.equal(unknown.status(), 404);
});

test('the container serves the archive 404 page and baseline security headers', { skip: !process.env.CONTAINER_TESTS }, async t => {
  const context = await browser.newContext();
  t.after(() => context.close());
  const response = await context.request.get(baseURL + '/this-page-should-not-exist/');
  assert.equal(response.status(), 404);
  assert.match(await response.text(), /The page you are looking for does not exist/);
  assert.equal(response.headers()['x-content-type-options'], 'nosniff');
  assert.match(response.headers()['content-security-policy'], /object-src 'none'/);
});

test('a shared search URL renders its results on first visit', async t => {
  const page = await pageFor(t, '/posts/#search=haezer');
  await page.locator('#search-results').waitFor();
  assert.match(await page.locator('#search-results').innerText(), /result.*haezer/);
  assert.ok(await page.locator('.summary-title-link').count() > 0);
});

test('Back restores both the original page and its title', async t => {
  const page = await pageFor(t);
  const originalTitle = await page.title();
  await page.locator('#search-input').fill('haezer');
  await page.locator('#search-submit').click();
  await page.locator('#search-results').waitFor();
  await page.goBack();
  await page.getByText('Posts by Year', { exact: true }).waitFor();
  assert.equal(await page.title(), originalTitle);
});

test('Back while the index loads cancels the pending search', async t => {
  const page = await pageFor(t);
  const index = await page.request.get(baseURL + '/search.json');
  const body = await index.body();
  let release;
  const requested = new Promise(resolve => {
    page.route('**/search.json', async route => {
      release = () => route.fulfill({ contentType: 'application/json', body });
      resolve();
    });
  });
  await page.evaluate(() => history.pushState(null, '', '#2011'));
  await page.locator('#search-input').fill('haezer');
  await page.locator('#search-submit').click();
  await requested;
  await page.goBack();
  await release();
  await page.waitForFunction(() => !document.querySelector('#search').hasAttribute('data-running'));
  assert.equal(new URL(page.url()).hash, '');
  assert.equal(await page.locator('#search-results').count(), 0);
  assert.equal(await page.getByText('Posts by Year', { exact: true }).count(), 1);
});

test('invalid query syntax gives feedback without replacing the page', async t => {
  const page = await pageFor(t);
  await page.locator('#search-input').fill('haezer:');
  await page.locator('#search-submit').click();
  await page.waitForFunction(() => document.querySelector('#search-status')?.textContent.includes('query'), null, { timeout: 5000 });
  assert.equal(await page.getByText('Posts by Year', { exact: true }).count(), 1);
  assert.equal(await page.locator('#search').getAttribute('data-running'), null);
});

test('a failed index download reports failure and can be retried', async t => {
  const page = await pageFor(t);
  await page.route('**/search.json', route => route.abort());
  await page.locator('#search-input').fill('haezer');
  await page.locator('#search-submit').click();
  await page.waitForFunction(() => document.querySelector('#search-status')?.textContent.includes('retry'), null, { timeout: 5000 });
  await page.unroute('**/search.json');
  await page.locator('#search-submit').click();
  await page.locator('#search-results').waitFor();
});

test('audio downloads use a native link that needs no CORS fetch', async t => {
  const page = await pageFor(t, '/2008/09/08/monday-mix-and-mash-up-madness/');
  const url = 'https://media.electrotrash.co.za/dirtyoldman/chromeo_vs_digitalism_-_fancy_pogowork_(dirtyoldman_bootleg).mp3';
  await page.context().route('https://media.electrotrash.co.za/**', route => route.fulfill({ contentType: 'audio/mpeg', body: '' }));
  const link = page.locator('.audio-container-left a');
  assert.equal(await link.count(), 1);
  assert.equal(decodeURIComponent(await link.getAttribute('href')), url);
  const popupPromise = page.waitForEvent('popup');
  await link.click();
  const popup = await popupPromise;
  await popup.waitForLoadState();
  assert.equal(decodeURIComponent(popup.url()), url);
});

test('the gallery opens with the shared jQuery and closes normally', async t => {
  const page = await pageFor(t, '/gallery/bruno-pronsato-2012/');
  const imageURL = new URL(await page.locator('.gallery img').first().getAttribute('src'), page.url());
  assert.equal(imageURL.origin, new URL(baseURL).origin);
  assert.equal(imageURL.pathname, '/wp-content/gallery/bruno-pronsato-2012/dsc_0050.jpg');
  await page.locator('.gallery .box').first().click();
  await page.locator('.pswp.pswp--animated-in').waitFor();
  await page.locator('.pswp__button--close').click();
  await page.locator('.pswp.pswp--open').waitFor({ state: 'detached' });
});

test('playlist controls select the next and previous tracks', async t => {
  const page = await pageFor(t, '/downloads/phfat/');
  await page.locator('#next').click();
  assert.equal(await page.locator('#now-playing').innerText(), 'Now playing: Phfat - Dinosaur Blood');
  assert.match(await page.locator('#player').getAttribute('src'), /phfat_-_dinosaur_blood\.mp3$/);
  await page.locator('#prev').click();
  assert.equal(await page.locator('#now-playing').innerText(), 'Now playing: Phfat - Big Five (Feat Fuzzy Slippers)');
});

test('shared section lists retain their introductions and artist links', async t => {
  const page = await pageFor(t, '/artists/');
  assert.match(await page.locator('#main').innerText(), /Read about all our featured South African electronic artists!/);
  assert.equal(await page.locator('#main a[href$="/artists/axxon/"]').count(), 1);
  await page.goto(baseURL + '/downloads/');
  assert.match(await page.locator('#main').innerText(), /Electrotrash.co.za brings you the best free downloads/);
});

test('the contact page renders a protected Web3Forms form without exposing the inbox', async t => {
  const page = await pageFor(t, '/contact/');
  const form = page.locator('form[action="https://api.web3forms.com/submit"]');
  assert.equal(await form.locator('input[name="access_key"]').inputValue(), '8224f060-84ce-4775-b7df-621899c79cd8');
  assert.equal(await form.locator('input[name="botcheck"]').count(), 1);
  assert.equal(await form.locator('.h-captcha[data-captcha="true"]').count(), 1);
  assert.equal(await page.getByText('electrotrash.za@gmail.com').count(), 0);
  assert.equal(await form.locator('input[name="email"]').getAttribute('type'), 'email');
  assert.equal(await form.locator('textarea[name="message"]').getAttribute('maxlength'), '5000');
});

test('the recovery checklist includes every unique dead-link reference', async t => {
  const context = await browser.newContext();
  t.after(() => context.close());
  const legacy = await context.request.get(baseURL + '/2026/10/24/help-us-recover-the-electrotrash-archive/');
  assert.match(await legacy.text(), /electrotrash-is-back-sort-of/);
  const page = await pageFor(t, '/2026/10/24/electrotrash-is-back-sort-of/');
  const postImage = page.locator('#main img[alt="Electrotrash is back online, celebrating South African electronic music"]');
  assert.equal(await postImage.count(), 1);
  assert.equal(new URL(await postImage.getAttribute('src'), page.url()).pathname, '/wp-content/uploads/2026/10/electrotrash-is-back-620x620.png');
  assert.equal(await postImage.evaluate(image => image.naturalWidth), 620);
  assert.equal(await page.locator('#main input[type="checkbox"]').count(), 28);
  assert.equal(await page.locator('#main li').count(), 28);
  assert.equal(await page.locator('#main a[href*="contact"]').count() >= 1, true);
  assert.equal(await page.locator('#main a[href="http://www.mediafire.com/?tz2mg2ejdlt"]').count(), 1);
});
