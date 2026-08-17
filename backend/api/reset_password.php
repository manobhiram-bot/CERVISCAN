<?php
ob_start();
require_once __DIR__ . "/db.php";

header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

$email    = strtolower(trim($data["email"] ?? ""));
$password = trim($data["password"] ?? "");

if ($email === "" || $password === "") {
    ob_clean();
    echo json_encode([
        "status" => "error",
        "message" => "Email and password required"
    ]);
    exit;
}

// Check if user exists
$stmt = $conn->prepare("SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows === 0) {
    $stmt->close();
    ob_clean();
    echo json_encode([
        "status" => "error",
        "message" => "User with this email does not exist"
    ]);
    exit;
}
$stmt->close();

// Update password
$stmt = $conn->prepare("UPDATE users SET password = ? WHERE LOWER(email) = ?");
$stmt->bind_param("ss", $password, $email);

if ($stmt->execute()) {
    ob_clean();
    echo json_encode([
        "status" => "success",
        "message" => "Password updated successfully"
    ]);
} else {
    ob_clean();
    echo json_encode([
        "status" => "error",
        "message" => "Failed to update password: " . $stmt->error
    ]);
}
$stmt->close();
$conn->close();
exit;
?>
