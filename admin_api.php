<?php
/**
 * Admin API Endpoint
 * Handles all admin operations: users, pickups, issues, schedules
 */
session_start();
require_once 'config.php';
require_once 'schedule_utils.php';

header('Content-Type: application/json; charset=utf-8');

// Check if user is logged in and is an admin
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized. Please log in.']);
    exit;
}

$userId = $_SESSION['user_id'];
$role = $_SESSION['user_role'] ?? 'user';

if ($role !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Admin access required.']);
    exit;
}

// Get request method and action
$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $data['action'] ?? $_GET['action'] ?? '';
$pickupStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
$issueStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];

// Silence expected missing-table warnings on older installations; the
// schedules action below supplies safe defaults when the table is unavailable.
mysqli_report(MYSQLI_REPORT_OFF);

function defaultSchedules(): array
{
    return [
        ['id' => 1, 'waste_type' => 'General Waste', 'icon' => '🗑️', 'day_of_week' => 'Monday', 'time_slot' => '07:00 AM - 10:00 AM', 'zone' => 'All Zones', 'frequency' => 'Weekly'],
        ['id' => 2, 'waste_type' => 'Recyclable Waste', 'icon' => '♻️', 'day_of_week' => 'Wednesday', 'time_slot' => '08:00 AM - 12:00 PM', 'zone' => 'All Zones', 'frequency' => 'Weekly'],
        ['id' => 3, 'waste_type' => 'Organic Waste', 'icon' => '🌿', 'day_of_week' => 'Friday', 'time_slot' => '07:00 AM - 10:00 AM', 'zone' => 'All Zones', 'frequency' => 'Weekly'],
        ['id' => 4, 'waste_type' => 'Hazardous Waste', 'icon' => '⚠️', 'day_of_week' => 'Saturday', 'time_slot' => '09:00 AM - 01:00 PM', 'zone' => 'All Zones', 'frequency' => 'Bi-Weekly']
    ];
}

