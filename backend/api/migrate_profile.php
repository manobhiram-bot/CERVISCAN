<?php
require_once "db.php";

$queries = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS age VARCHAR(10) DEFAULT NULL",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile VARCHAR(20) DEFAULT NULL",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(10) DEFAULT NULL",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(100) DEFAULT NULL",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image VARCHAR(255) DEFAULT NULL"
];

foreach ($queries as $sql) {
    if ($conn->query($sql) === TRUE) {
        echo "Query executed successfully: $sql<br>";
    } else {
        echo "Error: " . $conn->error . "<br>";
    }
}

$conn->close();
?>
