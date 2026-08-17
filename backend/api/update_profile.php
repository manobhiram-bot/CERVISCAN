<?php
ob_start();
require_once __DIR__ . "/db.php";

header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

$user_id  = intval($data["user_id"] ?? 0);
$name     = trim($data["name"] ?? "");
$age      = trim($data["age"] ?? "");
$mobile   = trim($data["mobile"] ?? "");
$gender   = trim($data["gender"] ?? "");
$location = trim($data["location"] ?? "");
$profile_image = trim($data["profile_image"] ?? "");

if ($user_id <= 0 || $name === "") {
    ob_clean();
    echo json_encode([
        "status" => "error",
        "message" => "User ID and Name are required"
    ]);
    exit;
}

$stmt = $conn->prepare(
    "UPDATE users 
     SET name = ?, age = ?, mobile = ?, gender = ?, location = ?, profile_image = ? 
     WHERE id = ?"
);
$stmt->bind_param("ssssssi", $name, $age, $mobile, $gender, $location, $profile_image, $user_id);


if ($stmt->execute()) {
    ob_clean();
    echo json_encode([
        "status" => "success",
        "message" => "Profile updated successfully"
    ]);
} else {
    ob_clean();
    echo json_encode([
        "status" => "error",
        "message" => $stmt->error
    ]);
}

$stmt->close();
$conn->close();
exit;
