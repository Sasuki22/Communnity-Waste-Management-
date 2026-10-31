<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function mobileReply(int $status, array $payload): void {
    http_response_code($status);
    echo json_encode($payload, JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function mobileDb(): mysqli {
    require __DIR__ . '/../config.php';
    return $conn;
}

function mobileJson(): array {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!is_array($data)) mobileReply(400, ['success' => false, 'message' => 'Invalid JSON request.']);
    return $data;
}

function mobileToken(): string {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/^Bearer ([a-f0-9]{64})$/iD', $header, $matches)) {
        mobileReply(401, ['success' => false, 'message' => 'Sign in required.']);
    }
    return strtolower($matches[1]);
}

function mobileUser(mysqli $conn): array {
    $digest = hash('sha256', mobileToken());
    $stmt = $conn->prepare("SELECT u.id, u.full_name, u.email, u.role, s.id AS session_id
        FROM mobile_sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > UTC_TIMESTAMP() LIMIT 1");
    $stmt->bind_param('s', $digest);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$user) mobileReply(401, ['success' => false, 'message' => 'Session expired. Please sign in.']);
    if ($user['role'] !== 'user') mobileReply(403, ['success' => false, 'message' => 'Resident account required.']);
    return $user;
}

function mobileMethod(string $method): void {
    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        header('Allow: ' . $method);
        mobileReply(405, ['success' => false, 'message' => 'Method not allowed.']);
    }
}