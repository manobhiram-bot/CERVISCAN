<?php
require_once "db.php";
$res = $conn->query("SELECT * FROM scan_history");
while($row = $res->fetch_assoc()) {
    print_r($row);
}
$res = $conn->query("SELECT * FROM patients");
while($row = $res->fetch_assoc()) {
    print_r($row);
}
?>
