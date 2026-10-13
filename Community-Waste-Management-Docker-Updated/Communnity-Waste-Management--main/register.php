<?php

header("Content-Type: application/json");

require_once "config.php";

$data = json_decode(file_get_contents("php://input"), true);

$fullName = trim($data["full_name"] ?? "");
$email = trim(strtolower($data["email"] ?? ""));
$password = $data["password"] ?? "";
$confirmPassword = $data["confirm_password"] ?? "";

if (
    $fullName === "" ||
    $email === "" ||
    $password === "" ||
    $confirmPassword === ""
) {
    echo json_encode([
        "success" => false,
        "message" => "Please complete all fields."
    ]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        "success" => false,
        "message" => "Please enter a valid email."
    ]);
    exit;
}

if (strlen($password) < 6) {
    echo json_encode([
        "success" => false,
        "message" => "Password must be at least 6 characters."
    ]);
    exit;
}

if ($password !== $confirmPassword) {
    echo json_encode([
        "success" => false,
        "message" => "Passwords do not match."
    ]);
    exit;
}



$check = $conn->prepare(
    "SELECT id FROM users WHERE email = ?"
);

$check->bind_param("s", $email);
$check->execute();

$result = $check->get_result();

if ($result->num_rows > 0) {

    echo json_encode([
        "success" => false,
        "message" => "Email is already registered."
    ]);

    exit;
}


$hashedPassword = password_hash(
    $password,
    PASSWORD_DEFAULT
);



$stmt = $conn->prepare(
    "INSERT INTO users (full_name, email, password)
     VALUES (?, ?, ?)"
);

$stmt->bind_param(
    "sss",
    $fullName,
    $email,
    $hashedPassword
);

if ($stmt->execute()) {

    echo json_encode([
        "success" => true,
        "message" => "Account created successfully."
    ]);

} else {

    echo json_encode([
        "success" => false,
        "message" => "Registration failed."
    ]);
}

$stmt->close();
$conn->close();
?>