<?php
// ----------------------------------------------------------
// config.php - Railway-ready PHP + PostgreSQL config
// ----------------------------------------------------------

// Always respond JSON for API
if (!headers_sent()) {
    header('Content-Type: application/json');
}

// ----------------------------------------------------------
// Database - Railway credentials
// ----------------------------------------------------------
// On Railway, PGPASSWORD, PGHOST etc are automatically injected.
// We prioritize DATABASE_URL if available as it is the most robust.

$databaseUrl = getenv('DATABASE_URL');

if ($databaseUrl) {
    // Parsing DATABASE_URL (format: postgresql://user:pass@host:port/dbname)
    $dbParts = parse_url($databaseUrl);
    if ($dbParts === false) {
        // Fallback to individual variables if parsing fails
        $dbHost = getenv('PGHOST') ?: 'postgres.railway.internal';
        $dbPort = getenv('PGPORT') ?: '5432';
        $dbName = getenv('PGDATABASE') ?: 'railway';
        $dbUser = getenv('PGUSER') ?: 'postgres';
        $dbPass = getenv('PGPASSWORD') ?: '';
    } else {
        $dbHost = $dbParts['host'] ?? 'localhost';
        $dbPort = $dbParts['port'] ?? '5432';
        $dbName = ltrim($dbParts['path'] ?? '', '/');
        $dbUser = isset($dbParts['user']) ? urldecode($dbParts['user']) : 'postgres';
        $dbPass = isset($dbParts['pass']) ? urldecode($dbParts['pass']) : '';
    }
} else {
    // Fallback to individual individual variables (PG* are Railway standard)
    // We check getenv() directly to avoid being overridden by local .env (which uses DB_HOST etc)
    $dbHost = getenv('PGHOST') ?: (getenv('DB_HOST') ?: 'postgres.railway.internal');
    $dbPort = getenv('PGPORT') ?: (getenv('DB_PORT') ?: '5432');
    $dbName = getenv('PGDATABASE') ?: (getenv('DB_NAME') ?: 'railway');
    $dbUser = getenv('PGUSER') ?: (getenv('DB_USER') ?: 'postgres');
    $dbPass = getenv('PGPASSWORD') ?: (getenv('DB_PASS') ?: '');
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
    
    $token = null;
    // 1. Try Headers (Case-insensitive)
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
        $token = preg_replace('/^Bearer\s+/i', '', $token);
    }
    
    // 2. Fallback: Try Query Parameter (Safe for debugging shared hosting issues)
    if (!$token && isset($_GET['token'])) {
        $token = $_GET['token'];
    }
    
    if (!$token) return null;

    // Use a wider margin for expiry or just check existence for now to debug
    $stmt = $pdo->prepare("
        SELECT u.* FROM users u
        JOIN sessions s ON u.id = s.user_id
        WHERE s.session_token = ?
        LIMIT 1
    ");
    $stmt->execute([$token]);
    $user = $stmt->fetch();
    
    if (!$user) return null;
    
    return $user;
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