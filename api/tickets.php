<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$id = $_GET['id'] ?? null;

switch ($action) {
    case 'purchase':
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit();
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['eventId'], $data['quantity'], $data['buyerName'], $data['buyerEmail'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields']);
            exit();
        }
        
        try {
            $pdo->beginTransaction();
            
            $stmt = $pdo->prepare("SELECT * FROM events WHERE id = ? FOR UPDATE");
            $stmt->execute([$data['eventId']]);
            $event = $stmt->fetch();
            
            if (!$event) {
                $pdo->rollBack();
                http_response_code(404);
                echo json_encode(['error' => 'Event not found']);
                exit();
            }
            
            $available = $event['total_tickets'] - $event['sold_tickets'];
            if ($data['quantity'] > $available) {
                $pdo->rollBack();
                http_response_code(400);
                echo json_encode(['error' => 'Not enough tickets available']);
                exit();
            }
            
            $totalAmount = $data['quantity'] * $event['price'];
            $qrCode = bin2hex(random_bytes(16));
            
            $user = getSessionUser($pdo);
            $userId = $user ? $user['id'] : null;
            
            $stmt = $pdo->prepare("
                INSERT INTO ticket_purchases (event_id, user_id, quantity, total_amount, buyer_name, buyer_email, buyer_phone, qr_code)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                RETURNING *
            ");
            $stmt->execute([
                $data['eventId'],
                $userId,
                $data['quantity'],
                $totalAmount,
                $data['buyerName'],
                $data['buyerEmail'],
                $data['buyerPhone'] ?? null,
                $qrCode
            ]);
            $purchase = $stmt->fetch();
            
            $stmt = $pdo->prepare("UPDATE events SET sold_tickets = sold_tickets + ? WHERE id = ?");
            $stmt->execute([$data['quantity'], $data['eventId']]);
            
            $pdo->commit();
            
            echo json_encode([
                'success' => true,
                'purchase' => [
                    'id' => (string)$purchase['id'],
                    'eventId' => (string)$purchase['event_id'],
                    'quantity' => (int)$purchase['quantity'],
                    'totalAmount' => (float)$purchase['total_amount'],
                    'buyerName' => $purchase['buyer_name'],
                    'buyerEmail' => $purchase['buyer_email'],
                    'buyerPhone' => $purchase['buyer_phone'],
                    'status' => $purchase['status'],
                    'qrCode' => $purchase['qr_code'],
                    'purchasedAt' => $purchase['purchased_at']
                ]
            ]);
        } catch (PDOException $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Failed to purchase tickets']);
        }
        break;
        
    case 'my-tickets':
        $user = requireAuth($pdo);
        
        try {
            $stmt = $pdo->prepare("
                SELECT tp.*, e.title as event_title, e.date as event_date, e.time as event_time
                FROM ticket_purchases tp
                JOIN events e ON tp.event_id = e.id
                WHERE tp.user_id = ?
                ORDER BY tp.purchased_at DESC
            ");
            $stmt->execute([$user['id']]);
            $tickets = $stmt->fetchAll();
            
            $formatted = array_map(function($t) {
                return [
                    'id' => (string)$t['id'],
                    'eventId' => (string)$t['event_id'],
                    'eventTitle' => $t['event_title'],
                    'eventDate' => $t['event_date'],
                    'eventTime' => $t['event_time'],
                    'quantity' => (int)$t['quantity'],
                    'totalAmount' => (float)$t['total_amount'],
                    'status' => $t['status'],
                    'qrCode' => $t['qr_code'],
                    'purchasedAt' => $t['purchased_at']
                ];
            }, $tickets);
            
            echo json_encode($formatted);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch tickets']);
        }
        break;
        
    case 'event-sales':
        requireAdmin($pdo);
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Event ID required']);
            exit();
        }
        
        try {
            $stmt = $pdo->prepare("
                SELECT tp.*, e.title as event_title
                FROM ticket_purchases tp
                JOIN events e ON tp.event_id = e.id
                WHERE tp.event_id = ?
                ORDER BY tp.purchased_at DESC
            ");
            $stmt->execute([$id]);
            $sales = $stmt->fetchAll();
            
            $formatted = array_map(function($s) {
                return [
                    'id' => (string)$s['id'],
                    'buyerName' => $s['buyer_name'],
                    'buyerEmail' => $s['buyer_email'],
                    'buyerPhone' => $s['buyer_phone'],
                    'quantity' => (int)$s['quantity'],
                    'totalAmount' => (float)$s['total_amount'],
                    'status' => $s['status'],
                    'purchasedAt' => $s['purchased_at']
                ];
            }, $sales);
            
            echo json_encode($formatted);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch sales']);
        }
        break;
        
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Action not found']);
}
