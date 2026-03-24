<?php
require_once __DIR__ . '/config.php';

echo "<h2>Migration - Ticket Purchases Table</h2>";

try {
    // 1. Add payment_method
    try {
        $pdo->exec("ALTER TABLE ticket_purchases ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card'");
        echo "✅ Column 'payment_method' added/checked.<br>";
    } catch (PDOException $e) { echo "❌ Error adding payment_method: " . $e->getMessage() . "<br>"; }

    // 2. Add payment_proof
    try {
        $pdo->exec("ALTER TABLE ticket_purchases ADD COLUMN IF NOT EXISTS payment_proof TEXT");
        echo "✅ Column 'payment_proof' added/checked.<br>";
    } catch (PDOException $e) { echo "❌ Error adding payment_proof: " . $e->getMessage() . "<br>"; }

    // 3. Add buyer_phone
    try {
        $pdo->exec("ALTER TABLE ticket_purchases ADD COLUMN IF NOT EXISTS buyer_phone TEXT");
        echo "✅ Column 'buyer_phone' added/checked.<br>";
    } catch (PDOException $e) { echo "❌ Error adding buyer_phone: " . $e->getMessage() . "<br>"; }

    // 4. Ensure qr_code exists
    try {
        $pdo->exec("ALTER TABLE ticket_purchases ADD COLUMN IF NOT EXISTS qr_code TEXT");
        echo "✅ Column 'qr_code' added/checked.<br>";
    } catch (PDOException $e) { echo "❌ Error adding qr_code: " . $e->getMessage() . "<br>"; }

    // 5. Ensure status exists and set default
    try {
        $pdo->exec("ALTER TABLE ticket_purchases ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed'");
        echo "✅ Column 'status' added/checked.<br>";
    } catch (PDOException $e) { echo "❌ Error adding status: " . $e->getMessage() . "<br>"; }

    echo "<br><b>Migration terminée avec succès !</b><br>";
    echo "Vous pouvez maintenant retourner sur le site et réessayer l'achat.";

} catch (Exception $e) {
    echo "❌ Erreur critique : " . $e->getMessage();
}
