"""Check local archive assets without depending on external historical sites."""
import re
import struct
import unittest
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]


class ArchiveAssets(unittest.TestCase):
    def test_referenced_assets_exist(self):
        missing = []
        pattern = r'''(?:\]\(|(?:src|link|dir|thumbnail|featured)\s*[:=]\s*["'])((?:/?wp-content/|/?images/)[^\s)"']+)'''
        for page in (ROOT / 'site/content').rglob('*.md'):
            for match in re.finditer(pattern, page.read_text()):
                url = unquote(match[1].split('#')[0].split('?')[0])
                if not any((ROOT / directory / url.lstrip('/')).exists() for directory in
                           ['site/static', 'site/themes/etQuadro/static']):
                    missing.append(f'{page.relative_to(ROOT)}: {url}')
        self.assertEqual(missing, [], '\n'.join(missing))

    def test_recovery_post_copies_every_dead_link_reference(self):
        sources = '\n'.join(page.read_text() for page in (ROOT / 'site/content/posts').glob('*.md'))
        recovery = (ROOT / 'site/content/posts/2026-10-24-help-recover-the-electrotrash-archive.md').read_text()
        self.assertIn('Electrotrash is back. Sort of.', recovery)
        self.assertIn('It\'s been a while. Thirteen years, to be precise.', recovery)
        self.assertIn('aliases:', recovery)
        self.assertIn('/2026/10/24/help-us-recover-the-electrotrash-archive/', recovery)
        self.assertIn('Missing tracks and downloads', recovery)
        recovery_items = re.findall(r'^- \[ \] \*\*(.+?)\*\*', recovery, re.M)
        self.assertEqual(len(recovery_items), 28)
        for page in (ROOT / 'site/content/posts').glob('*.md'):
            in_dead_links = False
            for line in page.read_text().splitlines():
                if 'Dead link' in line:
                    in_dead_links = True
                elif in_dead_links and not line.startswith('>'):
                    in_dead_links = False
                if in_dead_links:
                    for url in re.findall(r'https?://[^\s\])]+', line):
                        self.assertIn(url, recovery, f'{url} from {page.name}')

    def test_announcement_post_uses_archive_image_sizes(self):
        post = (ROOT / 'site/content/posts/2026-10-24-help-recover-the-electrotrash-archive.md').read_text()
        upload_dir = ROOT / 'site/static/wp-content/uploads/2026/10'
        expected = [
            '/wp-content/uploads/2026/10/electrotrash-is-back-620x620.png',
            '/wp-content/uploads/2026/10/electrotrash-is-back-304x190.png',
            '/wp-content/uploads/2026/10/electrotrash-is-back-150x150.png',
        ]
        for image in expected:
            self.assertIn(image, post)
            self.assertTrue((ROOT / 'site/static' / image.lstrip('/')).is_file(), image)
        dimensions = {'electrotrash-is-back.png': (1254, 1254),
                     'electrotrash-is-back-620x620.png': (620, 620),
                     'electrotrash-is-back-304x190.png': (304, 190),
                     'electrotrash-is-back-150x150.png': (150, 150)}
        for filename, size in dimensions.items():
            with (upload_dir / filename).open('rb') as image:
                image.seek(16)
                self.assertEqual(struct.unpack('>II', image.read(8)), size, filename)

    def test_about_page_reflects_the_archive_preservation_mission(self):
        about = (ROOT / 'site/content/about.md').read_text()
        self.assertIn('Electrotrash.co.za started in mid-2005', about)
        self.assertIn('## The archive', about)
        self.assertIn('## Help us keep it alive', about)
        self.assertIn('## Thanks', about)
        self.assertIn('dirtyoldman, RickDisco and the rest of the Electrotrash crew.', about)

    def test_relaunch_post_signoff_matches_about_page_credits(self):
        post = (ROOT / 'site/content/posts/2026-10-24-help-recover-the-electrotrash-archive.md').read_text()
        self.assertIn('**— dirtyoldman, RickDisco and the rest of the Electrotrash crew.**', post)

    def test_contact_page_uses_spam_controls_without_exposing_recipient(self):
        contact = (ROOT / 'site/content/contact.md').read_text()
        form = (ROOT / 'site/themes/etQuadro/layouts/shortcodes/contact-form.html').read_text()
        self.assertIn('{{< contact-form >}}', contact)
        self.assertIn('web3forms.com/submit', form)
        self.assertIn('8224f060-84ce-4775-b7df-621899c79cd8', form)
        self.assertIn('h-captcha', form)
        self.assertIn('botcheck', form)
        self.assertNotIn('electrotrash.za@gmail.com', contact + form)


if __name__ == '__main__':
    unittest.main()
