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

$stmt = $conn->prepare(
    "SELECT id, name, email, password, age, mobile, gender, location, profile_image
     FROM users
     WHERE LOWER(email) = ?
     LIMIT 1"
);
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    if ($password === $row["password"]) {
        $profile_image = $row["profile_image"] ?? "";
        if ($profile_image !== "") {
            $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https" : "http";
            $host = $_SERVER['HTTP_HOST'];
            $url_parts = parse_url($profile_image);
            if (isset($url_parts['path'])) {
                $profile_image = $protocol . "://" . $host . $url_parts['path'];
            }
        }
        
        ob_clean();
        echo json_encode([
            "status"  => "success",
            "user_id" => (int)$row["id"],
            "name"    => $row["name"],
            "email"   => $row["email"],
            "age"      => $row["age"] ?? "",
            "mobile"   => $row["mobile"] ?? "",
            "gender"   => $row["gender"] ?? "",
            "location" => $row["location"] ?? "",
            "profile_image" => $profile_image
        ]);
        exit;
    }
}

ob_clean();
echo json_encode([
    "status" => "error",
    "message" => "Invalid email or password"
]);
exit;
