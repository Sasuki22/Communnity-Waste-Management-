# -*- coding: utf-8 -*-
import os
from pathlib import Path

# Load environment variables from .env file
def load_env():
    env_path = Path(__file__).parent.parent / '.env'
    if env_path.exists():
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                # Skip comments and empty lines
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    key = key.strip()
                    value = value.strip()
                    # Only set if not already in environment
                    if key not in os.environ:
                        os.environ[key] = value

# Load .env on import
load_env()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DATABASE_PATH = os.path.join(BASE_DIR, "community_waste.db")

# Get configuration from environment variables with fallback defaults
PORT = int(os.environ.get("FLASK_PORT", "5000"))
HOST = os.environ.get("FLASK_HOST", "0.0.0.0")
DEBUG = os.environ.get("FLASK_DEBUG", "True").lower() in ('true', '1', 'yes')
SECRET_KEY = os.environ.get("FLASK_SECRET_KEY", "community-waste-management-secret-key-2026")

