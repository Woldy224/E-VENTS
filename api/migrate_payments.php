<?php
require __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

require_once __DIR__ . '/config.php';

header('Content-Type: application/json');

try {
    $pdo->beginTransaction();

    // Add payment_method and payment_proof to ticket_purchases
    $pdo->exec("ALTER TABLE ticket_purchases ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'card'");
    $pdo->exec("ALTER TABLE ticket_purchases ADD COLUMN IF NOT EXISTS payment_proof TEXT");
    
    // Update status to support 'pending_verification'
    // (PostgreSQL VARCHAR(50) doesn't need to be updated char collection)
    
    $pdo->commit();

    echo json_encode([
        'success' => true, 
        'message' => 'Database migrated successfully for payment integration.'
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
