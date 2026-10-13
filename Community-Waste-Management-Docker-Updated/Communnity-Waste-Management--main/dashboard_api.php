<?php
/**
 * Authenticated read-only data for the member dashboard.
 */
session_start();
header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Please log in to view dashboard updates.']);
    exit;
}

require_once 'config.php';
require_once 'schedule_utils.php';
mysqli_report(MYSQLI_REPORT_OFF);

$action = $_GET['action'] ?? '';

if ($action === 'schedules') {
    if (!ensureSchedulesTable($conn)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Unable to load collection schedules.']);
        $conn->close();
        exit;
    }

    $zone = trim((string)($_GET['zone'] ?? ''));
    $upcomingOnly = filter_var($_GET['upcoming'] ?? false, FILTER_VALIDATE_BOOLEAN);

    $stmt = null;
    if ($upcomingOnly) {
        $result = $conn->query("SELECT * FROM schedules WHERE is_upcoming = 1 ORDER BY id ASC");
    } elseif ($zone === 'All Zones') {
        $stmt = $conn->prepare("SELECT * FROM schedules WHERE zone = 'All Zones' ORDER BY id ASC");
        if ($stmt) {
            $stmt->execute();
            $result = $stmt->get_result();
        } else {
            $result = false;
        }
    } elseif ($zone !== '') {
        $stmt = $conn->prepare("SELECT * FROM schedules WHERE zone = ? OR zone = 'All Zones' ORDER BY CASE WHEN zone = 'All Zones' THEN 0 ELSE 1 END, id ASC");
        if ($stmt) {
            $stmt->bind_param('s', $zone);
            $stmt->execute();
            $result = $stmt->get_result();
        } else {
            $result = false;
        }
    } else {
        $result = $conn->query("SELECT * FROM schedules ORDER BY id ASC");
    }

    if (!$result) {
        if ($stmt) $stmt->close();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Unable to query collection schedules.']);
        $conn->close();
        exit;
    }

    $schedules = [];
    while ($row = $result->fetch_assoc()) {
        $schedules[] = $row;
    }
    if ($stmt) $stmt->close();
    echo json_encode(['success' => true, 'data' => $schedules]);
    $conn->close();
    exit;
}

if ($action !== 'announcements') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid dashboard action.']);
    $conn->close();
    exit;
}

$tableCreated = $conn->query("CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

if (!$tableCreated) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Unable to load announcements.']);
    $conn->close();
    exit;
}

$result = $conn->query('SELECT id, title, message, created_at FROM announcements ORDER BY created_at DESC, id DESC LIMIT 8');

if (!$result) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Unable to load announcements.']);
    $conn->close();
    exit;
}

$announcements = [];
while ($row = $result->fetch_assoc()) {
    $announcements[] = $row;
}

echo json_encode(['success' => true, 'data' => $announcements]);
$conn->close();