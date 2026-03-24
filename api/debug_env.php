<?php
header('Content-Type: application/json');

$vars = [
    'DATABASE_URL', 'PGHOST', 'PGPORT', 'PGDATABASE', 'PGUSER', 'PGPASSWORD',
    'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASS',
    'RAILWAY_STATIC_URL', 'RAILWAY_ENVIRONMENT', 'RAILWAY_SERVICE_NAME'
];

$results = [];
foreach ($vars as $var) {
    $val = getenv($var);
    $results['getenv'][$var] = ($val === false) ? 'FALSE' : (($var === 'PGPASSWORD' || $var === 'DATABASE_URL' || $var === 'DB_PASS') ? 'SET (hidden)' : $val);
    
    $val = $_ENV[$var] ?? 'NULL';
    $results['_ENV'][$var] = ($val === 'NULL') ? 'NULL' : (($var === 'PGPASSWORD' || $var === 'DATABASE_URL' || $var === 'DB_PASS') ? 'SET (hidden)' : $val);

    $val = $_SERVER[$var] ?? 'NULL';
    $results['_SERVER'][$var] = ($val === 'NULL') ? 'NULL' : (($var === 'PGPASSWORD' || $var === 'DATABASE_URL' || $var === 'DB_PASS') ? 'SET (hidden)' : $val);
}

echo json_encode([
    'message' => 'Explicit Environment Check',
    'timestamp' => date('Y-m-d H:i:s'),
    'results' => $results
], JSON_PRETTY_PRINT);
