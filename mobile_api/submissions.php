<?php
require __DIR__ . '/bootstrap.php';
try {
    $action = $_GET['action'] ?? '';
    $conn = mobileDb();
    $user = mobileUser($conn);
    $id = (int)$user['id'];
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && ($action === 'pickups' || $action === 'issues')) {
        $table = $action === 'pickups' ? 'pickup_requests' : 'reported_issues';
        $stmt = $conn->prepare("SELECT * FROM $table WHERE user_id = ? ORDER BY id DESC LIMIT 50");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        mobileReply(200, ['success' => true, 'data' => $stmt->get_result()->fetch_all(MYSQLI_ASSOC)]);
    }
    mobileMethod('POST');
    if ($action !== 'pickup' && $action !== 'issue') mobileReply(400, ['success' => false, 'message' => 'Invalid action.']);
    $data = mobileJson();
    $field = static function (string $key, int $length) use ($data): ?string {
        if (!isset($data[$key]) || !is_string($data[$key])) return null;
        $value = trim($data[$key]);
        return strlen($value) <= $length ? $value : null;
    };
    if ($action === 'pickup') {
        $name = $user['full_name'];
        $address = $field('address', 255);
        $type = $field('waste_type', 100);
        $date = $field('preferred_date', 10);
        $notes = array_key_exists('notes', $data) ? $field('notes', 10000) : '';
        $parsed = $date ? DateTimeImmutable::createFromFormat('!Y-m-d', $date) : false;
        if (!$address || !$type || $notes === null || !$parsed || $parsed->format('Y-m-d') !== $date || $parsed < new DateTimeImmutable('today')) {
            mobileReply(422, ['success' => false, 'message' => 'Provide address, waste type and a valid current or future date.']);
        }
        $stmt = $conn->prepare('INSERT INTO pickup_requests (user_id, user_name, address, waste_type, preferred_date, notes) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->bind_param('isssss', $id, $name, $address, $type, $date, $notes);
        $key = 'request_id';
    } else {
        $name = $user['full_name'];
        $type = $field('issue_type', 100);
        $location = $field('location', 255);
        $description = $field('description', 10000);
        if (!$type || !$location || !$description) mobileReply(422, ['success' => false, 'message' => 'Provide issue type, location and description.']);
        $stmt = $conn->prepare('INSERT INTO reported_issues (user_id, user_name, issue_type, location, description) VALUES (?, ?, ?, ?, ?)');
        $stmt->bind_param('issss', $id, $name, $type, $location, $description);
        $key = 'report_id';
    }
    $stmt->execute();
    mobileReply(201, ['success' => true, $key => $conn->insert_id]);
} catch (Throwable $e) {
    error_log('Mobile submission failure: ' . $e->getMessage());
    mobileReply(500, ['success' => false, 'message' => 'Unable to submit request.']);
}