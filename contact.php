<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

$name = is_string($_POST['name'] ?? null) ? trim($_POST['name']) : '';
$email = is_string($_POST['email'] ?? null) ? strtolower(trim($_POST['email'])) : '';
$message = is_string($_POST['message'] ?? null) ? trim($_POST['message']) : '';
$length = static function (string $value): int {
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
};
if ($name === '' || $length($name) > 100 || !filter_var($email, FILTER_VALIDATE_EMAIL)
    || !preg_match('/^[^@\s]+@gmail\.com$/D', $email)
    || strlen($email) > 150 || $message === '' || $length($message) > 5000) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Please enter a valid name, Gmail address, and message.']);
    exit;
}

try {
    require_once __DIR__ . '/config.php';
    $conn->begin_transaction();
    $stmt = $conn->prepare('INSERT INTO contact_daily_limits (email, submitted_on) VALUES (?, UTC_DATE())');
    if (!$stmt) throw new RuntimeException('Unable to prepare daily contact limit.');
    $stmt->bind_param('s', $email);
    try {
        $reserved = $stmt->execute();
        $code = $stmt->errno;
    } catch (mysqli_sql_exception $e) {
        $reserved = false;
        $code = (int) $e->getCode();
    }
    if (!$reserved) {
        $stmt->close();
        if ($code === 1062) {
            $conn->rollback();
            http_response_code(429);
            echo json_encode(['success' => false, 'message' => 'This Gmail address has already sent a message today. Please try again tomorrow (UTC).']);
            exit;
        }
        throw new RuntimeException('Unable to reserve daily contact limit.');
    }
    $stmt->close();
    $stmt = $conn->prepare('INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)');
    if (!$stmt) throw new RuntimeException('Unable to prepare contact message.');
    $stmt->bind_param('sss', $name, $email, $message);
    if (!$stmt->execute()) throw new RuntimeException('Unable to save contact message.');
    $stmt->close();
    if (!$conn->commit()) throw new RuntimeException('Unable to commit contact message.');
    echo json_encode(['success' => true, 'message' => 'Thanks! Your message was sent.']);
} catch (Throwable $e) {
    if (isset($conn) && $conn instanceof mysqli) {
        try {
            $conn->rollback();
        } catch (Throwable $rollbackError) {
            error_log('Contact rollback failed: ' . $rollbackError->getMessage());
        }
    }
    error_log('Contact submission failed: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Unable to save your message. Please try again later.']);
}
