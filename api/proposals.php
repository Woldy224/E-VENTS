<?php
require_once __DIR__ . '/config.php';

/** Check if a column exists (PostgreSQL) */
function columnExists(PDO $pdo, string $table, string $column): bool {
    static $cache = [];
    $key = strtolower($table . '.' . $column);
    if (isset($cache[$key])) return $cache[$key];
    $stmt = $pdo->prepare("SELECT 1 FROM information_schema.columns WHERE table_name = ? AND column_name = ? LIMIT 1");
    $stmt->execute([strtolower($table), strtolower($column)]);
    $cache[$key] = (bool)$stmt->fetchColumn();
    return $cache[$key];
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$id = $_GET['id'] ?? null;

switch ($action) {
    case 'list':
        requireAdmin($pdo);
        
        try {
            $stmt = $pdo->query("SELECT * FROM event_proposals ORDER BY submitted_at DESC");
            $proposals = $stmt->fetchAll();
            
            $formatted = array_map(function($p) {
                return [
                    'id' => (string)$p['id'],
                    'eventName' => $p['event_name'],
                    'description' => $p['description'],
                    'date' => $p['date'],
                    'time' => $p['time'],
                    'numberOfTickets' => (int)$p['number_of_tickets'],
                    'price' => (float)$p['price'],
                    'imageUrl' => $p['image_url'],
                    'mediaCoverageRequested' => (bool)($p['media_coverage_requested'] ?? false),
                    'contactName' => $p['contact_name'],
                    'contactEmail' => $p['contact_email'],
                    'contactPhone' => $p['contact_phone'],
                    'status' => $p['status'],
                    'submittedAt' => $p['submitted_at']
                ];
            }, $proposals);
            
            echo json_encode($formatted);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch proposals']);
        }
        break;
        
    case 'submit':
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit();
        }

        $user = getSessionUser($pdo);
        $userId = $user ? $user['id'] : null;

        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['eventName'], $data['date'], $data['time'], $data['contactName'], $data['contactEmail'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields']);
            exit();
        }

        $hasMediaCol = columnExists($pdo, 'event_proposals', 'media_coverage_requested');
        $mediaRequested = (bool)($data['mediaCoverageRequested'] ?? false);

        try {
            if ($hasMediaCol) {
                $stmt = $pdo->prepare("
                    INSERT INTO event_proposals (event_name, description, date, time, number_of_tickets, price, image_url, contact_name, contact_email, contact_phone, media_coverage_requested, user_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    RETURNING *
                ");
                $stmt->execute([
                    $data['eventName'],
                    $data['description'] ?? '',
                    $data['date'],
                    $data['time'],
                    $data['numberOfTickets'] ?? 0,
                    $data['price'] ?? 0,
                    $data['imageUrl'] ?? null,
                    $data['contactName'],
                    $data['contactEmail'],
                    $data['contactPhone'] ?? null,
                    $mediaRequested,
                    $userId
                ]);
            } else {
                // Backward-compatible insert if DB column does not exist yet
                $stmt = $pdo->prepare("
                    INSERT INTO event_proposals (event_name, description, date, time, number_of_tickets, price, image_url, contact_name, contact_email, contact_phone, user_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    RETURNING *
                ");
                $stmt->execute([
                    $data['eventName'],
                    $data['description'] ?? '',
                    $data['date'],
                    $data['time'],
                    $data['numberOfTickets'] ?? 0,
                    $data['price'] ?? 0,
                    $data['imageUrl'] ?? null,
                    $data['contactName'],
                    $data['contactEmail'],
                    $data['contactPhone'] ?? null,
                    $userId
                ]);
            }

            $proposal = $stmt->fetch();

            echo json_encode([
                'success' => true,
                'proposal' => [
                    'id' => (string)$proposal['id'],
                    'eventName' => $proposal['event_name'],
                    'description' => $proposal['description'],
                    'date' => $proposal['date'],
                    'time' => $proposal['time'],
                    'numberOfTickets' => (int)$proposal['number_of_tickets'],
                    'price' => (float)$proposal['price'],
                    'imageUrl' => $proposal['image_url'],
                    'mediaCoverageRequested' => (bool)($proposal['media_coverage_requested'] ?? $mediaRequested),
                    'contactName' => $proposal['contact_name'],
                    'contactEmail' => $proposal['contact_email'],
                    'contactPhone' => $proposal['contact_phone'],
                    'status' => $proposal['status'],
                    'submittedAt' => $proposal['submitted_at']
                ]
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to submit proposal']);
        }
        break;

case 'approve':
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit();
        }
        
        requireAdmin($pdo);
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Proposal ID required']);
            exit();
        }
        
        try {
            $pdo->beginTransaction();
            
            $stmt = $pdo->prepare("SELECT * FROM event_proposals WHERE id = ?");
            $stmt->execute([$id]);
            $proposal = $stmt->fetch();
            
            if (!$proposal) {
                $pdo->rollBack();
                http_response_code(404);
                echo json_encode(['error' => 'Proposal not found']);
                exit();
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO events (title, description, date, time, price, total_tickets, image_url, user_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                RETURNING *
            ");
            $stmt->execute([
                $proposal['event_name'],
                $proposal['description'],
                $proposal['date'],
                $proposal['time'],
                $proposal['price'],
                $proposal['number_of_tickets'],
                $proposal['image_url'],
                $proposal['user_id'] ?? null
            ]);
            $event = $stmt->fetch();
            
            $stmt = $pdo->prepare("UPDATE event_proposals SET status = 'approved' WHERE id = ?");
            $stmt->execute([$id]);
            
            $pdo->commit();
            
            echo json_encode([
                'success' => true,
                'event' => [
                    'id' => (string)$event['id'],
                    'title' => $event['title'],
                    'description' => $event['description'],
                    'date' => $event['date'],
                    'time' => $event['time'],
                    'price' => (float)$event['price'],
                    'totalTickets' => (int)$event['total_tickets'],
                    'soldTickets' => 0,
                    'createdAt' => $event['created_at'],
                    'updatedAt' => $event['updated_at']
                ]
            ]);
        } catch (PDOException $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Failed to approve proposal']);
        }
        break;
        
    case 'reject':
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit();
        }
        
        requireAdmin($pdo);
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Proposal ID required']);
            exit();
        }
        
        try {
            $stmt = $pdo->prepare("UPDATE event_proposals SET status = 'rejected' WHERE id = ?");
            $stmt->execute([$id]);
            
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to reject proposal']);
        }
        break;

    case 'my-proposals':
        $user = requireAuth($pdo);
        
        try {
            $stmt = $pdo->prepare("SELECT * FROM event_proposals WHERE user_id = ? ORDER BY submitted_at DESC");
            $stmt->execute([$user['id']]);
            $proposals = $stmt->fetchAll();
            
            $formatted = array_map(function($p) {
                return [
                    'id' => (string)$p['id'],
                    'eventName' => $p['event_name'],
                    'description' => $p['description'],
                    'date' => $p['date'],
                    'time' => $p['time'],
                    'numberOfTickets' => (int)$p['number_of_tickets'],
                    'price' => (float)$p['price'],
                    'status' => $p['status'],
                    'submittedAt' => $p['submitted_at']
                ];
            }, $proposals);
            
            echo json_encode($formatted);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch your proposals']);
        }
        break;
        
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Action not found']);
}
