"""Contract tests for admin replies and the resident notification bell."""
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class NotificationContractTest(unittest.TestCase):
    def test_admin_rows_have_message_actions_for_both_types(self):
        page = (ROOT / 'admin_modern.php').read_text(encoding='utf-8')
        script = (ROOT / 'admin_modern.js').read_text(encoding='utf-8')
        self.assertEqual(page.count('<th>Admin Message</th>'), 2)
        self.assertIn('send_pickup_notification', script)
        self.assertIn('send_issue_notification', script)

    def test_resident_bell_fetches_and_marks_notifications_read(self):
        script = (ROOT / 'dashboard.js').read_text(encoding='utf-8')
        self.assertIn('mark_notifications_read', script)
        self.assertIn('notificationBtn', script)
        self.assertIn('notificationsList', script)

    def test_server_sends_report_reply_and_updates_status_atomically(self):
        api = (ROOT / 'admin_api.php').read_text(encoding='utf-8')
        self.assertIn("case 'send_issue_notification':", api)
        self.assertIn('$conn->begin_transaction()', api)


if __name__ == '__main__':
    unittest.main()