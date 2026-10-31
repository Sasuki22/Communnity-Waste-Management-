<?php
require_once 'config.php';

$message = '';
$validToken = false;
$reset = null;
$token = $_POST['token'] ?? $_GET['token'] ?? '';

if (!is_string($token) || !preg_match('/^[a-f0-9]{64}$/i', $token)) {
    $message = 'Invalid password reset link.';
} else {
    $tokenHash = hash('sha256', $token);

    $stmt = $conn->prepare(
        "SELECT id, user_id
         FROM password_resets
         WHERE token_hash = ?
         AND expires_at > NOW()
         LIMIT 1"
    );

    $stmt->bind_param('s', $tokenHash);
    $stmt->execute();
    $result = $stmt->get_result();
    $reset = $result->fetch_assoc();
    $stmt->close();

    if ($reset) {
        $validToken = true;
    } else {
        $message = 'This reset link is invalid or has expired.';
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $validToken) {
    $password = $_POST['password'] ?? '';
    $confirmPassword = $_POST['confirm_password'] ?? '';

    if (strlen($password) < 8) {
        $message = 'Password must be at least 8 characters.';
    } elseif ($password !== $confirmPassword) {
        $message = 'Passwords do not match.';
    } else {
$passwordHash = password_hash($password, PASSWORD_DEFAULT);

$userId = (int) $reset['user_id'];

$conn->begin_transaction();

        try {
            $stmt = $conn->prepare(
                "UPDATE users SET password = ? WHERE id = ?"
            );
            $stmt->bind_param('si', $passwordHash, $userId);
            $stmt->execute();
            $stmt->close();

            $stmt = $conn->prepare(
                "DELETE FROM password_resets WHERE user_id = ?"
            );
            $stmt->bind_param('i', $userId);
            $stmt->execute();
            $stmt->close();

            $conn->commit();

            $validToken = false;
            $message = 'Password successfully updated. You can now log in.';
        } catch (Throwable $e) {
            $conn->rollback();
            error_log('Password reset update failed.');
            $message = 'Unable to reset password. Please try again.';
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password | CWMS</title>

    <link rel="stylesheet" href="reset_password.css?v=1">
    <script src="reset_password.js?v=1" defer></script>
</head>
<body>

    <main class="reset-container">
        <section class="reset-card">

            <div class="reset-icon" aria-hidden="true">♻</div>

            <h1>Reset Your Password</h1>

            <p class="reset-description">
                Create a new password to securely access your
                Community Waste Management System account.
            </p>

            <?php if (!empty($message)): ?>
                <div class="reset-message">
                    <?= htmlspecialchars($message, ENT_QUOTES, 'UTF-8') ?>
                </div>
            <?php endif; ?>

            <?php if ($validToken): ?>

                <form method="POST" id="resetForm">

                    <input
                        type="hidden"
                        name="token"
                        value="<?= htmlspecialchars($token, ENT_QUOTES, 'UTF-8') ?>"
                    >

                    <div class="form-group">
                        <label for="password">New Password</label>

                        <div class="password-field">
                            <input
                                type="password"
                                id="password"
                                name="password"
                                placeholder="Enter your new password"
                                minlength="8"
                                autocomplete="new-password"
                                required
                            >

                            <button
                                type="button"
                                class="toggle-password"
                                data-target="password"
                                aria-label="Show new password"
                                aria-pressed="false"
                            >
                                Show
                            </button>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="confirm_password">
                            Confirm Password
                        </label>

                        <div class="password-field">
                            <input
                                type="password"
                                id="confirm_password"
                                name="confirm_password"
                                placeholder="Re-enter your new password"
                                minlength="8"
                                autocomplete="new-password"
                                required
                            >

                            <button
                                type="button"
                                class="toggle-password"
                                data-target="confirm_password"
                                aria-label="Show confirmed password"
                                aria-pressed="false"
                            >
                                Show
                            </button>
                        </div>
                    </div>

                    <p class="password-hint">
                        Your password must contain at least 8 characters.
                    </p>

                    <p id="passwordError" class="password-error" role="alert" hidden></p>

                    <button type="submit" class="reset-button">
                        Reset Password
                    </button>

                </form>

            <?php endif; ?>

            <a href="index.php" class="back-login">
                ← Back to Login
            </a>

        </section>

        <p class="reset-footer">
            © 2026 Community Waste Management System
        </p>
    </main>

</body>
</html>