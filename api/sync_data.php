<?php
require_once __DIR__ . '/config.php';
header('Content-Type: application/json');

try {
    $pdo->beginTransaction();

    // 1. Sync event_proposals: if user_id is null but submitted_by is there, copy it
    $pdo->exec("UPDATE event_proposals SET user_id = submitted_by WHERE user_id IS NULL AND submitted_by IS NOT NULL");
    
    // 2. Sync event_proposals: if submitted_by is null but user_id is there, copy it
    $pdo->exec("UPDATE event_proposals SET submitted_by = user_id WHERE submitted_by IS NULL AND user_id IS NOT NULL");

    // 3. Sync events: if user_id is null but created_by is there, copy it
    $pdo->exec("UPDATE events SET user_id = created_by WHERE user_id IS NULL AND created_by IS NOT NULL");

    // 4. Sync events: if created_by is null but user_id is there, copy it
    $pdo->exec("UPDATE events SET created_by = user_id WHERE created_by IS NULL AND user_id IS NOT NULL");

    // 5. Restore events user_id from matching proposal if still missing!
    $stmt = $pdo->query("SELECT id, title FROM events WHERE user_id IS NULL");
    $events = $stmt->fetchAll();
    $fixedAssocCount = 0;
    
    foreach ($events as $event) {
        $stmtProp = $pdo->prepare("SELECT user_id FROM event_proposals WHERE event_name = ? AND user_id IS NOT NULL LIMIT 1");
        $stmtProp->execute([$event['title']]);
        $propUserId = $stmtProp->fetchColumn();
        
        if ($propUserId) {
            $upd = $pdo->prepare("UPDATE events SET user_id = ?, created_by = ? WHERE id = ?");
            $upd->execute([$propUserId, $propUserId, $event['id']]);
            $fixedAssocCount++;
        }
    }

    $pdo->commit();
    echo json_encode([
        'success' => true, 
        'message' => 'Database fully synchronized: user_id matched with submitted_by/created_by.', 
        'orphans_linked_via_title' => $fixedAssocCount
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(['error' => $e->getMessage()]);
}
