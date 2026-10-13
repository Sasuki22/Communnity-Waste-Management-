# Run the Community Waste Management System with Docker

This guide explains how to run the website, PHP backend, MySQL database, and Flask API with Docker Desktop on Windows.

## Quick start

Once the setup is complete, start the services from the project folder:

```powershell
docker compose up -d
```

Open the website at **http://localhost:8080/**. The Flask API health check is at **http://localhost:5000/api/health**.

## Requirements

- Windows with Docker Desktop installed and running.
- Docker Compose v2 (`docker compose version`).
- Host ports **8080** and **5000** available.
- An internet connection the first time you build, so Docker can download the base images.

MySQL runs inside Docker and does not publish port 3306 on the host. It can therefore coexist with a local XAMPP MySQL service.

## First-time setup

### 1. Open PowerShell in the project folder

For this machine, run:

```powershell
cd "C:\xampp\htdocs\Community Waste Management"
```

If you put or cloned the project elsewhere, change the path to that folder. The commands below should be run from the folder containing `docker-compose.yml`.

### 2. Start Docker Desktop

Launch Docker Desktop and wait until it reports that the Docker engine is running. Confirm Compose is available:

```powershell
docker compose version
```

### 3. Create local configuration files if they do not exist

`config.php` is intentionally excluded from Git, so a fresh checkout must copy the example file. The `.env` file stores local Docker settings and should not be committed. These commands preserve existing files:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
if (-not (Test-Path config.php)) { Copy-Item config.example.php config.php }
```

For a local demo, the example Compose defaults can be used. Before sharing the application or exposing it to a network, open `.env` and replace the example passwords and Flask secret with unique, strong values. Keep `.env` private.

### 4. Build and start the containers

```powershell
docker compose up --build -d
```

The first build downloads and builds the PHP and Python images and may take a few minutes. MySQL initializes the tables and default schedules on its first start. Check the services:

```powershell
docker compose ps
```

Wait until the `db` and `api` services show **healthy**. The `web` service should show **Up**.

### 5. Open the website

In a browser, visit:

**http://localhost:8080/**

Register an account on the site, then log in. The API can be checked separately at **http://localhost:5000/api/health**; a healthy response includes `"status":"healthy"`.

## Give your account admin access

New accounts are regular users by default. To give your own registered account admin access:

1. Register the account at **http://localhost:8080/** if you have not already, and note the email address you used.
2. In a PowerShell window, connect to the MySQL database inside Docker from the project folder:

   ```powershell
   cd "C:\xampp\htdocs\Community Waste Management"
   docker compose exec db mysql -u cwms -p community_db
   ```

   When prompted, enter the `MYSQL_PASSWORD` value from your `.env` file. The default demo value is `cwms_password`; characters will not appear as you type the password. If you changed `MYSQL_USER` or `DB_DATABASE` in `.env`, replace `cwms` or `community_db` in the command with your configured values.

3. At the MySQL prompt, replace `example@gmail.com` below with your registered email, then run:

   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'example@gmail.com';
   SELECT email, role FROM users WHERE email = 'example@gmail.com';
   EXIT;
   ```
or 
run this on vscode terminal 
---------
cd "C:\xampp\htdocs\Community Waste Management"

$dbUser = (docker compose exec -T db printenv MYSQL_USER | Out-String).Trim()
$dbName = (docker compose exec -T db printenv MYSQL_DATABASE | Out-String).Trim()
$dbPassword = (docker compose exec -T db printenv MYSQL_PASSWORD | Out-String).Trim()

$sql = "UPDATE users SET role = 'admin' WHERE email = 'example@gmail.com'; SELECT email, role FROM users WHERE email = 'example@gmail.com';"

docker compose exec -T db mysql "--user=$dbUser" "--password=$dbPassword" $dbName "--execute=$sql"
---------------

   Confirm that the `SELECT` result shows `admin`. If the `UPDATE` reports that zero rows were affected or the `SELECT` returns no rows, that email is not registered in this Docker database. Register it at the website and retry.

4. Log out of the website and log back in so the new role is loaded into your session. Open the admin dashboard at **http://localhost:8080/admin_modern.php**, or click **Admin Dashboard** from your user dashboard.

## Everyday commands

Run these commands from the project folder:

| Task | Command |
| --- | --- |
| Start the services | `docker compose up -d` |
| Open the website | Browse to `http://localhost:8080/` |
| Check container status | `docker compose ps` |
| Follow service logs | `docker compose logs -f web api db` |
| Stop the services | `docker compose down` |
| Rebuild after Dockerfile or dependency changes | `docker compose up --build -d` |

Press **Ctrl+C** to stop following logs; this does not stop the containers. `docker compose down` stops and removes the containers but keeps database data. To start them again, run `docker compose up -d`.

The website source is bind-mounted into the web container, so ordinary PHP, CSS, and JavaScript changes appear without rebuilding. Rebuild after changing a Dockerfile or backend dependencies.

## Database persistence and reset

MySQL and the Flask API store their data in Docker-managed named volumes. Normal container restarts and `docker compose down` preserve that data. **`docker compose down -v` permanently deletes those volumes**, including registered users, pickup records, and API schedules. Only use it when you intentionally want to erase the Docker database data and start over.

The SQL initialization script runs when the MySQL volume is first created; editing it later does not automatically reinitialize an existing database.

## Troubleshooting

- **The browser cannot open the site:** Make sure Docker Desktop is running and `docker compose ps` shows the `web` container as Up. Try `http://localhost:8080/` (not the XAMPP port-80 address).
- **A port is already in use:** Close the other program using port 8080 or 5000, then restart Compose. If you change the host API port from 5000, also update the API base URL in `config.js` to match; the browser uses that URL to reach Flask.
- **Registration reports a database error:** Check `docker compose ps` and `docker compose logs web db`. On an existing database volume, changing the credentials in `.env` does not change the MySQL user/password already stored in that volume.
- **Need more detail from the containers:** Run `docker compose logs --tail=100 web api db`.
- **Starting from a clean database:** `docker compose down -v` will erase the Docker-managed database and schedule data. Review the persistence warning above before running it.
