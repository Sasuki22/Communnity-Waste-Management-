<?php

function repairKnownMojibakeScheduleIcons(mysqli $conn): bool
{
    $corrections = [
        // General Waste: 🗑️
        'C3B0C5B8E28094E28098C3AFC2B8C28F' => 'F09F9791EFB88F',

        // Recyclable Waste: ♻️
        'C3A2E284A2C2BBC3AFC2B8C28F' => 'E299BBEFB88F',

        // Organic Waste: 🌿
        'C3B0C5B8E2809CC2BF' => 'F09F8CBF',

        // Hazardous Waste: ⚠️
        'C3A2C2A5C2A1C3AFC2B8C28F' => 'E29AA0EFB88F',
    ];

    $stmt = $conn->prepare(
        "UPDATE schedules
         SET icon = CONVERT(UNHEX(?) USING utf8mb4)
         WHERE HEX(icon) = ?"
    );

    if (!$stmt) {
        error_log('Unable to prepare schedule icon encoding repair.');
        return false;
    }

    foreach ($corrections as $corruptedHex => $correctHex) {
        $replacementHex = $correctHex;
        $storedHex = $corruptedHex;

        $stmt->bind_param('ss', $replacementHex, $storedHex);

        if (!$stmt->execute()) {
            error_log('Unable to repair a known corrupted schedule icon.');
            $stmt->close();
            return false;
        }
    }

    $stmt->close();
    return true;
}

function ensureSchedulesTable(mysqli $conn): bool
{
    // Force UTF-8 MB4 on this connection before any schema or icon operations.
    if (!$conn->set_charset('utf8mb4')) {
        error_log('Unable to set MySQL connection charset to utf8mb4.');
        return false;
    }

    $created = $conn->query("CREATE TABLE IF NOT EXISTS schedules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        waste_type VARCHAR(100) NOT NULL,
        icon VARCHAR(20) NOT NULL DEFAULT '🗑️',
        day_of_week VARCHAR(50) NOT NULL,
        time_slot VARCHAR(50) NOT NULL,
        zone VARCHAR(50) NOT NULL DEFAULT 'All Zones',
        frequency VARCHAR(30) NOT NULL DEFAULT 'Weekly',
        description TEXT NULL,
        is_upcoming TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    if (!$created) {
        return false;
    }

    // Automatically heal existing schedule icons with the exact corruption
    // patterns found during the project's database audit. No manual SQL query
    // is needed, and correctly stored/custom icons are not changed.
    if (!repairKnownMojibakeScheduleIcons($conn)) {
        return false;
    }

    $countResult = $conn->query("SELECT COUNT(*) AS total FROM schedules");
    if (!$countResult) {
        return false;
    }
    $total = (int)($countResult->fetch_assoc()['total'] ?? 0);
    $countResult->free();

    // Seed the project's existing standard schedule and its zone-specific records once.
    // At least one row is retained by the admin delete endpoint, so this will not
    // overwrite schedules during normal use.
    if ($total === 0) {
        $defaults = [
            ['General Waste', '🗑️', 'Monday', '07:00 AM - 10:00 AM', 'All Zones', 'Weekly', 'Non-recyclable household waste.', 1],
            ['Recyclable Waste', '♻️', 'Wednesday', '08:00 AM - 12:00 PM', 'All Zones', 'Weekly', 'Clean paper, plastics, glass, and metal cans.', 1],
            ['Organic Waste', '🌿', 'Friday', '07:00 AM - 10:00 AM', 'All Zones', 'Weekly', 'Food scraps, leaves, and garden trimmings.', 1],
            ['Hazardous Waste', '⚠️', 'Saturday', '09:00 AM - 01:00 PM', 'All Zones', 'Bi-Weekly', 'Batteries, bulbs, electronics, and chemicals.', 1],
            ['General Waste (Zone 1)', '🗑️', 'Monday & Thursday', '06:30 AM - 09:30 AM', 'Zone 1', 'Bi-Weekly', 'Zone 1 regular waste collection.', 0],
            ['Recyclable Waste (Zone 1)', '♻️', 'Wednesday', '08:00 AM - 11:00 AM', 'Zone 1', 'Weekly', 'Zone 1 recyclables collection.', 0],
            ['General Waste (Zone 2)', '🗑️', 'Tuesday & Friday', '06:30 AM - 09:30 AM', 'Zone 2', 'Bi-Weekly', 'Zone 2 regular waste collection.', 0],
            ['Recyclable Waste (Zone 2)', '♻️', 'Thursday', '08:00 AM - 11:00 AM', 'Zone 2', 'Weekly', 'Zone 2 recyclables collection.', 0],
            ['General Waste (Zone 3)', '🗑️', 'Wednesday & Saturday', '06:30 AM - 09:30 AM', 'Zone 3', 'Bi-Weekly', 'Zone 3 regular waste collection.', 0],
            ['Recyclable Waste (Zone 3)', '♻️', 'Friday', '08:00 AM - 11:00 AM', 'Zone 3', 'Weekly', 'Zone 3 recyclables collection.', 0]
        ];

        $stmt = $conn->prepare("INSERT INTO schedules
            (waste_type, icon, day_of_week, time_slot, zone, frequency, description, is_upcoming)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        if (!$stmt) {
            return false;
        }

        foreach ($defaults as $row) {
            $stmt->bind_param('sssssssi', $row[0], $row[1], $row[2], $row[3], $row[4], $row[5], $row[6], $row[7]);
            if (!$stmt->execute()) {
                $stmt->close();
                return false;
            }
        }
        $stmt->close();
    }

    return true;
}

/** Validate schedule form fields and return a normalized payload, or null. */
function normalizeSchedulePayload(array $data): ?array
{
    $allowedIcons = ['🗑️', '♻️', '🌿', '⚠️', '🚚', '📅'];
    $allowedZones = ['All Zones', 'Zone 1', 'Zone 2', 'Zone 3'];
    $allowedFrequencies = ['Weekly', 'Bi-Weekly', 'Daily', 'Monthly'];

    $wasteType = trim((string)($data['waste_type'] ?? ''));
    $icon = trim((string)($data['icon'] ?? '🗑️'));
    $day = trim((string)($data['day_of_week'] ?? ''));
    $time = trim((string)($data['time_slot'] ?? ''));
    $zone = trim((string)($data['zone'] ?? 'All Zones'));
    $frequency = trim((string)($data['frequency'] ?? 'Weekly'));
    $description = trim((string)($data['description'] ?? ''));

    if ($wasteType === '' || strlen($wasteType) > 100 || $day === '' || strlen($day) > 50 || $time === '' || strlen($time) > 50) {
        return null;
    }
    if (!in_array($icon, $allowedIcons, true) || !in_array($zone, $allowedZones, true) || !in_array($frequency, $allowedFrequencies, true)) {
        return null;
    }
    if (strlen($description) > 2000) {
        return null;
    }

    return [
        'waste_type' => $wasteType,
        'icon' => $icon,
        'day_of_week' => $day,
        'time_slot' => $time,
        'zone' => $zone,
        'frequency' => $frequency,
        'description' => $description,
        'is_upcoming' => !empty($data['is_upcoming']) ? 1 : 0
    ];
}

