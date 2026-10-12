<?php
/**
 * Admin API Endpoint
 * Handles all admin operations: users, pickups, issues, schedules
 */
session_start();
require_once 'config.php';

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
        // Some existing installations predate the MySQL schedules table. Keep
        // the admin view useful by returning the app's default schedule data.
        $schedules = [];
        $result = @$conn->query("SELECT * FROM schedules ORDER BY id DESC");
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $schedules[] = $row;
            }
        }
        if (count($schedules) === 0) {
            $schedules = defaultSchedules();
        }
        echo json_encode(['success' => true, 'data' => $schedules]);
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
