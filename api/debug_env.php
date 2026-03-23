<?php
header('Content-Type: application/json');

$env = [];
$interesting = ['DATABASE_URL', 'PGHOST', 'PGPORT', 'PGDATABASE', 'PGUSER', 'PGPASSWORD', 'DB_HOST', 'DB_NAME', 'RAILWAY_STATIC_URL', 'RAILWAY_ENVIRONMENT'];

foreach ($interesting as $var) {
    $val = getenv($var);
    $env['getenv'][$var] = ($val === false) ? 'FALSE' : (($var === 'PGPASSWORD' || $var === 'DATABASE_URL') ? 'SET (hidden)' : $val);
    
    $val = $_ENV[$var] ?? 'NULL';
    $env['_ENV'][$var] = ($val === 'NULL') ? 'NULL' : (($var === 'PGPASSWORD' || $var === 'DATABASE_URL') ? 'SET (hidden)' : $val);
}

echo json_encode($env, JSON_PRETTY_PRINT);
