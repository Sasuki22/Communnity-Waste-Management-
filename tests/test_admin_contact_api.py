"""Admin contact inbox only reads the existing contact messages for admins."""
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class AdminContactApiTest(unittest.TestCase):
    def test_inbox_action_is_after_admin_guard_and_read_only(self):
        php = (ROOT / 'admin_api.php').read_text(encoding='utf-8')
        action = php.index("case 'contact_messages':")
        self.assertGreater(action, php.index("if ($role !== 'admin')"))
        self.assertIn("$method !== 'GET'", php[action:action + 1200])
        self.assertIn('FROM contact_messages ORDER BY created_at DESC, id DESC', php[action:action + 1200])
        self.assertIn("'success' => true, 'data' =>", php[action:action + 1200])


if __name__ == '__main__':
    unittest.main()