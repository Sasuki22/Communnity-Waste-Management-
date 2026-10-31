<?php

function sendResetEmail(string $email, string $resetLink): void
{
    $apiKey = getenv('RESEND_API_KEY') ?: '';
    $senderEmail = getenv('RESEND_FROM_EMAIL') ?: '';

    if ($apiKey === '' || !filter_var($senderEmail, FILTER_VALIDATE_EMAIL)) {
        throw new RuntimeException('Resend configuration is missing.');
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new RuntimeException('Invalid recipient email.');
    }

    if (!function_exists('curl_init')) {
        throw new RuntimeException('PHP cURL extension is missing.');
    }

    $safeLink = htmlspecialchars($resetLink, ENT_QUOTES, 'UTF-8');

    $payload = [
        'from' => 'CWMS Support <' . $senderEmail . '>',
        'to' => [$email],
        'subject' => 'CWMS - Reset Your Password',
        'html' => '
            <h2>Community Waste Management System</h2>
            <p>We received a request to reset your password.</p>
            <p>
                <a href="' . $safeLink . '">Reset My Password</a>
            </p>
            <p>This link expires in 30 minutes.</p>
            <p>If you did not request this, ignore this email.</p>
        ',
        'text' => "Reset your CWMS password:\n"
            . $resetLink
            . "\n\nThis link expires in 30 minutes."
    ];

    $ch = curl_init('https://api.resend.com/emails');

    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json'
        ],
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_THROW_ON_ERROR),
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 30
    ]);

    $response = curl_exec($ch);

    if ($response === false) {
        $error = curl_error($ch);
        curl_close($ch);

        throw new RuntimeException('Resend connection failed: ' . $error);
    }

    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    curl_close($ch);

    if ($statusCode !== 200) {
        $details = json_decode($response, true);

        $errorMessage = is_array($details)
            ? ($details['message'] ?? 'No details provided')
            : 'No details provided';

        $errorMessage = preg_replace(
            '/[\r\n]+/',
            ' ',
            (string) $errorMessage
        );

        error_log(
            'Resend rejection: HTTP ' .
            $statusCode .
            ', message: ' .
            substr($errorMessage, 0, 300)
        );

        throw new RuntimeException('Resend rejected the email request.');
    }
}