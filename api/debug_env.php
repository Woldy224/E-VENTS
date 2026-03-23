<?php
header('Content-Type: application/json');

// Get all possible environment variables
$all_envs = [];

// 1. From getenv()
foreach (getenv() as $key => $value) {
    if (str_contains($key, 'PASS') || str_contains($key, 'TOKEN') || str_contains($key, 'SECRET') || str_contains($key, 'URL')) {
        $all_envs['getenv'][$key] = 'SET (hidden)';
    } else {
        $all_envs['getenv'][$key] = $value;
    }
}

// 2. From $_ENV
foreach ($_ENV as $key => $value) {
    if (str_contains($key, 'PASS') || str_contains($key, 'TOKEN') || str_contains($key, 'SECRET') || str_contains($key, 'URL')) {
        $all_envs['_ENV'][$key] = 'SET (hidden)';
    } else {
        $all_envs['_ENV'][$key] = $value;
    }
}

// 3. From $_SERVER
foreach ($_SERVER as $key => $value) {
    if (str_contains($key, 'PASS') || str_contains($key, 'TOKEN') || str_contains($key, 'SECRET') || str_contains($key, 'URL')) {
        $all_envs['_SERVER'][$key] = 'SET (hidden)';
    } else {
        // Skip some bulky/irrelevant server vars
        if (!in_array($key, ['PATH', 'HTTP_COOKIE', 'LS_COLORS'])) {
            $all_envs['_SERVER'][$key] = is_array($value) ? 'ARRAY' : $value;
        }
    }
}

echo json_encode([
    'message' => 'Railway Environment Debug',
    'timestamp' => date('Y-m-d H:i:s'),
    'variables' => $all_envs
], JSON_PRETTY_PRINT);
