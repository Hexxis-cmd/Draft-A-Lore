import unittest
from pathlib import Path

from build import render_html


ROOT = Path(__file__).resolve().parents[1]


class BuildOutputTests(unittest.TestCase):
    def test_mobile_keeps_runtime_logo_without_web_install_metadata(self):
        html = render_html(include_web_metadata=False)
        self.assertIn('window.DAL_ASSETS={"logo":"data:image/png;base64,', html)
        self.assertNotIn('rel="manifest"', html)
        self.assertNotIn('rel="apple-touch-icon"', html)
        self.assertNotIn('rel="icon"', html)
        self.assertNotIn('apple-mobile-web-app-capable', html)

    def test_web_keeps_install_metadata(self):
        html = render_html()
        self.assertIn('rel="manifest"', html)
        self.assertIn('rel="apple-touch-icon"', html)
        self.assertIn('rel="icon"', html)

    def test_mobile_and_web_share_the_same_application(self):
        web = render_html()
        mobile = render_html(include_web_metadata=False)
        self.assertEqual(web.split('<style>', 1)[1], mobile.split('<style>', 1)[1])

    def test_author_name_uses_the_brand_animation(self):
        html = render_html(include_web_metadata=False)
        self.assertIn('profile-name brand-text', html)
        self.assertNotIn(':root[data-theme] .profile-name{', html)

    def test_all_themes_use_aurora_typography(self):
        css = (ROOT / 'src' / 'styles.css').read_text(encoding='utf-8')
        self.assertEqual(css.count('--font-display:'), 1)
        self.assertEqual(css.count('--font-body:'), 1)
        self.assertEqual(css.count('--font-mono:'), 1)
        self.assertIn("--font-display:'Cinzel','Georgia','Cambria',serif", css)

    def test_android_webview_applies_system_and_cutout_insets(self):
        source = (ROOT / 'android' / 'app' / 'src' / 'main' / 'java' /
                  'com' / 'draftalore' / 'app' / 'MainActivity.java').read_text(encoding='utf-8')
        self.assertIn('WindowInsetsCompat.Type.systemBars()', source)
        self.assertIn('WindowInsetsCompat.Type.displayCutout()', source)
        self.assertIn('view.setPadding(safeArea.left, safeArea.top, safeArea.right, safeArea.bottom)', source)


if __name__ == "__main__":
    unittest.main()
