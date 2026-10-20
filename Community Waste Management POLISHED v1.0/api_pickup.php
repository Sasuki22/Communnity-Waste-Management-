<?php
/**
 * API Endpoint: Pickup Requests & Issue Reports
 * Saves data directly to MySQL (phpMyAdmin) - community_db
 */
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once 'config.php';

// Create tables if they don't exist
$conn->query("
    CREATE TABLE IF NOT EXISTS `pickup_requests` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `user_id` INT DEFAULT NULL,
        `user_name` VARCHAR(100) NOT NULL,
        `address` VARCHAR(255) NOT NULL,
        `waste_type` VARCHAR(100) NOT NULL DEFAULT 'General Waste',
        `preferred_date` DATE NOT NULL,
        `notes` TEXT,
        `status` ENUM('Pending','Confirmed','Completed','Cancelled') DEFAULT 'Pending',
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
");

$conn->query("
    CREATE TABLE IF NOT EXISTS `reported_issues` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `user_id` INT DEFAULT NULL,
        `user_name` VARCHAR(100) NOT NULL,
        `issue_type` VARCHAR(100) NOT NULL,
        `location` VARCHAR(255) NOT NULL,
        `description` TEXT,
        `status` ENUM('Open','In Progress','Resolved','Closed') DEFAULT 'Open',
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
");

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$action = $data['action'] ?? '';

// Get logged-in user info
$userId = $_SESSION['user_id'] ?? null;
$sessionName = $_SESSION['user_name'] ?? 'Guest';

switch ($action) {

    case 'pickup':
        $userName = trim($data['user_name'] ?? $sessionName);
        $address = trim($data['address'] ?? '');
        $wasteType = trim($data['waste_type'] ?? 'General Waste');
        $preferredDate = trim($data['preferred_date'] ?? '');
        $notes = trim($data['notes'] ?? '');

        if ($userName === '' || $address === '' || $preferredDate === '') {
            echo json_encode([
                'success' => false,
                'message' => 'Please provide full name, address, and preferred date.'
            ]);
            exit;
        }

        $stmt = $conn->prepare(
            "INSERT INTO pickup_requests (user_id, user_name, address, waste_type, preferred_date, notes)
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmt->bind_param("isssss", $userId, $userName, $address, $wasteType, $preferredDate, $notes);

        if ($stmt->execute()) {
            $newId = $stmt->insert_id;
            echo json_encode([
                'success' => true,
                'message' => 'Pickup request submitted successfully.',
                'request_id' => $newId
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to save pickup request.'
            ]);
        }
        $stmt->close();
        break;

    case 'issue':
        $userName = trim($data['user_name'] ?? $sessionName);
        $issueType = trim($data['issue_type'] ?? '');
        $location = trim($data['location'] ?? '');
        $description = trim($data['description'] ?? '');

        if ($issueType === '' || $location === '') {
            echo json_encode([
                'success' => false,
                'message' => 'Please provide issue type and location.'
            ]);
            exit;
        }

        $stmt = $conn->prepare(
            "INSERT INTO reported_issues (user_id, user_name, issue_type, location, description)
             VALUES (?, ?, ?, ?, ?)"
        );
        $stmt->bind_param("issss", $userId, $userName, $issueType, $location, $description);

        if ($stmt->execute()) {
            $newId = $stmt->insert_id;
            echo json_encode([
                'success' => true,
                'message' => 'Issue report submitted successfully.',
                'report_id' => $newId
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to save issue report.'
            ]);
        }
        $stmt->close();
        break;

    default:
        echo json_encode([
            'success' => false,
            'message' => 'Invalid action. Use "pickup" or "issue".'
        ]);
        break;
}

$conn->close();
?>
