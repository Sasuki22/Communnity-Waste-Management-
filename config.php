<?php
/**
 * Community Waste Management - Database configuration TEMPLATE.
 *
 * Copy this file to "config.php" and adjust if needed:
 *     Copy-Item config.example.php config.php
 *
 * "config.php" is gitignored (it can hold local credentials), which is
 * why cloned copies of the repo do NOT include it. This template lets
 * anyone recreate it.
 *
 * Values come from environment variables so the SAME file works in:
 *   - Docker   (docker-compose sets DB_HOST=db, DB_USERNAME, DB_PASSWORD)
 *   - XAMPP    (no env vars -> falls back to localhost / root / empty)
 */
$host     = getenv('DB_HOST') !== false ? getenv('DB_HOST') : 'localhost';
$username = getenv('DB_USERNAME') !== false ? getenv('DB_USERNAME') : 'root';
$password = getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : '';
$database = getenv('DB_DATABASE') !== false ? getenv('DB_DATABASE') : 'community_db';

$conn = new mysqli($host, $username, $password, $database);

if ($conn->connect_error) {
    error_log("Database connection failed: " . $conn->connect_error);
    http_response_code(500);
    // Return a response format the requesting page can handle without
    // revealing any database credentials.
    $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
    if (stripos($accept, 'application/json') !== false) {
        header('Content-Type: application/json; charset=utf-8');
        exit(json_encode([
            'success' => false,
            'message' => 'Database connection failed. Please try again later.'
        ]));
    }
    exit('Database connection failed.');
}

$conn->set_charset("utf8mb4");