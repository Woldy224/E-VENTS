<?php
require_once __DIR__ . '/config.php';

echo "<h1>Migration de la base de données Railway</h1>";

try {
    // 1. Lecture du schéma principal
    $schemaFile = __DIR__ . '/heliumdb.sql';
    if (!file_exists($schemaFile)) {
        die("Erreur : heliumdb.sql introuvable.");
    }
    $sql = file_get_contents($schemaFile);

    // 3. Exécution de la création des tables
    $pdo->exec($sql);

    // 4. Ajout de l'admin par défaut (si non présent)
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute(['datamindscollectives.it@gmail.com']);
    if (!$stmt->fetch()) {
        $adminSql = "INSERT INTO users (name, surname, email, password_hash, role) 
                     VALUES ('Admin', 'System', 'datamindscollectives.it@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');";
        $pdo->exec($adminSql);
    }

    echo "<p style='color: green;'>✅ Migration réussie ! Toutes les tables ont été créées.</p>";
    echo "<p>Vous pouvez maintenant supprimer ce fichier `migrate.php` par sécurité.</p>";
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Erreur lors de la migration : " . $e->getMessage() . "</p>";
}
