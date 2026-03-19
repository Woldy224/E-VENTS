<?php
require_once __DIR__ . '/config.php';

echo "<h1>Force Admin Reset</h1>";

try {
    $email = 'datamindscollectives.it@gmail.com';
    $password = 'DataM!nds559';
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("UPDATE users SET password_hash = ?, role = 'admin', name = 'Admin' WHERE email = ?");
    $stmt->execute([$hashedPassword, $email]);

    if ($stmt->rowCount() > 0) {
        echo "<p style='color: green;'>✅ SUCCÈS : Le mot de passe de l'admin a été réinitialisé à : 100% DataM!nds559</p>";
        echo "<p>Veuillez réessayer de vous connecter sur le site.</p>";
    } else {
        echo "<p style='color: orange;'>⚠️ AUCUN CHANGEMENT : L'utilisateur n'a pas été trouvé ou le mot de passe est déjà le même.</p>";
    }

} catch (Exception $e) {
    echo "<p style='color: red;'>❌ ERREUR : " . $e->getMessage() . "</p>";
}
