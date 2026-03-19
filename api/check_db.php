<?php
require_once __DIR__ . '/config.php';

header('Content-Type: application/json');

try {
    $stats = [];
    
    // 1. Connection Info
    $stats['database'] = [
        'status' => 'connected',
        'type' => 'PostgreSQL (Railway)'
    ];

    // 2. Tables Check
    $tables = ['users', 'events', 'sessions', 'event_proposals', 'ticket_purchases'];
    $stats['tables'] = [];
    
    foreach ($tables as $table) {
        $stmt = $pdo->query("SELECT COUNT(*) FROM $table");
        $stats['tables'][$table] = $stmt->fetchColumn();
    }

    // 3. User Details (To verify Admin)
    $stmt = $pdo->query("SELECT id, email, role, name FROM users");
    $stats['users_list'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($stats, JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
