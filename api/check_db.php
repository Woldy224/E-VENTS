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

    // 2. Request Headers Debug
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $stats['debug_headers'] = [
        'Authorization_Detected' => isset($headers['Authorization']) || isset($headers['authorization']) || isset($_SERVER['HTTP_AUTHORIZATION']),
        'Authorization_Value_Prefix' => isset($headers['Authorization']) ? substr($headers['Authorization'], 0, 10) . '...' : (isset($_SERVER['HTTP_AUTHORIZATION']) ? substr($_SERVER['HTTP_AUTHORIZATION'], 0, 10) . '...' : 'NONE'),
        'All_Header_Keys' => array_keys($headers),
        'HTTP_ORIGIN' => $_SERVER['HTTP_ORIGIN'] ?? 'NOT_SET'
    ];

    // 3. Tables Check
    $tables = ['users', 'events', 'sessions', 'event_proposals', 'ticket_purchases'];
    $stats['tables'] = [];
    $stats['schemas'] = [];
    
    foreach ($tables as $table) {
        $stmt = $pdo->query("SELECT COUNT(*) FROM $table");
        $stats['tables'][$table] = $stmt->fetchColumn();
        
        // Get columns
        $stmt = $pdo->query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '$table' ORDER BY ordinal_position");
        $stats['schemas'][$table] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // 4. User Details
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
