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

$notificationsCreated = $conn->query("CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    pickup_request_id INT DEFAULT NULL,
    status VARCHAR(50) NOT NULL,
    message VARCHAR(2000) NOT NULL,
    created_by INT DEFAULT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notifications_user (user_id, created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

// Support installations created by an earlier version that used pickup_id.
if ($notificationsCreated) {
    $notificationColumns = [];
    $columnsResult = $conn->query("SHOW COLUMNS FROM notifications");
    if ($columnsResult) {
        while ($column = $columnsResult->fetch_assoc()) $notificationColumns[$column['Field']] = true;
        $columnsResult->free();
    }
    if (!isset($notificationColumns['pickup_request_id']) && !isset($notificationColumns['pickup_id'])) {
        $notificationsCreated = $conn->query("ALTER TABLE notifications ADD COLUMN pickup_request_id INT DEFAULT NULL AFTER user_id");
    }
    if ($notificationsCreated && !isset($notificationColumns['created_by'])) {
        $notificationsCreated = $conn->query("ALTER TABLE notifications ADD COLUMN created_by INT DEFAULT NULL AFTER message");
    }
}

if ($action === 'notifications') {
    if (!$notificationsCreated) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Unable to load notifications.']);
        $conn->close();
        exit;
    }
    $userId = (int)$_SESSION['user_id'];
    $pickupColumn = 'pickup_request_id';
    $columnsResult = $conn->query("SHOW COLUMNS FROM notifications");
    if ($columnsResult) {
        $notificationColumns = [];
        while ($column = $columnsResult->fetch_assoc()) $notificationColumns[$column['Field']] = true;
        $columnsResult->free();
        if (!isset($notificationColumns['pickup_request_id']) && isset($notificationColumns['pickup_id'])) {
            $pickupColumn = 'pickup_id';
        }
    }
    $stmt = $conn->prepare("SELECT id, {$pickupColumn} AS pickup_request_id, status, message, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 20");
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Unable to query notifications.']);
        $conn->close();
        exit;
    }
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $notifications = [];
    while ($row = $result->fetch_assoc()) $notifications[] = $row;
    $stmt->close();
    echo json_encode(['success' => true, 'data' => $notifications]);
    $conn->close();
    exit;
}

if ($action === 'mark_notifications_read') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        header('Allow: POST');
        echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
        $conn->close();
        exit;
    }

    $stmt = $conn->prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0');
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Unable to update notification status.']);
        $conn->close();
        exit;
    }
    $stmt->bind_param('i', $_SESSION['user_id']);
    $updated = $stmt->execute();
    $stmt->close();
    if (!$updated) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Unable to mark notifications as read.']);
        $conn->close();
        exit;
    }
    echo json_encode(['success' => true]);
    $conn->close();
    exit;
}

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