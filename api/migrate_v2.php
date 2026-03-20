<?php
require_once __DIR__ . '/config.php';

header('Content-Type: application/json');

try {
    $pdo->beginTransaction();

    // 1. Add user_id to event_proposals
    $pdo->exec("ALTER TABLE event_proposals ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)");
    
    // 2. Add user_id to events
    $pdo->exec("ALTER TABLE events ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)");

    $pdo->commit();

    echo json_encode([
        'success' => true, 
        'message' => 'Database migrated successfully. user_id columns added to events and event_proposals.'
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
