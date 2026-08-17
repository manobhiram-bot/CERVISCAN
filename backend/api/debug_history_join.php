<?php
require_once "db.php";
$res = $conn->query("SELECT COUNT(*) as count FROM scan_history");
$row = $res->fetch_assoc();
echo "Scan History Count: " . $row['count'] . "\n";

$res = $conn->query("SELECT sh.*, p.user_id FROM scan_history sh JOIN patients p ON p.id = sh.patient_id");
while($row = $res->fetch_assoc()) {
    print_r($row);
}
?>
