<?php
ob_start();
require_once __DIR__ . "/db.php";

header("Content-Type: application/json");

$user_id = isset($_GET["user_id"]) ? (int)$_GET["user_id"] : 0;
$email   = isset($_GET["email"]) ? strtolower(trim($_GET["email"])) : "";

if ($user_id <= 0 && empty($email)) {
    $raw = file_get_contents("php://input");
    $data = json_decode($raw, true);
    if (!empty($data["user_id"])) {
        $user_id = (int)$data["user_id"];
    }
    if (!empty($data["email"])) {
        $email = strtolower(trim($data["email"]));
    }
}

if ($user_id <= 0 && empty($email)) {
    ob_clean();
    echo json_encode([
        "status" => "error",
        "message" => "user_id or email required"
    ]);
    exit;
}

if ($user_id > 0) {
    $stmt = $conn->prepare("SELECT id, name, email, age, mobile, gender, location, profile_image FROM users WHERE id = ? LIMIT 1");
    $stmt->bind_param("i", $user_id);
} else {
    $stmt = $conn->prepare("SELECT id, name, email, age, mobile, gender, location, profile_image FROM users WHERE LOWER(email) = ? LIMIT 1");
    $stmt->bind_param("s", $email);
}

$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    $profile_image = $row["profile_image"] ?? "";
    if ($profile_image !== "") {
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https" : "http";
        $host = $_SERVER['HTTP_HOST'] ?? "127.0.0.1:8080";
        $url_parts = parse_url($profile_image);
        if (isset($url_parts['path'])) {
            $profile_image = $protocol . "://" . $host . $url_parts['path'];
        }
    }

    ob_clean();
    echo json_encode([
        "status"        => "success",
        "user_id"       => (int)$row["id"],
        "name"          => $row["name"] ?? "",
        "email"         => $row["email"] ?? "",
        "age"           => $row["age"] ?? "",
        "mobile"        => $row["mobile"] ?? "",
        "gender"        => $row["gender"] ?? "",
        "location"      => $row["location"] ?? "",
        "profile_image" => $profile_image
    ]);
} else {
    ob_clean();
    echo json_encode([
        "status" => "error",
        "message" => "User not found"
    ]);
}
$stmt->close();
exit;
