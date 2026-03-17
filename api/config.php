<?php
// Always respond JSON for the API
header('Content-Type: application/json');

// ----------------------------------------------------------
// Simple .env parser
// ----------------------------------------------------------
if (file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) continue;
        if (!str_contains($line, '=')) continue;
        [$name, $value] = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
        putenv(trim($name) . '=' . trim($value));
    }
}

// ----------------------------------------------------------
// CORS (supports Vite dev server + local hosting)
// Reads ALLOWED_ORIGINS from api/.env (comma-separated)
// ----------------------------------------------------------
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
];

if (!empty($_ENV['ALLOWED_ORIGINS'])) {
    $envOrigins = array_map('trim', explode(',', $_ENV['ALLOWED_ORIGINS']));
    $allowedOrigins = array_values(array_filter(array_merge($allowedOrigins, $envOrigins)));
}

if ($origin && in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
} else {
    // Fallback: allow same-origin/non-browser requests
    header('Access-Control-Allow-Origin: *');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Preflight
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ----------------------------------------------------------
// Database
// ----------------------------------------------------------
$dbHost = $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?? 'localhost';
$dbPort = $_ENV['DB_PORT'] ?? getenv('DB_PORT') ?? '5432';
$dbName = $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?? 'heliumdb';
$dbUser = $_ENV['DB_USER'] ?? getenv('DB_USER') ?? 'postgres';
$dbPass = $_ENV['DB_PASS'] ?? getenv('DB_PASS') ?? '';

try {
    $dsn = "pgsql:host={$dbHost};port={$dbPort};dbname={$dbName}";
    $pdo = new PDO($dsn, $dbUser, $dbPass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection error']);
    exit();
}

function generateSessionToken(): string {
    return bin2hex(random_bytes(32));
}

function getSessionUser(PDO $pdo): ?array {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $token = null;

    // Some servers normalize headers differently
    if (isset($headers['Authorization'])) {
        $token = $headers['Authorization'];
    } elseif (isset($headers['authorization'])) {
        $token = $headers['authorization'];
    } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $token = $_SERVER['HTTP_AUTHORIZATION'];
    }

    if ($token) {
        $token = str_replace('Bearer ', '', $token);
    }

    if (!$token) return null;

    $stmt = $pdo->prepare(
        "SELECT u.* FROM users u\n         JOIN sessions s ON u.id = s.user_id\n         WHERE s.session_token = ? AND s.expires_at > NOW()"
    );
    $stmt->execute([$token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    return $user ?: null;
}

function requireAuth(PDO $pdo): array {
    $user = getSessionUser($pdo);
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit();
    }
    return $user;
}

function requireAdmin(PDO $pdo): array {
    $user = requireAuth($pdo);
    if (strtolower($user['role'] ?? '') !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit();
    }
    return $user;
}
