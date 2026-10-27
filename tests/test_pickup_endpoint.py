"""Regression checks for the dashboard's PHP submission endpoint.

Run with: py -m unittest discover -s tests
"""
import json
import subprocess
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ENDPOINT = ROOT / "api_pickup.php"
PHP = Path("C:/xampp/php/php.exe")


class PickupEndpointTest(unittest.TestCase):
    def invoke(self, method):
        script = (
            "$_SERVER['REQUEST_METHOD'] = " + json.dumps(method) + "; "
            "$_SERVER['HTTP_ACCEPT'] = 'application/json'; "
            "include " + json.dumps(str(ENDPOINT).replace('\\', '/')) + ";"
        )
        result = subprocess.run(
            [str(PHP), "-r", script], cwd=ROOT, capture_output=True, text=True
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        return json.loads(result.stdout)

    def test_anonymous_submission_is_rejected_as_json(self):
        response = self.invoke("POST")
        self.assertFalse(response["success"])
        self.assertIn("log in", response["message"].lower())

    def test_non_post_request_is_rejected_as_json(self):
        response = self.invoke("GET")
        self.assertFalse(response["success"])
        self.assertIn("method", response["message"].lower())


if __name__ == "__main__":
    unittest.main()