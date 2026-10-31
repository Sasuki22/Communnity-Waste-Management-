<?php
session_start();

if (empty($_SESSION['reset_csrf'])) {
    $_SESSION['reset_csrf'] = bin2hex(random_bytes(32));
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Forgot Password - CWMS</title>
    <link rel="stylesheet" href="style.css?v=10">
</head>
<body>

<div style="max-width:400px; margin:100px auto; padding:30px;">

    <h2>Forgot Password?</h2>

    <p>Enter your registered email address to receive a password reset link.</p>

    <form action="send_reset.php" method="POST">

        <input
            type="hidden"
            name="csrf"
            value="<?= htmlspecialchars($_SESSION['reset_csrf']) ?>"
        >

        <input
            type="email"
            name="email"
            placeholder="Enter your registered email"
            required
            style="width:100%; padding:12px; box-sizing:border-box;"
        >

        <button type="submit" style="margin-top:15px; padding:12px;">
            Send Reset Link
        </button>

    </form>

    <p>
        <a href="index.php">Back to Login</a>
    </p>

</div>

</body>
</html>