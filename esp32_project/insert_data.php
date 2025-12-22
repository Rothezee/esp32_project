<?php
// ===== CONFIGURACIÓN DE ERRORES =====
ini_set('display_errors', 0); // ❌ Cambiar a 0 para producción (no mostrar errores al ESP32)
ini_set('display_startup_errors', 0); // ❌ Cambiar a 0
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error_log.txt'); // ✅ Mejor usar __DIR__

// ===== HEADERS (deben ir ANTES de cualquier output) =====
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

// ===== OBTENER Y VALIDAR DATOS =====
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Verificar errores de JSON
if (json_last_error() !== JSON_ERROR_NONE) {
    // El JSON es inválido. Guardar el input crudo para depuración.
    $log_message = "Invalid JSON received at " . date('Y-m-d H:i:s') . "\n";
    $log_message .= "Raw data: " . $input . "\n";
    $log_message .= "JSON Error: " . json_last_error_msg() . "\n---\n";
    // Guardar en un log separado para no mezclar con errores generales.
    file_put_contents(__DIR__ . '/invalid_json_log.txt', $log_message, FILE_APPEND);

    // Responder con un error claro.
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => "Invalid JSON format",
        "details" => json_last_error_msg()
    ]);
    if (isset($conn)) $conn->close();
    exit();
}

// Verificar que se recibieron todos los datos
// El listener MQTT se asegura de que los campos existan, pero esta validación
// sigue siendo útil si el script es llamado directamente por otro medio.
if (!isset($data['device_id']) || !isset($data['dato1']) ||
    !isset($data['dato2']) || !isset($data['dato3']) || !isset($data['dato4'])
) {
    error_log("Missing data: " . json_encode($data));
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => "Missing required fields"
    ]);
    if (isset($conn)) $conn->close();
    exit();
}

// Asignar variables
$device_id = $data['device_id']; // string
$dato1 = (int)$data['dato1']; // pago
$dato2 = (int)$data['dato2']; // partidas_jugadas
$dato3 = (int)$data['dato3']; // premios_pagados
$dato4 = (int)$data['dato4']; // banco

// ===== INSERTAR DATOS =====
$sql = "INSERT INTO datos (device_id, dato1, dato2, dato3, dato4, timestamp) 
        VALUES (?, ?, ?, ?, ?, NOW())";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    error_log("Prepare failed: " . $conn->error);
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Database prepare error"
    ]);
    $conn->close();
    exit();
}

$stmt->bind_param("siiii", $device_id, $dato1, $dato2, $dato3, $dato4);

if ($stmt->execute()) {
    $insert_id = $stmt->insert_id;
    
    // Actualizar last_heartbeat en devices
    $update_sql = "INSERT INTO devices (device_id, last_heartbeat) 
                   VALUES (?, NOW()) 
                   ON DUPLICATE KEY UPDATE last_heartbeat = NOW()";
    
    $update_stmt = $conn->prepare($update_sql);
    
    if ($update_stmt) {
        $update_stmt->bind_param("s", $device_id);
        $update_stmt->execute();
        $update_stmt->close();
    } else {
        error_log("Update prepare failed: " . $conn->error);
    }
    
    // ✅ Respuesta exitosa
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => "Data inserted successfully",
        "id" => $insert_id,
        "device_id" => $device_id,
        "timestamp" => time()
    ]);
    
} else {
    error_log("Execute failed: " . $stmt->error);
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Error inserting data"
    ]);
}

// ===== CERRAR CONEXIONES =====
$stmt->close();
$conn->close();
?>
