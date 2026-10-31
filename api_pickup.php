<?php
/** Save authenticated dashboard pickup requests and issue reports to MySQL. */
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function pickupReply(int $status, string $message, ?string $idKey = null, ?int $id = null): void
{
    http_response_code($status);
    $response = ['success' => $status >= 200 && $status < 300, 'message' => $message];
    if ($idKey !== null) $response[$idKey] = $id;
    echo json_encode($response, JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    pickupReply(405, 'Method not allowed.');
}
if (empty($_SESSION['user_id'])) pickupReply(401, 'Please log in to submit a request.');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    $originHost = parse_url($origin, PHP_URL_HOST);
    $requestHost = parse_url('http://' . ($_SERVER['HTTP_HOST'] ?? ''), PHP_URL_HOST);
    if (!$originHost || !$requestHost || strcasecmp($originHost, $requestHost) !== 0) {
        pickupReply(403, 'Invalid request origin.');
    }
}

$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) pickupReply(400, 'Invalid JSON request.');

function pickupField(array $data, string $key, int $maxLength): ?string
{
    if (!isset($data[$key]) || !is_string($data[$key])) return null;
    $value = trim($data[$key]);
    return strlen($value) <= $maxLength ? $value : null;
}

$action = pickupField($data, 'action', 20);
if ($action !== 'pickup' && $action !== 'issue') pickupReply(400, 'Invalid action.');

$userId = (int)$_SESSION['user_id'];
$userName = pickupField($data, 'user_name', 100);
$address = pickupField($data, 'address', 255);
$wasteType = pickupField($data, 'waste_type', 100);
$preferredDate = pickupField($data, 'preferred_date', 10);
$notes = pickupField($data, 'notes', 10000);
$issueType = pickupField($data, 'issue_type', 100);
$location = pickupField($data, 'location', 255);
$description = pickupField($data, 'description', 10000);

if ($action === 'pickup') {
    $validDate = $preferredDate !== null && preg_match('/^\d{4}-\d{2}-\d{2}$/', $preferredDate);
    if ($validDate) {
        $date = DateTimeImmutable::createFromFormat('!Y-m-d', $preferredDate);
        $validDate = $date !== false && $date->format('Y-m-d') === $preferredDate && $date >= new DateTimeImmutable('today');
    }
    if (!$userName || !$address || !$wasteType || !$validDate || $notes === null) {
        pickupReply(400, 'Provide a name, address, waste type, and a valid future or current preferred date.');
    }
} elseif (!$issueType || !$location || !$description) {
    pickupReply(400, 'Provide an issue type, location, and description.');
}

try {
    require_once __DIR__ . '/config.php';
    if ($action === 'issue') {
        // Use the authenticated identity, not a client-supplied name.
        $userName = $_SESSION['user_name'] ?? '';
        if (!is_string($userName) || $userName === '') pickupReply(401, 'Please log in again.');
        $stmt = $conn->prepare('INSERT INTO reported_issues (user_id, user_name, issue_type, location, description) VALUES (?, ?, ?, ?, ?)');
        $stmt->bind_param('issss', $userId, $userName, $issueType, $location, $description);
    } else {
        $stmt = $conn->prepare('INSERT INTO pickup_requests (user_id, user_name, address, waste_type, preferred_date, notes) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->bind_param('isssss', $userId, $userName, $address, $wasteType, $preferredDate, $notes);
    }
    $stmt->execute();
    $id = $conn->insert_id;
    $stmt->close();
    $conn->close();
    pickupReply(201, $action === 'pickup' ? 'Pickup request submitted.' : 'Issue report submitted.', $action === 'pickup' ? 'request_id' : 'report_id', $id);
} catch (Throwable $error) {
    error_log('Pickup/issue submission failed: ' . $error->getMessage());
    pickupReply(500, 'Unable to submit your request right now. Please try again later.');
}