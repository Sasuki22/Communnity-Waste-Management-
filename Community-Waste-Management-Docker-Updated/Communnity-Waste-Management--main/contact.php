<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$message = trim($_POST['message'] ?? '');
if ($name === '' || mb_strlen($name) > 100 || !filter_var($email, FILTER_VALIDATE_EMAIL)
    || strlen($email) > 150 || $message === '' || mb_strlen($message) > 5000) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Please enter a valid name, email, and message.']);
    exit;
}

try {
    require_once __DIR__ . '/config.php';
    $stmt = $conn->prepare('INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)');
    if (!$stmt) throw new RuntimeException('Unable to prepare contact message.');
    $stmt->bind_param('sss', $name, $email, $message);
    if (!$stmt->execute()) throw new RuntimeException('Unable to save contact message.');
    $stmt->close();
    echo json_encode(['success' => true, 'message' => 'Thanks! Your message was sent.']);
} catch (Throwable $e) {
    error_log('Contact submission failed: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Unable to save your message. Please try again later.']);
}
