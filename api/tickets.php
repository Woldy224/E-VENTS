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
            
            $stmt = $pdo->prepare("
                SELECT e.*, 
                       (SELECT COALESCE(SUM(quantity), 0) FROM ticket_purchases WHERE event_id = e.id AND status != 'rejected') as sold_tickets
                FROM events e 
                WHERE e.id = ? FOR UPDATE
            ");
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
            
            $paymentMethod = $data['paymentMethod'] ?? 'card';
            $paymentProof = $data['paymentProof'] ?? null;
            // All tickets now go through Admin Verification
            $status = 'pending_verification';

            $stmt = $pdo->prepare("
                INSERT INTO ticket_purchases (event_id, user_id, quantity, total_amount, buyer_name, buyer_email, buyer_phone, qr_code, payment_method, payment_proof, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                $qrCode,
                $paymentMethod,
                $paymentProof,
                $status
            ]);
            $purchase = $stmt->fetch();
            
            // No manual update needed, counts are calculated dynamically
            
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
                    'purchasedAt' => $purchase['purchased_at'],
                    'paymentMethod' => $purchase['payment_method']
                ]
            ]);
        } catch (PDOException $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Failed to purchase tickets: ' . $e->getMessage()]);
        }
        break;
        
    case 'my-tickets':
        $user = requireAuth($pdo);
        
        try {
            $stmt = $pdo->prepare("
                SELECT tp.*, e.title as event_title, e.date as event_date, e.time as event_time, e.location as event_location
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
                    'eventLocation' => $t['event_location'],
                    'quantity' => (int)$t['quantity'],
                    'totalAmount' => (float)$t['total_amount'],
                    'status' => $t['status'],
                    'qrCode' => $t['qr_code'],
                    'purchasedAt' => $t['purchased_at'],
                    'paymentMethod' => $t['payment_method']
                ];
            }, $tickets);
            
            echo json_encode($formatted);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch tickets']);
        }
        break;
        
    case 'list-pending':
        requireAdmin($pdo);
        
        try {
            $stmt = $pdo->prepare("
                SELECT tp.*, e.title as event_title
                FROM ticket_purchases tp
                JOIN events e ON tp.event_id = e.id
                WHERE tp.status = 'pending_verification'
                ORDER BY tp.purchased_at DESC
            ");
            $stmt->execute();
            $pending = $stmt->fetchAll();
            
            echo json_encode($pending);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch pending payments']);
        }
        break;

    case 'verify-payment':
        requireAdmin($pdo);
        $data = json_decode(file_get_contents('php://input'), true);
        $purchaseId = $data['id'] ?? null;
        $decision = $data['decision'] ?? null; // 'approve' or 'reject'
        
        if (!$purchaseId || !$decision) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing purchase ID or decision']);
            exit();
        }
        
        try {
            $pdo->beginTransaction();
            
            $stmt = $pdo->prepare("SELECT * FROM ticket_purchases WHERE id = ? FOR UPDATE");
            $stmt->execute([$purchaseId]);
            $purchase = $stmt->fetch();
            
            if (!$purchase) {
                $pdo->rollBack();
                http_response_code(404);
                echo json_encode(['error' => 'Purchase not found']);
                exit();
            }
            
            if ($decision === 'approve') {
                $stmt = $pdo->prepare("UPDATE ticket_purchases SET status = 'completed' WHERE id = ?");
                $stmt->execute([$purchaseId]);
                // No manual update needed
            } else {
                $stmt = $pdo->prepare("UPDATE ticket_purchases SET status = 'rejected' WHERE id = ?");
                $stmt->execute([$purchaseId]);
                // No manual rollback needed, status 'rejected' is excluded from dynamic sum
            }
            
            $pdo->commit();
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Failed to verify payment']);
        }
        break;

    case 'event-sales':
        $user = requireAuth($pdo);
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Event ID required']);
            exit();
        }

        // Check permission: Admin OR Event Owner
        if (strtolower($user['role'] ?? '') !== 'admin') {
            $stmt = $pdo->prepare("SELECT user_id FROM events WHERE id = ?");
            $stmt->execute([$id]);
            $ownerId = $stmt->fetchColumn();
            
            if (!$ownerId || (int)$ownerId !== (int)$user['id']) {
                http_response_code(403);
                echo json_encode(['error' => 'Forbidden: You are not the owner of this event']);
                exit();
            }
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
        
    case 'scan':
        $user = requireAuth($pdo);
        
        $data = json_decode(file_get_contents('php://input'), true);
        $ticketId = $data['ticketId'] ?? null;
        
        if (!$ticketId) {
            http_response_code(400);
            echo json_encode(['error' => 'Veuillez scanner un billet valide.']);
            exit();
        }
        
        try {
            $pdo->beginTransaction();
            
            // Allow admin or the organizer of the event
            $stmt = $pdo->prepare("
                SELECT tp.*, e.user_id as organizer_id, e.title as event_title
                FROM ticket_purchases tp
                JOIN events e ON tp.event_id = e.id
                WHERE tp.id = ? FOR UPDATE
            ");
            $stmt->execute([$ticketId]);
            $ticket = $stmt->fetch();
            
            if (!$ticket) {
                $pdo->rollBack();
                http_response_code(404);
                echo json_encode(['error' => 'Billet introuvable dans la base de données.']);
                exit();
            }
            
            if (strtolower($user['role'] ?? '') !== 'admin' && (int)$ticket['organizer_id'] !== (int)$user['id']) {
                $pdo->rollBack();
                http_response_code(403);
                echo json_encode(['error' => 'Non autorisé. Vous n\'êtes pas l\'organisateur de cet événement.']);
                exit();
            }
            
            if ($ticket['status'] === 'used') {
                $pdo->rollBack();
                http_response_code(400);
                echo json_encode(['error' => 'Ce billet a DÉJÀ été scanné/utilisé.', 'ticket' => $ticket]);
                exit();
            }
            
            $stmt = $pdo->prepare("UPDATE ticket_purchases SET status = 'used' WHERE id = ?");
            $stmt->execute([$ticketId]);
            
            $pdo->commit();
            
            echo json_encode(['success' => true, 'ticket' => $ticket]);
        } catch (PDOException $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors de la validation du billet']);
        }
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Action not found']);
}
