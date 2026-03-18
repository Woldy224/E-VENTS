<?php
// ----------------------------------------------------------
// config.php - Railway-ready PHP + PostgreSQL config
// ----------------------------------------------------------

// Always respond JSON for API
header('Content-Type: application/json');

// ----------------------------------------------------------
// Load .env if exists (optional, local dev)
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
// CORS - allow local dev + Railway frontend
// ----------------------------------------------------------
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
];

if (!empty($_ENV['ALLOWED_ORIGINS'])) {
    $envOrigins = array_map('trim', explode(',', $_ENV['ALLOWED_ORIGINS']));
    $allowedOrigins = array_merge($allowedOrigins, $envOrigins);
    $allowedOrigins = array_values(array_unique($allowedOrigins));
}

if ($origin && in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
} else {
    header('Access-Control-Allow-Origin: *');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ----------------------------------------------------------
// Database - Railway credentials
// ----------------------------------------------------------
$dbHost = $_ENV['PGHOST'] ?? 'postgres.railway.internal';
$dbPort = $_ENV['PGPORT'] ?? '5432';
$dbName = $_ENV['PGDATABASE'] ?? 'railway';
$dbUser = $_ENV['PGUSER'] ?? 'postgres';
$dbPass = $_ENV['PGPASSWORD'] ?? 'SRsOxQaLnprubWCywbQTyAWaNyqsoFPX';

try {
    $dsn = "pgsql:host={$dbHost};port={$dbPort};dbname={$dbName}";
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Database connection error', 
        'details' => $e->getMessage()
    ]);
    exit();
}

// ----------------------------------------------------------
// Authentication helpers
// ----------------------------------------------------------
function generateSessionToken(): string {
    return bin2hex(random_bytes(32));
}

function getSessionUser(PDO $pdo): ?array {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $token = $headers['Authorization'] ?? $headers['authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? null;

    if ($token) {
        $token = str_replace('Bearer ', '', $token);
    }
    if (!$token) return null;

    $stmt = $pdo->prepare("
        SELECT u.* FROM users u
        JOIN sessions s ON u.id = s.user_id
        WHERE s.session_token = ? AND s.expires_at > NOW()
    ");
    $stmt->execute([$token]);
    return $stmt->fetch() ?: null;
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