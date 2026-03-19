<?php
require_once __DIR__ . '/config.php';

echo "<h1>Migration et Mise à jour de l'Admin Railway</h1>";

try {
    // 1. Lecture du schéma principal
    $schemaFile = __DIR__ . '/heliumdb.sql';
    if (!file_exists($schemaFile)) {
        die("Erreur : heliumdb.sql introuvable.");
    }
    $sql = file_get_contents($schemaFile);

    // 2. Exécution de la création des tables (si elles n'existent pas)
    $pdo->exec($sql);

    // 3. Mise à jour ou Création de l'ADMIN avec le bon mot de passe
    $email = 'datamindscollectives.it@gmail.com';
    $password = 'DataM!nds559';
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $admin = $stmt->fetch();

    if ($admin) {
        $updateSql = "UPDATE users SET password_hash = ? WHERE id = ?";
        $pdo->prepare($updateSql)->execute([$hashedPassword, $admin['id']]);
        echo "<p style='color: blue;'>🔄 Admin existant reconnu. Mot de passe mis à jour vers votre version originale.</p>";
    } else {
        $insertSql = "INSERT INTO users (name, surname, email, password_hash, role) 
                      VALUES ('Admin', 'System', ?, ?, 'admin');";
        $pdo->prepare($insertSql)->execute([$email, $hashedPassword]);
        echo "<p style='color: green;'>✅ Nouvel utilisateur Admin créé avec votre mot de passe.</p>";
    }

    echo "<p style='color: green;'>✅ Migration terminée avec succès !</p>";
    echo "<p>Vous pouvez maintenant supprimer ce fichier `migrate.php` par sécurité.</p>";
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Erreur : " . $e->getMessage() . "</p>";
}
