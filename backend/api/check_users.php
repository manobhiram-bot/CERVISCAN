<?php
require_once "db.php";
$res = $conn->query("SELECT id, name, email FROM users");
while($row = $res->fetch_assoc()) {
    print_r($row);
}
?>
