<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$id = $_GET['id'] ?? null;

switch ($action) {
    case 'list':
        try {
            $stmt = $pdo->query("SELECT * FROM events WHERE status = 'active' ORDER BY date ASC");
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
            $stmt = $pdo->prepare("SELECT * FROM events WHERE id = ?");
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
            $stmt = $pdo->prepare("SELECT * FROM events WHERE user_id = ? ORDER BY date ASC");
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
        
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Action not found']);
}
