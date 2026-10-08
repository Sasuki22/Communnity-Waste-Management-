# Community Waste Management - Flask Backend

This directory contains the Python Flask REST API backend for the **Community Waste Management System**, providing live endpoints for collection schedules and pickup requests.

---

## 🚀 How to Run the Backend

From the project root:
```bash
py backend/run.py
```

Or from inside the `backend` folder:
```bash
cd backend
py run.py
```

The server starts by default at:
`http://127.0.0.1:5000`

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API Information & status |
| `GET` | `/api/health` | Healthcheck endpoint |
| `GET` | `/api/schedules` | List all schedules (Supports `?zone=Zone%201` & `?waste_type=General`) |
| `GET` | `/api/schedules/upcoming` | List weekly upcoming waste collection routines |
| `GET` | `/api/schedules/zones` | Zone-by-zone schedule summary |
| `GET` | `/api/schedules/<id>` | Detail of a single schedule |
| `POST` | `/api/schedules/request` | Submit special waste / bulky item pickup request |

---

## 🧪 Running Unit Tests

Run automated tests from the workspace root:
```bash
py -m unittest backend.test_api
```

---

## 📁 Architecture

- `app.py`: Flask application factory, CORS headers middleware, and route registration.
- `config.py`: Environment configuration and SQLite DB path.
- `database.py`: Database connection helpers, schema creation, and seeding.
- `routes/schedule_routes.py`: Schedule and pickup REST API endpoints.
- `test_api.py`: Automated test suite for backend routes.
- `community_waste.db`: SQLite database file (created automatically on startup).
