<?php
require_once "db.php";
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
echo "Database Connected Successfully";
$conn->close();
?>
