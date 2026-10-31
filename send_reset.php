<?php
session_start();

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/mail_config.php';

// Require PHPMailer email sender.
if (!function_exists('sendResetEmail')) {
    error_log('Password reset error: sendResetEmail() is missing from mail_config.php');
    http_response_code(500);
    exit('Email service is temporarily unavailable.');
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Method Not Allowed');
}

if (
    empty($_POST['csrf']) ||
    empty($_SESSION['reset_csrf']) ||
    !hash_equals($_SESSION['reset_csrf'], $_POST['csrf'])
) {
    http_response_code(403);
    exit('Invalid request.');
}

$email = strtolower(trim($_POST['email'] ?? ''));

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    exit('Invalid email address.');
}

$message = 'If your email is registered, you will receive a password reset link.';

try {
    // Assumes config.php provides a MySQLi connection named $conn.
    $stmt = $conn->prepare(
        "SELECT id, email FROM users WHERE email = ? LIMIT 1"
    );

    $stmt->bind_param('s', $email);
    $stmt->execute();

    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if ($user) {
        // Limit reset requests per account.
        $stmt = $conn->prepare(
            "SELECT COUNT(*) AS total
             FROM password_resets
             WHERE user_id = ?
             AND created_at > UTC_TIMESTAMP() - INTERVAL 1 HOUR"
        );

        $stmt->bind_param('i', $user['id']);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if ($result['total'] < 3) {
            $token = bin2hex(random_bytes(32));
            $tokenHash = hash('sha256', $token);

            $expiresAt = gmdate('Y-m-d H:i:s', time() + 1800);

            $stmt = $conn->prepare(
                "INSERT INTO password_resets
                 (user_id, token_hash, expires_at)
                 VALUES (?, ?, ?)"
            );

            $stmt->bind_param(
                'iss',
                $user['id'],
                $tokenHash,
                $expiresAt
            );

            $stmt->execute();
            $resetId = $conn->insert_id;
            $stmt->close();

            $baseUrl = rtrim(
    getenv('APP_URL') ?: 'http://localhost:8080',
    '/'
);

            $resetLink = $baseUrl .
                '/reset_password.php?token=' .
                urlencode($token);

            try {
                sendResetEmail($user['email'], $resetLink);
            } catch (Throwable $e) {
                error_log('Email error: ' . $e->getMessage());

                $stmt = $conn->prepare(
                    "DELETE FROM password_resets WHERE id = ?"
                );

                $stmt->bind_param('i', $resetId);
                $stmt->execute();
                $stmt->close();
            }
        }
    }

} catch (Throwable $e) {
    error_log('Password reset error: ' . $e->getMessage());
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Request | CWMS</title>
    <link rel="stylesheet" href="style.css?v=10">
</head>

<body class="reset-page">

    <div class="reset-card">

        <div class="reset-icon">
            ✓
        </div>

        <h1>Password Reset Request</h1>

        <p class="reset-description">
            <?php echo htmlspecialchars($message); ?>
        </p>

        <div class="reset-info">
            <span>✉</span>
            <p>
                If you requested a password reset,
                please check your email inbox and spam folder.
            </p>
        </div>

        <a href="index.php" class="reset-back-btn">
            ← Back to Login
        </a>

        <p class="reset-footer">
            Community Waste Management System
        </p>

    </div>

</body>
</html>