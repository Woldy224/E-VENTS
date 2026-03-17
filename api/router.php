<?php
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// Strip /api prefix if present
if (strpos($uri, '/api') === 0) {
    $uri = substr($uri, 4);
}

if ($uri !== '/' && file_exists(__DIR__ . $uri)) {
    return false;
}

if (strpos($uri, '/auth') === 0 || $uri === '/auth') {
    require __DIR__ . '/auth.php';
    exit();
}

if (strpos($uri, '/events') === 0 || $uri === '/events') {
    require __DIR__ . '/events.php';
    exit();
}

if (strpos($uri, '/proposals') === 0 || $uri === '/proposals') {
    require __DIR__ . '/proposals.php';
    exit();
}

if (strpos($uri, '/tickets') === 0 || $uri === '/tickets') {
    require __DIR__ . '/tickets.php';
    exit();
}

require __DIR__ . '/index.php';
