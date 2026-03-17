<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'register':
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit();
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['name'], $data['surname'], $data['email'], $data['password']) || empty($data['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields (name, surname, email, password)']);
            exit();
        }
        
        if (strlen($data['password']) < 6) {
            http_response_code(400);
            echo json_encode(['error' => 'Password must be at least 6 characters']);
            exit();
        }
        
        $password = password_hash($data['password'], PASSWORD_BCRYPT);
        
        try {
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$data['email']]);
            if ($stmt->fetch()) {
                http_response_code(409);
                echo json_encode(['error' => 'Email already registered']);
                exit();
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO users (name, surname, email, password_hash, role) 
                VALUES (?, ?, ?, ?, 'user')
                RETURNING id, name, surname, email, role
            ");
            $stmt->execute([$data['name'], $data['surname'], $data['email'], $password]);
            $user = $stmt->fetch();
            
            $token = generateSessionToken();
            $expires = date('Y-m-d H:i:s', strtotime('+7 days'));
            
            $stmt = $pdo->prepare("INSERT INTO sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)");
            $stmt->execute([$user['id'], $token, $expires]);
            
            echo json_encode([
                'success' => true,
                'user' => $user,
                'token' => $token
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Registration failed']);
        }
        break;
        
    case 'login':
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit();
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['email'], $data['password']) || empty($data['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Email and password are required']);
            exit();
        }
        
        try {
            $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
            $stmt->execute([$data['email']]);
            $user = $stmt->fetch();
            
            if (!$user) {
                http_response_code(401);
                echo json_encode(['error' => 'Invalid credentials']);
                exit();
            }
            
            if (!$user['password_hash'] || !password_verify($data['password'], $user['password_hash'])) {
                http_response_code(401);
                echo json_encode(['error' => 'Invalid credentials']);
                exit();
            }
            
            $token = generateSessionToken();
            $expires = date('Y-m-d H:i:s', strtotime('+7 days'));
            
            $stmt = $pdo->prepare("INSERT INTO sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)");
            $stmt->execute([$user['id'], $token, $expires]);
            
            unset($user['password_hash']);
            
            echo json_encode([
                'success' => true,
                'user' => $user,
                'token' => $token
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Login failed']);
        }
        break;
        
    case 'admin-login':
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit();
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['email'], $data['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Email and password are required']);
            exit();
        }
        
        try {
            $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? AND LOWER(role) = 'admin'");
            $stmt->execute([$data['email']]);
            $user = $stmt->fetch();
            
            if (!$user) {
                http_response_code(401);
                echo json_encode(['error' => 'Invalid admin credentials']);
                exit();
            }
            
            if (!password_verify($data['password'], $user['password_hash'])) {
                http_response_code(401);
                echo json_encode(['error' => 'Invalid admin credentials']);
                exit();
            }
            
            $token = generateSessionToken();
            $expires = date('Y-m-d H:i:s', strtotime('+7 days'));
            
            $stmt = $pdo->prepare("INSERT INTO sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)");
            $stmt->execute([$user['id'], $token, $expires]);
            
            unset($user['password_hash']);
            
            echo json_encode([
                'success' => true,
                'user' => $user,
                'token' => $token
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Admin login failed']);
        }
        break;
        
    case 'logout':
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit();
        }
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        if ($token) {
            $stmt = $pdo->prepare("DELETE FROM sessions WHERE session_token = ?");
            $stmt->execute([$token]);
        }
        
        echo json_encode(['success' => true]);
        break;
        
    case 'me':
        $user = getSessionUser($pdo);
        if ($user) {
            unset($user['password_hash']);
            echo json_encode(['success' => true, 'user' => $user]);
        } else {
            http_response_code(401);
            echo json_encode(['error' => 'Not authenticated']);
        }
        break;
        
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Action not found']);
}
