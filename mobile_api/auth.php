<?php
require __DIR__ . '/bootstrap.php';

try {
    $action = $_GET['action'] ?? '';
    if ($action === 'login') {
        mobileMethod('POST');
        $data = mobileJson();
        $email = strtolower(trim((string)($data['email'] ?? '')));
        $password = $data['password'] ?? null;
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !is_string($password) || $password === '') {
            mobileReply(401, ['success' => false, 'message' => 'Invalid email or password.']);
        }
        $conn = mobileDb();
        $stmt = $conn->prepare('SELECT id, full_name, email, password, role FROM users WHERE email = ? LIMIT 1');
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $user = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        if (!$user || !password_verify($password, $user['password'])) {
            mobileReply(401, ['success' => false, 'message' => 'Invalid email or password.']);
        }
        if ($user['role'] !== 'user') mobileReply(403, ['success' => false, 'message' => 'Resident account required.']);
        $token = bin2hex(random_bytes(32));
        $digest = hash('sha256', $token);
        $id = (int)$user['id'];
        $stmt = $conn->prepare('INSERT INTO mobile_sessions (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 30 DAY))');
        $stmt->bind_param('is', $id, $digest);
        $stmt->execute();
        $stmt->close();
        mobileReply(200, ['success' => true, 'token' => $token, 'user' => ['id' => $id, 'name' => $user['full_name'], 'email' => $user['email']]]);
    }
    if ($action === 'me' || $action === 'logout') {
        mobileMethod($action === 'me' ? 'GET' : 'POST');
        $conn = mobileDb();
        $user = mobileUser($conn);
        if ($action === 'me') mobileReply(200, ['success' => true, 'user' => ['id' => (int)$user['id'], 'name' => $user['full_name'], 'email' => $user['email']]]);
        $stmt = $conn->prepare('UPDATE mobile_sessions SET revoked_at = UTC_TIMESTAMP() WHERE id = ?');
        $stmt->bind_param('i', $user['session_id']);
        $stmt->execute();
        mobileReply(200, ['success' => true]);
    }
    mobileReply(400, ['success' => false, 'message' => 'Invalid action.']);
} catch (Throwable $e) {
    error_log('Mobile auth failure: ' . $e->getMessage());
    mobileReply(500, ['success' => false, 'message' => 'Service unavailable.']);
}