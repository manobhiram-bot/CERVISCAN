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
$location = trim($data["location"] ?? "");

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
    $stmt->close();
    ob_clean();
    echo json_encode([
        "status" => "error",
        "message" => "Email already exists"
    ]);
    exit;
}
$stmt->close();

$stmt = $conn->prepare(
    "INSERT INTO users (name, email, password, mobile, age, gender, location)
     VALUES (?, ?, ?, ?, ?, ?, ?)"
);
$stmt->bind_param("sssssss", $name, $email, $password, $mobile, $age, $gender, $location);

if ($stmt->execute()) {
    $user_id = $stmt->insert_id;
    $stmt->close();
    ob_clean();
    echo json_encode([
        "status"   => "success",
        "user_id"  => $user_id,
        "message"  => "User registered successfully"
    ]);
} else {
    $err = $stmt->error;
    $stmt->close();
    ob_clean();
    echo json_encode([
        "status" => "error",
        "message" => "Registration failed: " . $err
    ]);
}
exit;
