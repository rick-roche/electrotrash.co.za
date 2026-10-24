"""Check local archive assets without depending on external historical sites."""
import re
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


if __name__ == '__main__':
    unittest.main()
