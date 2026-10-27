"""The dashboard logout link still works if dashboard.js cannot load."""
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class LogoutFallbackTest(unittest.TestCase):
    def test_dashboard_logout_link_has_a_real_destination(self):
        page = (ROOT / 'dashboard.php').read_text(encoding='utf-8')
        self.assertRegex(page, r'<a\b[^>]*href="logout\.php"[^>]*id="logoutBtn"')

    def test_javascript_still_intercepts_logout_for_confirmation(self):
        script = (ROOT / 'dashboard.js').read_text(encoding='utf-8')
        self.assertRegex(script, r'logoutButton\.addEventListener\("click",\s*\(e\)\s*=>\s*\{\s*e\.preventDefault\(\)')
        self.assertIn('logoutModal.classList.add("show")', script)


if __name__ == '__main__':
    unittest.main()