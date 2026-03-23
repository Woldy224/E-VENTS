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

    // 2. Environment Debug (Safe)
    $env_debug = [];
    $vars_to_check = ['DATABASE_URL', 'PGHOST', 'PGPORT', 'PGDATABASE', 'PGUSER', 'PGPASSWORD', 'DB_HOST', 'DB_NAME'];
    foreach ($vars_to_check as $var) {
        $val = getenv($var) ?: ($_ENV[$var] ?? ($_SERVER[$var] ?? 'NOT_SET'));
        $env_debug[$var] = ($val === 'NOT_SET') ? 'MISSING' : (($var === 'PGPASSWORD' || $var === 'DATABASE_URL') ? 'SET (hidden)' : $val);
    }
    $stats['env_vars'] = $env_debug;

    $headers = function_exists('getallheaders') ? getallheaders() : [];

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
