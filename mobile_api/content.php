<?php
require __DIR__ . '/bootstrap.php';
try {
    $action = $_GET['action'] ?? '';
    mobileMethod($action === 'mark_notifications_read' ? 'POST' : 'GET');
    $conn = mobileDb();
    $user = mobileUser($conn);
    $id = (int)$user['id'];
    if ($action === 'schedules') {
        $zone = trim((string)($_GET['zone'] ?? ''));
        if (strlen($zone) > 50) mobileReply(422, ['success' => false, 'message' => 'Invalid zone.']);
        $upcoming = ($_GET['upcoming'] ?? '') === 'true';
        $stmt = $conn->prepare("SELECT id, waste_type, icon, day_of_week, time_slot, zone, frequency, description, is_upcoming FROM schedules WHERE (? = '' OR zone = ? OR zone = 'All Zones') AND (? = 0 OR is_upcoming = 1) ORDER BY id ASC LIMIT 100");
        $flag = $upcoming ? 1 : 0;
        $stmt->bind_param('ssi', $zone, $zone, $flag);
    } elseif ($action === 'announcements') {
        $stmt = $conn->prepare('SELECT id, title, message, created_at FROM announcements ORDER BY created_at DESC, id DESC LIMIT 30');
    } elseif ($action === 'notifications') {
        $stmt = $conn->prepare('SELECT id, status, message, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 30');
        $stmt->bind_param('i', $id);
    } elseif ($action === 'mark_notifications_read') {
        $stmt = $conn->prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0');
        $stmt->bind_param('i', $id);
        $stmt->execute();
        mobileReply(200, ['success' => true]);
    } else {
        mobileReply(400, ['success' => false, 'message' => 'Invalid action.']);
    }
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    mobileReply(200, ['success' => true, 'data' => $rows]);
} catch (Throwable $e) {
    error_log('Mobile content failure: ' . $e->getMessage());
    mobileReply(500, ['success' => false, 'message' => 'Unable to load content.']);
}