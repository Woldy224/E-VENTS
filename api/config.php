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
// Function to get env var from all possible sources
function get_db_env($name, $default = null) {
    // 1. Try actual system environment variables first (most reliable on Railway)
    $val = getenv($name);
    if ($val !== false) return $val;

    // 2. Try $_ENV (populated by Dotenv\Dotenv)
    if (isset($_ENV[$name]) && $_ENV[$name] !== '') return $_ENV[$name];

    // 3. Try $_SERVER
    if (isset($_SERVER[$name]) && $_SERVER[$name] !== '') return $_SERVER[$name];

    return $default;
}

$databaseUrl = get_db_env('DATABASE_URL');

if ($databaseUrl) {
    // Parsing DATABASE_URL (format: postgresql://user:pass@host:port/dbname)
    $dbParts = parse_url($databaseUrl);
    
    if ($dbParts === false) {
        // Fallback if URL exists but is unparsable
        $dbHost = get_db_env('PGHOST', 'postgres.railway.internal');
        $dbPort = get_db_env('PGPORT', '5432');
        $dbName = get_db_env('PGDATABASE', 'railway');
        $dbUser = get_db_env('PGUSER', 'postgres');
        $dbPass = get_db_env('PGPASSWORD', '');
    } else {
        $dbHost = $dbParts['host'] ?? 'localhost';
        $dbPort = $dbParts['port'] ?? '5432';
        $dbName = isset($dbParts['path']) ? ltrim($dbParts['path'], '/') : 'railway';
        $dbUser = isset($dbParts['user']) ? urldecode($dbParts['user']) : 'postgres';
        $dbPass = isset($dbParts['pass']) ? urldecode($dbParts['pass']) : '';
    }
} else {
    // Fallback to individual variables
    // Priority: PGHOST > DB_HOST > default
    $dbHost = get_db_env('PGHOST', get_db_env('DB_HOST', 'postgres.railway.internal'));
    $dbPort = get_db_env('PGPORT', get_db_env('DB_PORT', '5432'));
    $dbName = get_db_env('PGDATABASE', get_db_env('DB_NAME', 'railway'));
    $dbUser = get_db_env('PGUSER', get_db_env('DB_USER', 'postgres'));
    $dbPass = get_db_env('PGPASSWORD', get_db_env('DB_PASS', ''));
    
    // Safety check: If we are not on localhost but the host IS localhost, something is wrong
    $currentHost = $_SERVER['HTTP_HOST'] ?? '';
    $isLocal = str_contains($currentHost, 'localhost') || str_contains($currentHost, '127.0.0.1');
    
    if (!$isLocal && ($dbHost === 'localhost' || $dbHost === '127.0.0.1')) {
        // We are on production but DB host is localhost. Use Railway's internal DNS as a better guess.
        $dbHost = 'postgres.railway.internal';
    }
}

try {
    // Add sslmode=require for cloud databases if not explicitly disabled
    $dsnParts = [
        "host={$dbHost}",
        "port={$dbPort}",
        "dbname={$dbName}"
    ];
    
    // Auto-enable SSL for remote/public connections, 
    // but disable it for internal Railway networking which often doesn't support it.
    if (!str_contains($dbHost, 'localhost') && 
        !str_contains($dbHost, '127.0.0.1') && 
        !str_contains($dbHost, '.internal') &&
        !str_contains($dbHost, '.local')) {
        $dsnParts[] = "sslmode=require";
    } else {
        $dsnParts[] = "sslmode=disable";
    }
    
    $dsn = "pgsql:" . implode(';', $dsnParts);
    
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 5, // 5 seconds timeout
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    // On production, we'll still show the error for debugging purposes until it's fixed
    $errorInfo = [
        'error' => 'Database connection error',
        'details' => $e->getMessage(),
        'debug' => [
            'host' => $dbHost,
            'port' => $dbPort,
            'db' => $dbName,
            'user' => $dbUser,
            'dsn_check' => "pgsql:host={$dbHost};port={$dbPort};dbname={$dbName}",
            'detected_env' => (isset($_SERVER['HTTP_HOST']) && !str_contains($_SERVER['HTTP_HOST'], 'localhost')) ? 'production' : 'local',
            'has_db_url' => !empty($databaseUrl) ? 'YES' : 'NO'
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