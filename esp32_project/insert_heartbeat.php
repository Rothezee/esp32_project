<?php
// Establecer el tipo de contenido de la respuesta como JSON
date_default_timezone_set('America/Argentina/Buenos_Aires');
header('Content-Type: application/json');

// Configurar la conexión a la base de datos
$servername = "localhost";
$username = "root";  // Cambia esto por tu nombre de usuario de la base de datos
$password = "39090169";  // Cambia esto por tu contraseña de la base de datos
$dbname = "esp32_report";  // Nombre de la base de datos

// Conectar a la base de datos
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar si la conexión falló
if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

// Obtener los datos POST enviados en formato JSON
$data = json_decode(file_get_contents('php://input'), true);

// Verificar si 'device_id' fue proporcionado
if (!isset($data['device_id'])) {
    echo json_encode(["error" => "Missing device_id"]);
    $conn->close();
    exit();
}

// Obtener el 'device_id' del JSON
$device_id = $conn->real_escape_string($data['device_id']);

// Preparar la consulta para actualizar o insertar
// Usamos la función MySQL "ON DUPLICATE KEY UPDATE" para manejar la actualización si ya existe
$sql = "INSERT INTO devices (device_id, last_heartbeat) 
        VALUES (?, NOW()) 
        ON DUPLICATE KEY UPDATE last_heartbeat = NOW()";

// Preparar la declaración SQL
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $device_id);

// Ejecutar la consulta
if ($stmt->execute()) {
    echo json_encode(["success" => "Heartbeat updated for device_id: $device_id"]);
} else {
    echo json_encode(["error" => "Error updating heartbeat: " . $stmt->error]);
}

// Cerrar la conexión
$stmt->close();
$conn->close();
?>
