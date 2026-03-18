<?php
require_once __DIR__ . '/config.php';

echo "<h1>DB Diagnostic</h1>";

// Basic Info
echo "<h2>Connection Details</h2>";
echo "<ul>";
echo "<li>Host: " . ($dbHost ?? 'N/A') . "</li>";
echo "<li>Database: " . ($dbName ?? 'N/A') . "</li>";
echo "<li>User: " . ($dbUser ?? 'N/A') . "</li>";
echo "<li>Port: " . ($dbPort ?? 'N/A') . "</li>";
echo "</ul>";

// Check Tables
echo "<h2>Tables Status</h2>";
try {
    $tables = ['users', 'events', 'sessions', 'ticket_purchases', 'event_proposals'];
    foreach ($tables as $table) {
        $stmt = $pdo->query("SELECT COUNT(*) FROM $table");
        $count = $stmt->fetchColumn();
        echo "<li>Table <b>$table</b>: $count rows</li>";
    }
} catch (Exception $e) {
    echo "<p style='color: red;'>Error checking tables: " . $e->getMessage() . "</p>";
}

// Check latest user
echo "<h2>Latest User Registered</h2>";
try {
    $stmt = $pdo->query("SELECT id, name, email, created_at FROM users ORDER BY created_at DESC LIMIT 1");
    $user = $stmt->fetch();
    if ($user) {
        echo "<pre>" . print_r($user, true) . "</pre>";
    } else {
        echo "<p>No users found in DB.</p>";
    }
} catch (Exception $e) {
    echo "<p style='color: red;'>Error fetching users: " . $e->getMessage() . "</p>";
}
