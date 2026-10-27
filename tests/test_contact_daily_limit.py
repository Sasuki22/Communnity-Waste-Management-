"""Contract checks for public contact validation and atomic daily limits."""
import json
import base64
import subprocess
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PHP = 'php'


class ContactDailyLimitTest(unittest.TestCase):
    def invoke_invalid(self, email):
        script = (
            "$_SERVER['REQUEST_METHOD']='POST'; $_POST=json_decode(base64_decode('"
            + base64.b64encode(json.dumps({'name': 'Sender', 'email': email, 'message': 'Hello'}).encode()).decode()
            + "'),true)"
            + '; include ' + json.dumps(str(ROOT / 'contact.php').replace('\\', '/')) + ';'
        )
        result = subprocess.run([PHP, '-r', script], cwd=ROOT, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        return json.loads(result.stdout)

    def test_only_valid_gmail_addresses_are_accepted_before_database_access(self):
        for email in ('example@yahoo.com', 'person@gmail.com.fake', 'person+test@notgmail.com', 'bad@gmail.com\nX'):
            with self.subTest(email=email):
                response = self.invoke_invalid(email)
                self.assertFalse(response['success'])
                self.assertIn('gmail', response['message'].lower())

    def test_daily_limit_is_reserved_atomically_with_contact_message(self):
        php = (ROOT / 'contact.php').read_text(encoding='utf-8')
        schema = (ROOT / 'database/contact_daily_limits.sql').read_text(encoding='utf-8')
        self.assertIn('PRIMARY KEY (email, submitted_on)', schema)
        self.assertIn('UTC_DATE()', php)
        self.assertIn('begin_transaction()', php)
        self.assertIn('INSERT INTO contact_daily_limits', php)
        self.assertIn('INSERT INTO contact_messages', php)
        self.assertIn('rollback()', php)
        self.assertIn('commit()', php)
        self.assertIn('1062', php)
        self.assertIn('429', php)
        self.assertLess(php.index('begin_transaction()'), php.index('INSERT INTO contact_daily_limits'))
        self.assertLess(php.index('INSERT INTO contact_daily_limits'), php.index('INSERT INTO contact_messages'))
        self.assertLess(php.index('INSERT INTO contact_messages'), php.index('commit()'))

    def test_missing_method_and_invalid_field_types_are_rejected(self):
        for email in ([], {}, 42, ''):
            with self.subTest(email=email):
                self.assertFalse(self.invoke_invalid(email)['success'])


if __name__ == '__main__':
    unittest.main()