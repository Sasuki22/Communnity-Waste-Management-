<?php
require __DIR__ . '/bootstrap.php';
try {
    if (!in_array($_SERVER['REQUEST_METHOD'] ?? '', ['GET', 'POST'], true)) {
        mobileReply(405, ['success' => false, 'message' => 'Method not allowed.']);
    }
    $conn = mobileDb();
    $user = mobileUser($conn);
    $id = (int)$user['id'];
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $name = trim((string)($_POST['full_name'] ?? ''));
        $email = strtolower(trim((string)($_POST['email'] ?? '')));
        require_once __DIR__ . '/../profile_phone.php';
        $phone = normalizeProfilePhone((string)($_POST['phone'] ?? ''));
        $address = trim((string)($_POST['address'] ?? ''));
        if ($phone === null) mobileReply(422, ['success' => false, 'message' => 'Enter an 11-digit mobile number starting with 09, or +639 followed by 9 digits.']);
        if (!$name || strlen($name) > 100 || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 150 || strlen($address) > 255) {
            mobileReply(422, ['success' => false, 'message' => 'Invalid profile details.']);
        }
        $stmt = $conn->prepare('SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1');
        $stmt->bind_param('si', $email, $id);
        $stmt->execute();
        if ($stmt->get_result()->fetch_assoc()) mobileReply(409, ['success' => false, 'message' => 'Email is already in use.']);
        if (!empty($_FILES['profile_picture']['name'])) mobileReply(422, ['success' => false, 'message' => 'Photo upload is not available yet.']);
        $stmt = $conn->prepare('UPDATE users SET full_name = ?, email = ?, phone = ?, address = ? WHERE id = ?');
        $stmt->bind_param('ssssi', $name, $email, $phone, $address, $id);
        $stmt->execute();
    }
    $stmt = $conn->prepare('SELECT full_name, email, phone, address, profile_picture FROM users WHERE id = ? LIMIT 1');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    mobileReply(200, ['success' => true, 'user' => $stmt->get_result()->fetch_assoc()]);
} catch (Throwable $e) {
    error_log('Mobile profile failure: ' . $e->getMessage());
    mobileReply(500, ['success' => false, 'message' => 'Unable to load profile.']);
}