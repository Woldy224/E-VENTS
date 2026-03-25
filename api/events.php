<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$id = $_GET['id'] ?? null;

switch ($action) {
    case 'list':
        try {
            $stmt = $pdo->query("
                SELECT e.*, 
                       (SELECT COALESCE(SUM(quantity), 0) FROM ticket_purchases WHERE event_id = e.id AND status != 'rejected') as sold_tickets,
                       (SELECT COALESCE(SUM(total_amount), 0) FROM ticket_purchases WHERE event_id = e.id AND status IN ('completed', 'used', 'pending_verification')) as total_revenue
                FROM events e 
                WHERE e.status = 'active' 
                ORDER BY e.date ASC
            ");
            $events = $stmt->fetchAll();
            
            $formatted = array_map(function($event) {
                return [
                    'id' => (string)$event['id'],
                    'title' => $event['title'],
                    'description' => $event['description'],
                    'date' => $event['date'],
                    'time' => $event['time'],
                    'price' => (float)$event['price'],
                    'totalTickets' => (int)$event['total_tickets'],
                    'soldTickets' => (int)$event['sold_tickets'],
                    'revenue' => (float)($event['total_revenue'] ?? 0),
                    'imageUrl' => $event['image_url'],
                    'location' => $event['location'],
                    'createdAt' => $event['created_at'],
                    'updatedAt' => $event['updated_at']
                ];
            }, $events);
            
            echo json_encode($formatted);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch events']);
        }
        break;
        
    case 'get':
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Event ID required']);
            exit();
        }
        
        try {
            $stmt = $pdo->prepare("
                SELECT e.*, 
                       (SELECT COALESCE(SUM(quantity), 0) FROM ticket_purchases WHERE event_id = e.id AND status != 'rejected') as sold_tickets,
                       (SELECT COALESCE(SUM(total_amount), 0) FROM ticket_purchases WHERE event_id = e.id AND status IN ('completed', 'used', 'pending_verification')) as total_revenue
                FROM events e 
                WHERE e.id = ?
            ");
            $stmt->execute([$id]);
            $event = $stmt->fetch();
            
            if (!$event) {
                http_response_code(404);
                echo json_encode(['error' => 'Event not found']);
                exit();
            }
            
            echo json_encode([
                'id' => (string)$event['id'],
                'title' => $event['title'],
                'description' => $event['description'],
                'date' => $event['date'],
                'time' => $event['time'],
                'price' => (float)$event['price'],
                'totalTickets' => (int)$event['total_tickets'],
                'soldTickets' => (int)$event['sold_tickets'],
                'revenue' => (float)($event['total_revenue'] ?? 0),
                'imageUrl' => $event['image_url'],
                'location' => $event['location'],
                'createdAt' => $event['created_at'],
                'updatedAt' => $event['updated_at']
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch event']);
        }
        break;
        
    case 'create':
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit();
        }
        
        requireAdmin($pdo);
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['title'], $data['date'], $data['time'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields']);
            exit();
        }
        
        try {
            $stmt = $pdo->prepare("
                INSERT INTO events (title, description, date, time, price, total_tickets, image_url, location)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                RETURNING *
            ");
            $stmt->execute([
                $data['title'],
                $data['description'] ?? '',
                $data['date'],
                $data['time'],
                $data['price'] ?? 0,
                $data['totalTickets'] ?? 0,
                $data['imageUrl'] ?? null,
                $data['location'] ?? null
            ]);
            $event = $stmt->fetch();
            
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
                    'soldTickets' => (int)$event['sold_tickets'],
                    'imageUrl' => $event['image_url'],
                    'location' => $event['location'],
                    'createdAt' => $event['created_at'],
                    'updatedAt' => $event['updated_at']
                ]
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create event']);
        }
        break;
        
    case 'update':
        if ($method !== 'PUT' && $method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit();
        }
        
        requireAdmin($pdo);
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Event ID required']);
            exit();
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        try {
            $stmt = $pdo->prepare("
                UPDATE events SET
                    title = COALESCE(?, title),
                    description = COALESCE(?, description),
                    date = COALESCE(?, date),
                    time = COALESCE(?, time),
                    price = COALESCE(?, price),
                    total_tickets = COALESCE(?, total_tickets),
                    image_url = COALESCE(?, image_url),
                    location = COALESCE(?, location),
                    updated_at = NOW()
                WHERE id = ?
                RETURNING *
            ");
            $stmt->execute([
                $data['title'] ?? null,
                $data['description'] ?? null,
                $data['date'] ?? null,
                $data['time'] ?? null,
                $data['price'] ?? null,
                $data['totalTickets'] ?? null,
                $data['imageUrl'] ?? null,
                $data['location'] ?? null,
                $id
            ]);
            $event = $stmt->fetch();
            
            if (!$event) {
                http_response_code(404);
                echo json_encode(['error' => 'Event not found']);
                exit();
            }
            
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
                    'soldTickets' => (int)$event['sold_tickets'],
                    'imageUrl' => $event['image_url'],
                    'location' => $event['location'],
                    'createdAt' => $event['created_at'],
                    'updatedAt' => $event['updated_at']
                ]
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update event']);
        }
        break;
        
    case 'delete':
        if ($method !== 'DELETE' && $method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit();
        }
        
        requireAdmin($pdo);
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Event ID required']);
            exit();
        }
        
        try {
            $stmt = $pdo->prepare("DELETE FROM events WHERE id = ?");
            $stmt->execute([$id]);
            
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete event']);
        }
        break;

    case 'my-events':
        $user = requireAuth($pdo);
        
        try {
            $stmt = $pdo->prepare("
                SELECT e.*, 
                       (SELECT COALESCE(SUM(quantity), 0) FROM ticket_purchases WHERE event_id = e.id AND status != 'rejected') as sold_tickets,
                       (SELECT COALESCE(SUM(total_amount), 0) FROM ticket_purchases WHERE event_id = e.id AND status IN ('completed', 'used', 'pending_verification')) as total_revenue
                FROM events e
                WHERE e.user_id = ?
                ORDER BY e.date ASC
            ");
            $stmt->execute([$user['id']]);
            $events = $stmt->fetchAll();
            
            $formatted = array_map(function($event) {
                return [
                    'id' => (string)$event['id'],
                    'title' => $event['title'],
                    'description' => $event['description'],
                    'date' => $event['date'],
                    'time' => $event['time'],
                    'price' => (float)$event['price'],
                    'totalTickets' => (int)$event['total_tickets'],
                    'soldTickets' => (int)$event['sold_tickets'],
                    'revenue' => (float)$event['total_revenue'],
                    'imageUrl' => $event['image_url'],
                    'location' => $event['location'],
                    'createdAt' => $event['created_at'],
                    'updatedAt' => $event['updated_at']
                ];
            }, $events);
            
            echo json_encode($formatted);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch your events']);
        }
        break;

    case 'reset-tickets':
        requireAdmin($pdo);
        
        try {
            $pdo->beginTransaction();
            
            if ($id) {
                // Reset specific event
                $stmt = $pdo->prepare("UPDATE events SET sold_tickets = 0 WHERE id = ?");
                $stmt->execute([$id]);
                
                $stmt = $pdo->prepare("DELETE FROM ticket_purchases WHERE event_id = ?");
                $stmt->execute([$id]);
            } else {
                // Reset all events
                $pdo->exec("UPDATE events SET sold_tickets = 0");
                $pdo->exec("DELETE FROM ticket_purchases");
            }
            
            $pdo->commit();
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Failed to reset tickets: ' . $e->getMessage()]);
        }
        break;

    case 'fix-data':
        try {
            $pdo->beginTransaction();
            
            // Activate all events
            $pdo->exec("UPDATE events SET status = 'active' WHERE status IS NULL OR status = ''");
            
            // Link ownership by matching titles with proposals
            $stmt = $pdo->query("SELECT id, title FROM events WHERE user_id IS NULL");
            $events = $stmt->fetchAll();
            $fixedCount = 0;
            
            foreach ($events as $event) {
                $stmtProp = $pdo->prepare("SELECT user_id FROM event_proposals WHERE event_name = ? AND user_id IS NOT NULL LIMIT 1");
                $stmtProp->execute([$event['title']]);
                $userId = $stmtProp->fetchColumn();
                
                if ($userId) {
                    $upd = $pdo->prepare("UPDATE events SET user_id = ? WHERE id = ?");
                    $upd->execute([$userId, $event['id']]);
                    $fixedCount++;
                }
            }
            
            $pdo->commit();
            echo json_encode(['success' => true, 'activated' => 'all', 'linked' => $fixedCount]);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
        
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Action not found']);
}
