/**
 * Community Waste Management - Frontend API configuration.
 *
 * The browser never uses Docker-internal hostnames. It talks to the
 * Flask API through the host port that Docker maps to the API container
 * (http://localhost:5000 by default, see docker-compose.yml).
 *
 * Load this file BEFORE script.js / dashboard.js so the value is ready.
 */
window.CWM_API_BASE = window.CWM_API_BASE || "http://localhost:5000/api";