function ensureAnnouncementsTable(mysqli $conn): bool
{
    return $conn->query("CREATE TABLE IF NOT EXISTS announcements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        message TEXT NOT NULL,
        created_by INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci") === true;
}

function ensureNotificationsTable(mysqli $conn): bool
{
    if (!$conn->query("CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        pickup_request_id INT DEFAULT NULL,
        status VARCHAR(30) NOT NULL,
        message TEXT NOT NULL,
        created_by INT DEFAULT NULL,
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_notifications_user (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci")) {
        return false;
    }

    // Older copies created this table with pickup_id and without created_by.
    // Add the current columns when upgrading such an installation.
    $columns = [];
    $result = $conn->query("SHOW COLUMNS FROM notifications");
    if ($result) {
        while ($column = $result->fetch_assoc()) {
            $columns[$column['Field']] = true;
        }
        $result->free();
    }
    if (!isset($columns['pickup_request_id']) && !isset($columns['pickup_id'])) {
        if (!$conn->query("ALTER TABLE notifications ADD COLUMN pickup_request_id INT DEFAULT NULL AFTER user_id")) {
            return false;
        }
    }
    if (!isset($columns['created_by']) && !$conn->query("ALTER TABLE notifications ADD COLUMN created_by INT DEFAULT NULL AFTER message")) {
        return false;
    }
    return true;
}

// Handle different actions
switch ($action) {

    case 'summary':
        // Get summary statistics
        $totalUsers = $conn->query("SELECT COUNT(*) as count FROM users")->fetch_assoc()['count'];
        $totalPickups = $conn->query("SELECT COUNT(*) as count FROM pickup_requests")->fetch_assoc()['count'];
        $pendingPickups = $conn->query("SELECT COUNT(*) as count FROM pickup_requests WHERE status='Pending'")->fetch_assoc()['count'];
        $totalIssues = $conn->query("SELECT COUNT(*) as count FROM reported_issues")->fetch_assoc()['count'];

        echo json_encode([
            'success' => true,
            'data' => [
                'total_users' => $totalUsers,
                'total_pickups' => $totalPickups,
                'pending_pickups' => $pendingPickups,
                'total_issues' => $totalIssues
            ]
        ]);
        break;

    case 'users':
        // Get all users
        $result = $conn->query("SELECT id, full_name, email, role, created_at FROM users ORDER BY id DESC");
        $users = [];
        while ($row = $result->fetch_assoc()) {
            $users[] = $row;
        }
        echo json_encode(['success' => true, 'data' => $users]);
        break;

    case 'pickups':
        // Get pickup requests with optional status filter
        $status = $data['status'] ?? $_GET['status'] ?? '';
        if ($status !== '') {
            $stmt = $conn->prepare("SELECT * FROM pickup_requests WHERE status = ? ORDER BY id DESC");
            $stmt->bind_param("s", $status);
            $stmt->execute();
            $result = $stmt->get_result();
        } else {
            $result = $conn->query("SELECT * FROM pickup_requests ORDER BY id DESC");
        }

        $pickups = [];
        while ($row = $result->fetch_assoc()) {
            $pickups[] = $row;
        }
        echo json_encode(['success' => true, 'data' => $pickups]);
        break;

    case 'issues':
        // Get issue reports with optional status filter
        $status = $data['status'] ?? $_GET['status'] ?? '';
        if ($status !== '') {
            $stmt = $conn->prepare("SELECT * FROM reported_issues WHERE status = ? ORDER BY id DESC");
            $stmt->bind_param("s", $status);
            $stmt->execute();
            $result = $stmt->get_result();
        } else {
            $result = $conn->query("SELECT * FROM reported_issues ORDER BY id DESC");
        }

        $issues = [];
        while ($row = $result->fetch_assoc()) {
            $issues[] = $row;
        }
        echo json_encode(['success' => true, 'data' => $issues]);
        break;



    case 'schedules':
        if (!ensureSchedulesTable($conn)) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Unable to load collection schedules.']);
            break;
        }
        $result = $conn->query("SELECT * FROM schedules ORDER BY CASE WHEN zone = 'All Zones' THEN 0 ELSE 1 END, zone ASC, id ASC");
        if (!$result) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Unable to load collection schedules.']);
            break;
        }
        $schedules = [];
        while ($row = $result->fetch_assoc()) {
            $schedules[] = $row;
        }
        echo json_encode(['success' => true, 'data' => $schedules]);
        break;

    case 'create_schedule':
    case 'update_schedule':
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
            break;
        }
        if (!ensureSchedulesTable($conn)) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Unable to prepare collection schedules.']);
            break;
        }
        $schedule = normalizeSchedulePayload($data);
        if ($schedule === null) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'Check the waste type, icon, day, time, zone, frequency, and description.']);
            break;
        }

        if ($action === 'create_schedule') {
            $stmt = $conn->prepare("INSERT INTO schedules (waste_type, icon, day_of_week, time_slot, zone, frequency, description, is_upcoming) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Unable to prepare the new schedule.']);
                break;
            }
            $stmt->bind_param('sssssssi', $schedule['waste_type'], $schedule['icon'], $schedule['day_of_week'], $schedule['time_slot'], $schedule['zone'], $schedule['frequency'], $schedule['description'], $schedule['is_upcoming']);
            $ok = $stmt->execute();
            $newId = $stmt->insert_id;
            $stmt->close();
            if (!$ok) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Unable to create the schedule.']);
                break;
            }
            echo json_encode(['success' => true, 'message' => 'Schedule added successfully.', 'data' => ['id' => $newId]]);
            break;
        }

        $id = filter_var($data['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if (!$id) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'Invalid schedule ID.']);
            break;
        }
        $stmt = $conn->prepare("UPDATE schedules SET waste_type = ?, icon = ?, day_of_week = ?, time_slot = ?, zone = ?, frequency = ?, description = ?, is_upcoming = ? WHERE id = ?");
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Unable to prepare the schedule update.']);
            break;
        }
        $stmt->bind_param('sssssssii', $schedule['waste_type'], $schedule['icon'], $schedule['day_of_week'], $schedule['time_slot'], $schedule['zone'], $schedule['frequency'], $schedule['description'], $schedule['is_upcoming'], $id);
        $ok = $stmt->execute();
        $changed = $stmt->affected_rows;
        $stmt->close();
        if (!$ok) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Unable to update the schedule.']);
            break;
        }
        if ($changed === 0) {
            $check = $conn->prepare("SELECT id FROM schedules WHERE id = ?");
            $check->bind_param('i', $id);
            $check->execute();
            $exists = $check->get_result()->num_rows > 0;
            $check->close();
            if (!$exists) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Schedule not found.']);
                break;
            }
        }
        echo json_encode(['success' => true, 'message' => 'Schedule updated successfully.']);
        break;

    case 'delete_schedule':
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
            break;
        }
        if (!ensureSchedulesTable($conn)) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Unable to prepare collection schedules.']);
            break;
        }
        $id = filter_var($data['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if (!$id) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'Invalid schedule ID.']);
            break;
        }
        $countResult = $conn->query("SELECT COUNT(*) AS total FROM schedules");
        $total = (int)($countResult->fetch_assoc()['total'] ?? 0);
        $countResult->free();
        if ($total <= 1) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'At least one schedule must remain.']);
            break;
        }
        $stmt = $conn->prepare("DELETE FROM schedules WHERE id = ?");
        $stmt->bind_param('i', $id);
        $ok = $stmt->execute();
        $deleted = $stmt->affected_rows > 0;
        $stmt->close();
        if (!$ok) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Unable to delete the schedule.']);
            break;
        }
        if (!$deleted) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Schedule not found.']);
            break;
        }
        echo json_encode(['success' => true, 'message' => 'Schedule deleted successfully.']);
        break;

    case 'announcements':
        if (!ensureAnnouncementsTable($conn)) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Unable to load announcements.']);
            break;
        }

        $result = $conn->query("SELECT id, title, message, created_at FROM announcements ORDER BY created_at DESC, id DESC");
        $announcements = [];
        while ($row = $result->fetch_assoc()) {
            $announcements[] = $row;
        }
        echo json_encode(['success' => true, 'data' => $announcements]);
        break;

    case 'contact_messages':
        if ($method !== 'GET') {
            http_response_code(405);
            header('Allow: GET');
            echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
            break;
        }
        $result = $conn->query('SELECT id, name, email, message, created_at FROM contact_messages ORDER BY created_at DESC, id DESC LIMIT 200');
        if (!$result) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Unable to load contact messages.']);
            break;
        }
        $messages = [];
        while ($row = $result->fetch_assoc()) $messages[] = $row;
        echo json_encode(['success' => true, 'data' => $messages]);
        break;

    case 'create_announcement':
        $title = trim($data['title'] ?? '');
        $message = trim($data['message'] ?? '');

        if ($title === '' || $message === '') {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'Please provide an announcement title and message.']);
            break;
        }

        if (mb_strlen($title) > 150 || mb_strlen($message) > 5000) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'The announcement is too long.']);
            break;
        }

        if (!ensureAnnouncementsTable($conn)) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Unable to save the announcement.']);
            break;
        }

        $stmt = $conn->prepare("INSERT INTO announcements (title, message, created_by) VALUES (?, ?, ?)");
        $stmt->bind_param('ssi', $title, $message, $userId);
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Announcement published successfully.']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Unable to save the announcement.']);
        }
        $stmt->close();
        break;

    case 'delete_announcement':
        $id = filter_var($data['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if (!$id) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'Invalid announcement.']);
            break;
        }

        if (!ensureAnnouncementsTable($conn)) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Unable to remove the announcement.']);
            break;
        }

        $stmt = $conn->prepare("DELETE FROM announcements WHERE id = ?");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $deleted = $stmt->affected_rows > 0;
        $stmt->close();

        if (!$deleted) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Announcement not found.']);
            break;
        }

        echo json_encode(['success' => true, 'message' => 'Announcement removed.']);
        break;

    case 'update_pickup_status':
        // Update pickup request status
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
            exit;
        }

        $id = $data['id'] ?? 0;
        $newStatus = $data['status'] ?? '';

        if ($id <= 0 || !in_array($newStatus, $pickupStatuses, true)) {
            echo json_encode(['success' => false, 'message' => 'Invalid pickup status.']);
            exit;
        }

        $stmt = $conn->prepare("UPDATE pickup_requests SET status = ? WHERE id = ?");
        $stmt->bind_param("si", $newStatus, $id);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Status updated successfully.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update status.']);
        }
        $stmt->close();
        break;

    case 'send_pickup_notification':
    case 'send_issue_notification':
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
            break;
        }
        if (!ensureNotificationsTable($conn)) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Unable to prepare notifications.']);
            break;
        }
        $isPickup = $action === 'send_pickup_notification';
        $recordId = filter_var($data[$isPickup ? 'pickup_id' : 'issue_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        $status = is_string($data['status'] ?? null) ? trim($data['status']) : '';
        $message = is_string($data['message'] ?? null) ? trim($data['message']) : '';
        if (!$recordId || !in_array($status, $isPickup ? $pickupStatuses : $issueStatuses, true) || $message === '') {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'Please provide a valid status and message.']);
            break;
        }
        if (strlen(($isPickup ? 'Pickup #' : 'Waste report #') . $recordId . ': ' . $message) > 2000) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'The message must be 2,000 characters or fewer.']);
            break;
        }
        $table = $isPickup ? 'pickup_requests' : 'reported_issues';
        $notificationPickupColumn = 'pickup_request_id';
        $columnsResult = $conn->query("SHOW COLUMNS FROM notifications");
        if ($columnsResult) {
            $notificationColumns = [];
            while ($column = $columnsResult->fetch_assoc()) {
                $notificationColumns[$column['Field']] = true;
            }
            $columnsResult->free();
            if (!isset($notificationColumns['pickup_request_id']) && isset($notificationColumns['pickup_id'])) {
                $notificationPickupColumn = 'pickup_id';
            }
        }
        try {
            $conn->begin_transaction();
            $lookup = $conn->prepare("SELECT user_id FROM {$table} WHERE id = ? FOR UPDATE");
            if (!$lookup) throw new RuntimeException('Unable to find the request.');
            $lookup->bind_param('i', $recordId);
            if (!$lookup->execute()) throw new RuntimeException('Unable to find the request.');
            $request = $lookup->get_result()->fetch_assoc();
            $lookup->close();
            $recipientId = (int)($request['user_id'] ?? 0);
            if (!$recipientId) {
                $conn->rollback();
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => 'This record is not linked to a resident account.']);
                break;
            }
            $update = $conn->prepare("UPDATE {$table} SET status = ? WHERE id = ?");
            if (!$update) throw new RuntimeException('Unable to update status.');
            $update->bind_param('si', $status, $recordId);
            if (!$update->execute()) throw new RuntimeException('Unable to update status.');
            $update->close();

            // Report notifications leave the pickup reference NULL; the message identifies the report.
            $notificationMessage = ($isPickup ? 'Pickup #' : 'Waste report #') . $recordId . ': ' . $message;
            $pickupReference = $isPickup ? $recordId : null;
            $stmt = $conn->prepare("INSERT INTO notifications (user_id, {$notificationPickupColumn}, status, message, created_by) VALUES (?, ?, ?, ?, ?)");
            if (!$stmt) throw new RuntimeException('Unable to prepare notification.');
            $stmt->bind_param('iissi', $recipientId, $pickupReference, $status, $notificationMessage, $userId);
            if (!$stmt->execute()) throw new RuntimeException('Unable to save notification.');
            $stmt->close();
            $conn->commit();
            echo json_encode(['success' => true, 'message' => 'Status updated and notification sent.']);
        } catch (Throwable $error) {
            $conn->rollback();
            error_log('Admin notification failed: ' . $error->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Unable to send update. No status change was saved.']);
        }
        break;

    case 'update_issue_status':
        // Update issue report status
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
            exit;
        }

        $id = $data['id'] ?? 0;
        $newStatus = $data['status'] ?? '';

        if ($id <= 0 || !in_array($newStatus, $issueStatuses, true)) {
            echo json_encode(['success' => false, 'message' => 'Invalid issue status.']);
            exit;
        }

        $stmt = $conn->prepare("UPDATE reported_issues SET status = ? WHERE id = ?");
        $stmt->bind_param("si", $newStatus, $id);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Status updated successfully.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update status.']);
        }
        $stmt->close();
        break;

    case 'analytics':
        // Get analytics data
        $pickupStats = [
            'Pending' => $conn->query("SELECT COUNT(*) as count FROM pickup_requests WHERE status='Pending'")->fetch_assoc()['count'],
            'Confirmed' => $conn->query("SELECT COUNT(*) as count FROM pickup_requests WHERE status='Confirmed'")->fetch_assoc()['count'],
            'Completed' => $conn->query("SELECT COUNT(*) as count FROM pickup_requests WHERE status='Completed'")->fetch_assoc()['count'],
            'Cancelled' => $conn->query("SELECT COUNT(*) as count FROM pickup_requests WHERE status='Cancelled'")->fetch_assoc()['count']
        ];

        $issueStats = [
            'Open' => $conn->query("SELECT COUNT(*) as count FROM reported_issues WHERE status='Open'")->fetch_assoc()['count'],
            'In Progress' => $conn->query("SELECT COUNT(*) as count FROM reported_issues WHERE status='In Progress'")->fetch_assoc()['count'],
            'Resolved' => $conn->query("SELECT COUNT(*) as count FROM reported_issues WHERE status='Resolved'")->fetch_assoc()['count'],
            'Closed' => $conn->query("SELECT COUNT(*) as count FROM reported_issues WHERE status='Closed'")->fetch_assoc()['count']
        ];

        $wasteTypeStats = [
            'General Waste' => $conn->query("SELECT COUNT(*) as count FROM pickup_requests WHERE waste_type='General Waste'")->fetch_assoc()['count'],
            'Recyclable' => $conn->query("SELECT COUNT(*) as count FROM pickup_requests WHERE waste_type LIKE '%Recyclable%'")->fetch_assoc()['count'],
            'Organic' => $conn->query("SELECT COUNT(*) as count FROM pickup_requests WHERE waste_type LIKE '%Organic%'")->fetch_assoc()['count'],
            'Hazardous' => $conn->query("SELECT COUNT(*) as count FROM pickup_requests WHERE waste_type LIKE '%Hazardous%'")->fetch_assoc()['count']
        ];

        // Get recent activity
        $activities = [];
        $recentPickups = $conn->query("SELECT 'pickup' as type, user_name, created_at FROM pickup_requests ORDER BY created_at DESC LIMIT 5");
        $recentIssues = $conn->query("SELECT 'issue' as type, user_name, created_at FROM reported_issues ORDER BY created_at DESC LIMIT 5");

        while ($row = $recentPickups->fetch_assoc()) {
            $activities[] = ['type' => 'pickup', 'message' => $row['user_name'] . ' requested a pickup', 'time' => $row['created_at']];
        }

        while ($row = $recentIssues->fetch_assoc()) {
            $activities[] = ['type' => 'issue', 'message' => $row['user_name'] . ' reported an issue', 'time' => $row['created_at']];
        }

        usort($activities, function($a, $b) { return strtotime($b['time']) - strtotime($a['time']); });
        $activities = array_slice($activities, 0, 10);

        echo json_encode(['success' => true, 'data' => [
            'pickup_stats' => $pickupStats,
            'issue_stats' => $issueStats,
            'waste_type_stats' => $wasteTypeStats,
            'recent_activity' => $activities
        ]]);
        break;

    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid action.']);
        break;
}

$conn->close();
?>
