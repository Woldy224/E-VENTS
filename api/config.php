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
    'https://e-vents.ct.ws',
    'http://e-vents.ct.ws',
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
$databaseUrl = getenv('DATABASE_URL') ?: ($_ENV['DATABASE_URL'] ?? null);

if ($databaseUrl) {
    // Parsing DATABASE_URL (format: postgresql://user:pass@host:port/dbname)
    $dbParts = parse_url($databaseUrl);
    if ($dbParts === false) {
        $dbHost = 'localhost'; $dbPort = '5432'; $dbName = 'railway'; $dbUser = 'postgres'; $dbPass = '';
    } else {
        $dbHost = $dbParts['host'] ?? 'localhost';
        $dbPort = $dbParts['port'] ?? '5432';
        $dbName = ltrim($dbParts['path'] ?? '', '/');
        $dbUser = isset($dbParts['user']) ? urldecode($dbParts['user']) : 'postgres';
        $dbPass = isset($dbParts['pass']) ? urldecode($dbParts['pass']) : '';
    }
} else {
    // Fallback to individual variables
    $dbHost = getenv('PGHOST') ?: ($_ENV['PGHOST'] ?? 'postgres.railway.internal');
    $dbPort = getenv('PGPORT') ?: ($_ENV['PGPORT'] ?? '5432');
    $dbName = getenv('PGDATABASE') ?: ($_ENV['PGDATABASE'] ?? 'railway');
    $dbUser = getenv('PGUSER') ?: ($_ENV['PGUSER'] ?? 'postgres');
    $dbPass = getenv('PGPASSWORD') ?: ($_ENV['PGPASSWORD'] ?? 'SRsOxQaLnprubWCywbQTyAWaNyqsoFPX');
}

try {
    // Add sslmode=require for cloud databases if not explicitly disabled
    $dsnParts = [
        "host={$dbHost}",
        "port={$dbPort}",
        "dbname={$dbName}"
    ];
    
    // Auto-enable SSL for remote connections
    if (!str_contains($dbHost, 'localhost') && !str_contains($dbHost, '127.0.0.1')) {
        $dsnParts[] = "sslmode=require";
    }
    
    $dsn = "pgsql:" . implode(';', $dsnParts);
    
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 5, // 5 seconds timeout
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    $errorInfo = [
        'error' => 'Database connection error',
        'details' => $e->getMessage(),
        'debug' => [
            'host' => $dbHost,
            'port' => $dbPort,
            'db' => $dbName,
            'user' => $dbUser,
            'url_detected' => !empty($databaseUrl),
            'dsn' => "pgsql:host={$dbHost};port={$dbPort};dbname={$dbName};sslmode=..."
        ]
    ];
    echo json_encode($errorInfo);
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
    
    // Case-insensitive search for Authorization header
    $token = null;
    foreach ($headers as $key => $value) {
        if (strtolower($key) === 'authorization') {
            $token = $value;
            break;
        }
    }
    
    if (!$token && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $token = $_SERVER['HTTP_AUTHORIZATION'];
    }

    if ($token) {
        // Case-insensitive replacement of 'Bearer '
        $token = preg_replace('/^Bearer\s+/i', '', $token);
    }
    
    if (!$token) return null;

    $now = date('Y-m-d H:i:s');
    $stmt = $pdo->prepare("
        SELECT u.* FROM users u
        JOIN sessions s ON u.id = s.user_id
        WHERE s.session_token = ? AND s.expires_at > ?
    ");
    $stmt->execute([$token, $now]);
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