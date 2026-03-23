<?php
require_once __DIR__ . '/config.php';
header('Content-Type: application/json');

try {
    $pdo->beginTransaction();

    // 1. Force all events to 'active' status
    $pdo->exec("UPDATE events SET status = 'active' WHERE status IS NULL OR status = ''");

    // 2. Try to link events to users by matching titles with proposals
    $stmt = $pdo->query("SELECT id, title FROM events WHERE user_id IS NULL");
    $events = $stmt->fetchAll();

    $fixedCount = 0;
    foreach ($events as $event) {
        $stmtProp = $pdo->prepare("SELECT user_id FROM event_proposals WHERE event_name = ? AND user_id IS NOT NULL LIMIT 1");
        $stmtProp->execute([$event['title']]);
        $userId = $stmtProp->fetchColumn();

        if ($userId) {
            $update = $pdo->prepare("UPDATE events SET user_id = ? WHERE id = ?");
            $update->execute([$userId, $event['id']]);
            $fixedCount++;
        }
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Data fixing complete.',
        'events_activated' => 'All',
        'ownership_linked' => $fixedCount
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
