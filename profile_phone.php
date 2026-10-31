<?php
/** Return a canonical 11-digit Philippine mobile number, or null if invalid. */
function normalizeProfilePhone(string $value): ?string {
    $phone = trim($value);
    if ($phone === '') return '';
    if (preg_match('/^09[0-9]{9}$/D', $phone)) return $phone;
    if (preg_match('/^\+639[0-9]{9}$/D', $phone)) return '0' . substr($phone, 3);
    if (preg_match('/^\+6309[0-9]{9}$/D', $phone)) return substr($phone, 3);
    return null;
}