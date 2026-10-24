# electrotrash.co.za

The source for [electrotrash.co.za](https://electrotrash.co.za), a South African
electronic music site. This repository migrates the original WordPress site to
a static site built with [Hugo](https://gohugo.io/), preserving historical posts,
downloads, galleries, and the site's custom look.

The `etQuadro` theme lives in this repository. Hugo generates the HTML, RSS feeds,
and a JSON search index used by Lunr.js. Audio is also served from
`https://media.electrotrash.co.za/`; a local build does not mirror that service.

## Getting started

Install **Hugo Extended v0.168.0**, matching the version in the [Dockerfile](Dockerfile).
The Extended edition is needed for the theme's Sass assets. Alternatively, use
Docker to build and run the site without installing Hugo locally.

Clone the repository and run these commands from its root:

```sh
git clone https://github.com/rick-roche/electrotrash.co.za.git
cd electrotrash.co.za
hugo server --source site --buildFuture
```

Open <http://localhost:1313>. Hugo rebuilds as source files change. Add
`--buildDrafts` when previewing draft content; drafts are not included in the
production build. External media and embeds may require an internet connection.

There is no separate npm install or frontend bundler step.

## Production build

```sh
hugo --source site --gc --minify --buildFuture --cleanDestinationDir
```

The generated site is written to `site/public/`. This uses the same build flags
as the Docker image, including future-dated content. `--cleanDestinationDir`
cleans the output directory: do not point it at a directory containing source
files or other work.

### Run with Docker

With Docker running:

```sh
docker build --tag electrotrash:local .
docker run --rm --publish 127.0.0.1:8080:80 electrotrash:local
```

Open <http://localhost:8080>. The multi-stage image builds the site with Hugo and
serves the result with Nginx. This is a production-style preview, not a live-reload
development server; rebuild the image after changing source files.

## Repository layout

| Path | Purpose |
| --- | --- |
| `site/config.toml` | Site URL, permalinks, taxonomies, outputs, and media base URL |
| `site/content/` | Markdown content and front matter |
| `site/archetypes/` | Defaults for new content |
| `site/data/` | Data available to Hugo templates |
| `site/static/` | Files copied unchanged, including historical WordPress uploads |
| `site/layouts/` | Site-level template overrides (currently empty) |
| `site/themes/etQuadro/` | Custom templates, shortcodes, styles, scripts, and theme assets |
| `tests/` | Local archive asset checks and browser regression tests |
| `.github/workflows/ci.yml` | Archive checks, Docker build, HTTP smoke tests, and browser tests |
| `Dockerfile` | Hugo build and Nginx runtime |
| `nginx/default.conf` | Static routing, legacy download mappings, and baseline response headers |

`site/public/`, `site/resources/_gen/`, and `site/.hugo_build.lock` are generated
and ignored by Git. `cleanup/` and `.wip/` are ignored local migration/work areas,
not prerequisites for building the site.

## Validation

[CI](.github/workflows/ci.yml) runs on pushes and pull requests targeting `main`
and `migrate-from-wp`, and can also be triggered manually. It builds the Docker
image and checks that:

- the homepage responds successfully;
- `/2009/11/03/don-diablo-is-never-too-late/` remains accessible;
- `/js/jquery/jquery.min.js` is served;
- a nonexistent page returns HTTP 404.

To check the successful responses locally, leave the Docker container running
and use a second terminal:

```sh
curl --fail http://localhost:8080/ --output /dev/null
curl --fail http://localhost:8080/2009/11/03/don-diablo-is-never-too-late/ --output /dev/null
curl --fail http://localhost:8080/js/jquery/jquery.min.js --output /dev/null
curl --silent --output /dev/null --write-out '%{http_code}\n' http://localhost:8080/this-page-should-not-exist/
```

The last command should print `404`. Also preview affected pages in a browser
when changing content, layout, search, galleries, or audio playback. These smoke
tests do not validate every page or external media URL.

Run the local archive asset check with Python 3:

```sh
python3 tests/archive_test.py
```

Browser regression tests use Node.js 22+ and Playwright, installed in a temporary
directory rather than adding a package manager to the Hugo site. With the Docker
container above running:

```sh
browser_tools=$(mktemp -d)
npm install --prefix "$browser_tools" --no-save --package-lock=false playwright@1.58.2
"$browser_tools/node_modules/.bin/playwright" install chromium
NODE_PATH="$browser_tools/node_modules" SITE_URL=http://localhost:8080 CONTAINER_TESTS=1 node --test tests/browser.test.cjs
```

The suite covers shared search URLs, browser history, malformed queries, retry
after a failed search-index request, native audio links, galleries, and playlists.
`CONTAINER_TESTS=1` also checks Nginx's legacy download mappings, archive 404 page,
and response headers; omit it when testing with the Hugo development server.
It loads the pinned CDN libraries; network access is required. CI installs the
browser's Linux system dependencies as well. Browser tests do not verify every
external song or embed.

An optional [htmltest configuration](site/.htmltest.yml) is present. If you have
`htmltest` installed, run `cd site` followed by `htmltest` after building. It checks
external links, disables internal-link checks, and ignores URLs matching
`electrotrash.co.za`. It is not run by the current CI workflow, and archived
external links may no longer resolve.

## Hosting with Coolify

Deployment uses Coolify and the root `Dockerfile`. The image builds the Hugo site
and serves it with Nginx on **container port 80**; it needs no PHP, database, or
build-time npm dependencies. CI builds and tests only: it does not deploy, update
Coolify settings, or upload media.

Configure the domain and HTTPS at Coolify's reverse proxy. The build argument
`HUGO_BASEURL` defaults to `https://electrotrash.co.za`; use the appropriate URL for
other environments. For a preview, set the build argument `HUGO_NOINDEX=true`.
Check the rendered canonical URLs, HTTPS, and a genuine HTTP 404 after deployment.
The container applies baseline CSP restrictions (no objects, same-origin base
URLs and framing), `nosniff`, and a referrer policy. This deliberately does not
claim a restrictive script policy: historical embeds still need a separate
compatibility review. Coolify's live proxy configuration is managed outside this
repository; verify the actual public response headers after deployment.

Media is served separately at `media.electrotrash.co.za`. Native audio links open
in a new tab without requiring JavaScript CORS access. Depending on the media
server's `Content-Disposition`, the browser may play the file instead of saving
it immediately; use the browser's save/download control. For forced downloads,
configure an attachment response on a dedicated media download route rather than
fetching whole songs into browser memory.

Some original archive files are unavailable. Those references are explicitly
marked in the affected pages rather than replaced with invented content. Restore
them only from a verified source with the appropriate redistribution rights.
The known legacy Mtkidu download ID redirects to its matching media file; the
unavailable SWEAT.X download ID returns HTTP 410. Unknown download IDs return 404,
and no WordPress/PHP handler is installed.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for content and theme changes, and
[AGENTS.md](AGENTS.md) for coding-agent guidance. Preserve historical URLs and
media paths when maintaining the archive.

## Licence and third-party material

The repository includes an [MIT licence](LICENSE). Bundled third-party libraries
retain their own notices and licence terms. Do not assume that the repository's
software licence grants rights to redistribute music, photography, artwork, or
other third-party editorial material; check the relevant permissions separately.
