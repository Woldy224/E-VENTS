<?php
// Configuration CORS globale
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://e-vents.ct.ws',
    'http://e-vents.ct.ws'
];

if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: ' . ($origin ?: '*'));
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Standard Apache workaround for Authorization header
if (!isset($_SERVER['HTTP_AUTHORIZATION']) && function_exists('getallheaders')) {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        $_SERVER['HTTP_AUTHORIZATION'] = $headers['Authorization'];
    } elseif (isset($headers['authorization'])) {
        $_SERVER['HTTP_AUTHORIZATION'] = $headers['authorization'];
    }
}

require __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

/*
|--------------------------------------------------------------------------
| Get Request Path
|--------------------------------------------------------------------------
*/

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// For Railway/Clean URLs: strip /api if it's at the start
if (strpos($path, '/api') === 0) {
    $path = substr($path, 4);
}

// Ensure it starts with / and has no trailing slash (except for root)
$path = '/' . trim($path, '/');

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

$routes = [
    '/auth' => 'auth.php',
    '/events' => 'events.php',
    '/proposals' => 'proposals.php',
    '/tickets' => 'tickets.php',
    '/migrate' => 'migrate.php',
    '/check_db' => 'check_db.php',
    '/force_admin' => 'force_admin.php',
];

foreach ($routes as $route => $file) {
    if ($path === $route || strpos($path, $route . '/') === 0) {
        require_once __DIR__ . '/' . $file;
        exit();
    }
}


echo json_encode([
    "name" => "Ayiti Events API",
    "version" => "1.0.0",
    "message" => "Endpoint not found",
    "available_endpoints" => [
        "/api/auth?action=register" => "POST - Register user",
        "/api/auth?action=login" => "POST - Login user",
        "/api/auth?action=admin-login" => "POST - Admin login",
        "/api/auth?action=logout" => "POST - Logout",
        "/api/auth?action=me" => "GET - Get current user",
        "/api/events?action=list" => "GET - List events",
        "/api/events?action=create" => "POST - Create event (admin)",
        "/api/events?action=update&id=X" => "PUT - Update event (admin)",
        "/api/events?action=delete&id=X" => "DELETE - Delete event (admin)",
        "/api/proposals?action=submit" => "POST - Submit proposal",
        "/api/proposals?action=list" => "GET - List proposals (admin)",
        "/api/proposals?action=approve&id=X" => "POST - Approve proposal (admin)",
        "/api/proposals?action=reject&id=X" => "POST - Reject proposal (admin)",
        "/api/tickets?action=purchase" => "POST - Purchase tickets",
        "/api/tickets?action=my-tickets" => "GET - Get user tickets"
    ]
]);
