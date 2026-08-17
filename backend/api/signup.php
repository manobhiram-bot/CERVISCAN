<?php
ob_start();
require_once __DIR__ . "/db.php";

header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

$name     = trim($data["name"] ?? "");
$email    = trim($data["email"] ?? "");
$password = trim($data["password"] ?? "");
$mobile   = trim($data["mobile"] ?? "");
$age      = trim($data["age"] ?? "");
$gender   = trim($data["gender"] ?? "");

if ($name === "" || !filter_var($email, FILTER_VALIDATE_EMAIL) || $password === "" || substr(strtolower($email), -10) !== "@gmail.com") {
    ob_clean();
    echo json_encode([
        "status" => "error",
        "message" => "Invalid input. Only @gmail.com email addresses are allowed."
    ]);
    exit;
}

$stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    ob_clean();
    echo json_encode([
        "status" => "error",
        "message" => "Email already exists"
    ]);
    exit;
}

$stmt = $conn->prepare(
    "INSERT INTO users (name, email, password, mobile, age, gender)
     VALUES (?, ?, ?, ?, ?, ?)"
);
$stmt->bind_param("ssssss", $name, $email, $password, $mobile, $age, $gender);

if ($stmt->execute()) {
    ob_clean();
    echo json_encode([
        "status"  => "success",
        "user_id" => $stmt->insert_id
    ]);
} else {
    ob_clean();
    echo json_encode([
        "status" => "error",
        "message" => "Registration failed: " . $stmt->error
    ]);
}
exit;
