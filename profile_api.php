<?php
// CWMS profile endpoint: always return JSON, including PHP/database failures.
ob_start();
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function profileReply($status, $message, $user = null) {
    while (ob_get_level() > 0) ob_end_clean();
    http_response_code($status);
    $result = ['success' => $status >= 200 && $status < 300, 'message' => $message];
    if ($user !== null) $result['user'] = $user;
    echo json_encode($result, JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}
register_shutdown_function(function () {
    $e = error_get_last();
    if ($e && in_array($e['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        error_log('Profile API fatal error: ' . $e['message']);
        profileReply(500, 'Server error while saving profile. Check the PHP container logs.');
    }
});

try {
    if (session_status() !== PHP_SESSION_ACTIVE) session_start();
    if (empty($_SESSION['user_id'])) profileReply(401, 'Please log in again.');
    if (!in_array($_SERVER['REQUEST_METHOD'] ?? '', ['GET', 'POST'], true)) profileReply(405, 'Method not allowed.');
    require_once __DIR__ . '/config.php';
    if (!isset($conn) || !($conn instanceof mysqli)) profileReply(500, 'Database connection is not configured.');
    $id = (int)$_SESSION['user_id'];

    $getProfile = function () use ($conn, $id) {
        $stmt = $conn->prepare('SELECT full_name, email, phone, address, profile_picture FROM users WHERE id = ? LIMIT 1');
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return $row;
    };

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $user = $getProfile();
        if (!$user) profileReply(404, 'User not found.');
        profileReply(200, 'Profile loaded.', $user);
    }

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '') {
        $originHost = parse_url($origin, PHP_URL_HOST);
        $requestHost = parse_url('http://' . ($_SERVER['HTTP_HOST'] ?? ''), PHP_URL_HOST);
        if (!$originHost || !$requestHost || strcasecmp($originHost, $requestHost) !== 0) profileReply(403, 'Invalid request origin.');
    }

    $name = trim((string)($_POST['full_name'] ?? ''));
    $email = strtolower(trim((string)($_POST['email'] ?? '')));
    require_once __DIR__ . '/profile_phone.php';
    $phone = normalizeProfilePhone((string)($_POST['phone'] ?? ''));
    $address = trim((string)($_POST['address'] ?? ''));
    $length = function ($value) { return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value); };
    if ($name === '' || $length($name) > 100) profileReply(422, 'Enter a valid full name (maximum 100 characters).');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) profileReply(422, 'Enter a valid email address.');
    if ($phone === null) profileReply(422, 'Enter an 11-digit mobile number starting with 09, or +639 followed by 9 digits.');
    if ($length($address) > 255) profileReply(422, 'Address must be 255 characters or less.');

    $existing = $getProfile();
    if (!$existing) profileReply(404, 'User not found.');
    $stmt = $conn->prepare('SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1');
    $stmt->bind_param('si', $email, $id);
    $stmt->execute();
    $duplicate = $stmt->get_result()->num_rows > 0;
    $stmt->close();
    if ($duplicate) profileReply(409, 'That email is already registered to another account.');

    $photoPath = $existing['profile_picture'];
    $newFile = null;
    if (isset($_FILES['profile_picture']) && $_FILES['profile_picture']['error'] !== UPLOAD_ERR_NO_FILE) {
        $file = $_FILES['profile_picture'];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            if (in_array($file['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)) {
                profileReply(422, 'Image exceeds the server upload limit. Please select a smaller JPG, PNG, or WebP photo.');
            }
            profileReply(422, 'Image upload failed (error ' . (int)$file['error'] . ').');
        }
        if ($file['size'] <= 0 || $file['size'] > 2 * 1024 * 1024) profileReply(422, 'Profile photo must be 2 MB or smaller.');
        if (!is_uploaded_file($file['tmp_name'])) profileReply(422, 'Invalid uploaded file.');
        $imageInfo = @getimagesize($file['tmp_name']);
        if (!$imageInfo || $imageInfo[0] > 5000 || $imageInfo[1] > 5000) profileReply(422, 'Image is invalid or larger than 5000 pixels.');
        $types = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
        $mime = $imageInfo['mime'] ?? '';
        if (!isset($types[$mime])) profileReply(422, 'Only JPG, PNG, and WebP photos are supported.');
        $directory = __DIR__ . '/uploads/profiles';
        if (!is_dir($directory) && !@mkdir($directory, 0755, true) && !is_dir($directory)) profileReply(500, 'Cannot create uploads/profiles directory.');
        $filename = 'user_' . $id . '_' . bin2hex(random_bytes(12)) . '.' . $types[$mime];
        $newFile = $directory . '/' . $filename;
        if (!move_uploaded_file($file['tmp_name'], $newFile)) profileReply(500, 'Cannot write the uploaded photo. Check folder permissions.');
        $photoPath = 'uploads/profiles/' . $filename;
    }

    try {
        $stmt = $conn->prepare('UPDATE users SET full_name = ?, email = ?, phone = ?, address = ?, profile_picture = ? WHERE id = ?');
        $stmt->bind_param('sssssi', $name, $email, $phone, $address, $photoPath, $id);
        $stmt->execute();
        $stmt->close();
    } catch (Throwable $e) {
        if ($newFile) @unlink($newFile);
        throw $e;
    }
    $_SESSION['user_name'] = $name;
    $_SESSION['user_email'] = $email;
    if ($newFile && !empty($existing['profile_picture']) && strpos($existing['profile_picture'], 'uploads/profiles/') === 0) {
        $oldFile = __DIR__ . '/' . $existing['profile_picture'];
        if (is_file($oldFile)) @unlink($oldFile);
    }
    profileReply(200, 'Profile saved successfully!', $getProfile());
} catch (Throwable $e) {
    error_log('Profile API error: ' . $e->getMessage());
    profileReply(500, 'Profile could not be saved. Check the PHP logs and database setup.');
}
