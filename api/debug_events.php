<?php
require_once __DIR__ . '/config.php';
header('Content-Type: application/json');

try {
    $stmt = $pdo->query("SELECT id, title, user_id, created_by FROM events ORDER BY id DESC LIMIT 10");
    $recentEvents = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $stmt = $pdo->query("SELECT id, event_name, user_id, submitted_by FROM event_proposals ORDER BY id DESC LIMIT 10");
    $recentProposals = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'recent_events' => $recentEvents,
        'recent_proposals' => $recentProposals
    ]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
