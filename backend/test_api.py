# -*- coding: utf-8 -*-
import unittest
import json
from backend.app import create_app

class ScheduleApiTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()

    def test_root_endpoint(self):
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data.get("status"), "online")

    def test_health_endpoint(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data.get("status"), "healthy")

    def test_get_upcoming_schedules(self):
        res = self.client.get("/api/schedules/upcoming")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertGreaterEqual(len(data.get("data")), 4)

        # Check for expected waste types
        waste_types = [item["waste_type"] for item in data["data"]]
        self.assertIn("General Waste", waste_types)
        self.assertIn("Recyclable Waste", waste_types)
        self.assertIn("Organic Waste", waste_types)
        self.assertIn("Hazardous Waste", waste_types)

    def test_get_all_schedules(self):
        res = self.client.get("/api/schedules")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertGreater(data.get("count"), 0)

    def test_get_schedules_with_zone_filter(self):
        res = self.client.get("/api/schedules?zone=Zone%201")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        for item in data["data"]:
            self.assertIn(item["zone"], ["Zone 1", "All Zones"])

    def test_get_zone_summary(self):
        res = self.client.get("/api/schedules/zones")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertIn("Zone 1", data["data"])
        self.assertIn("Zone 2", data["data"])
        self.assertIn("Zone 3", data["data"])

    def test_get_single_schedule(self):
        res = self.client.get("/api/schedules/1")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data["data"]["id"], 1)

    def test_pickup_request_submission(self):
        payload = {
            "user_name": "Shin Saki",
            "address": "Block 10 Lot 5, Zone 2",
            "waste_type": "Bulky Items",
            "preferred_date": "2026-10-15",
            "notes": "Old sofa and wooden desk."
        }
        res = self.client.post(
            "/api/schedules/request",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertIn("request_id", data)

if __name__ == "__main__":
    unittest.main()
