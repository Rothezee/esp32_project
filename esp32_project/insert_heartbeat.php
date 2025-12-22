<?php
// ===== CONFIGURACIÓN DE ERRORES =====
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error_log.txt');

// ===== ZONA HORARIA Y HEADERS =====
date_default_timezone_set('America/Argentina/Buenos_Aires');
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Connection: close');

// Manejar preflight requests (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ===== CONEXIÓN A BASE DE DATOS =====
include 'conn/connection.php';

// ===== CONFIGURAR ZONA HORARIA DE MYSQL =====
$conn->query("SET time_zone = '-03:00'");
// O alternativamente:
// $conn->query("SET time_zone = 'America/Argentina/Buenos_Aires'");

// ===== OBTENER Y VALIDAR DATOS =====
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Verificar errores de JSON
if (json_last_error() !== JSON_ERROR_NONE) {
    $log_message = "Invalid JSON for heartbeat at " . date('Y-m-d H:i:s') . "\n";
    $log_message .= "Raw data: " . $input . "\n";
    $log_message .= "JSON Error: " . json_last_error_msg() . "\n---\n";
    file_put_contents(__DIR__ . '/invalid_json_log.txt', $log_message, FILE_APPEND);
    
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => "Invalid JSON format",
        "details" => json_last_error_msg()
    ]);
    if (isset($conn)) $conn->close();
    exit();
}

// Verificar que se recibió el device_id
if (!isset($data['device_id'])) {
    error_log("Missing device_id for heartbeat: " . json_encode($data));
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => "Missing required field: device_id"
    ]);
    if (isset($conn)) $conn->close();
    exit();
}

$device_id = $data['device_id'];

// ===== ACTUALIZAR HEARTBEAT =====
$sql = "INSERT INTO devices (device_id, last_heartbeat) 
        VALUES (?, NOW()) 
        ON DUPLICATE KEY UPDATE last_heartbeat = NOW()";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    error_log("Heartbeat Prepare failed: " . $conn->error);
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Database prepare error"]);
    $conn->close();
    exit();
}

$stmt->bind_param("s", $device_id);

if ($stmt->execute()) {
    http_response_code(200);
    echo json_encode(["success" => true, "message" => "Heartbeat updated for device_id: $device_id"]);
} else {
    error_log("Heartbeat Execute failed: " . $stmt->error);
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Error updating heartbeat"]);
}

$stmt->close();
$conn->close();
?>
