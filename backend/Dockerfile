# ============================================================
# Community Waste Management - Python Flask API
# Serves the REST endpoints on port 5000 inside its container.
# Host port 5000 is mapped to this container in docker-compose.yml.
# ============================================================
FROM python:3.12-slim

WORKDIR /app

# Install Python dependencies first (better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the Flask backend source code into the image
COPY . /app/backend/

# Dedicated directory for the persistent SQLite database. docker-compose
# mounts the "sqlite_data" volume here so schedule data survives restarts.
RUN mkdir -p /app/data

WORKDIR /app/backend

EXPOSE 5000

# Start the Flask app with gunicorn (already in requirements.txt).
# "app:app" = module "app.py", object "app" (created by create_app()).
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "120", "app:app"]