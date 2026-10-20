# -*- coding: utf-8 -*-
"""
Community Waste Management - Flask Backend Runner
Run with: py run.py (inside backend/) or py backend/run.py (from root)
"""
import os
import sys

# Ensure current and root directories are in sys.path
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))
for p in [BASE_DIR, ROOT_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

from app import app
from config import PORT, HOST, DEBUG

if __name__ == "__main__":
    print("==================================================")
    print("  Community Waste Management System Flask API")
    print("  Running on http://127.0.0.1:{}".format(PORT))
    print("  Endpoints:")
    print("    - http://127.0.0.1:{}/api/schedules".format(PORT))
    print("    - http://127.0.0.1:{}/api/schedules/upcoming".format(PORT))
    print("    - http://127.0.0.1:{}/api/schedules/zones".format(PORT))
    print("==================================================")
    app.run(host=HOST, port=PORT, debug=DEBUG)
