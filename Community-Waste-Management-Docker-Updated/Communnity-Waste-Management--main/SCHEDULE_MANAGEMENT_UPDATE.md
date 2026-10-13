# Schedule Management Update

This project ZIP combines the existing Docker-ready website with the tested schedule-management updates.

## Included changes

- Admin Collection Dates now supports adding, editing, and deleting schedules.
- `admin_api.php` stores schedule changes in `community_db.schedules` and checks the existing admin session/role.
- `dashboard_api.php` serves the authenticated resident schedule views from the same MySQL table.
- `schedule_utils.php` creates the schedule table when missing and seeds the ten default rows only when the table is empty.
- `admin_modern.js` includes both schedule interactions and the announcement load/publish/delete functions.
- The erroneous `.gitignore` rule that ignored `dashboard.js` has been removed.
- Docker documentation/comments now describe MySQL as the shared schedule source.

## Docker setup

1. In PowerShell, copy the example environment/config files only if they do not exist:

   ```powershell
   if (-not (Test-Path .env)) { Copy-Item .env.example .env }
   if (-not (Test-Path config.php)) { Copy-Item config.example.php config.php }
   ```

2. Edit `.env` to set private, strong passwords before sharing the project or exposing it to a network.
3. Start the stack from this folder:

   ```powershell
   docker compose up --build -d
   ```

4. Open `http://localhost:8080/`. The Flask API health endpoint is `http://localhost:5000/api/health`.

`config.php` is intentionally not included in this ZIP because it may contain local database credentials. The `config.example.php` template reads credentials from environment variables and is used with the Docker Compose setup. Do not commit real secrets.

The schedule changes passed PHP/JavaScript syntax checks. The Docker containers and runtime have not been launched in this packaging environment, so run the local Docker test on your computer.
