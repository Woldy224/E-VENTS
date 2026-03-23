<?php
require_once __DIR__ . '/config.php';
header('Content-Type: application/json');

try {
    $stmt = $pdo->query("SELECT * FROM ticket_purchases ORDER BY purchased_at DESC LIMIT 5");
    $purchases = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $stmt = $pdo->query("SELECT id, title, user_id FROM events");
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'purchases' => $purchases,
        'events' => $events,
    ], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
