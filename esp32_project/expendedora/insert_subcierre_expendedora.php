<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);


// Crear un archivo de registro de errores
$log_file = 'error_log.txt';
ini_set('log_errors', 1);
ini_set('error_log', $log_file);

$servername = "localhost";
$username = "root";
$password = "39090169";
$dbname = "esp32_report";

// Crear conexión
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar conexión
if ($conn->connect_error) {
    error_log("Connection failed: " . $conn->connect_error);
    die("Connection failed: " . $conn->connect_error);
}

// Obtener los datos POST
$data = json_decode(file_get_contents('php://input'), true);

// Verificar que se hayan recibido todos los datos necesarios
if (!isset($data['device_id']) || !isset($data['partial_fichas']) || !isset($data['partial_dinero']) || !isset($data['partial_p1']) || !isset($data['partial_p2']) || !isset($data['partial_p3']) || !isset($data['employee_id'])) {
    error_log("Missing data");
    echo json_encode(["error" => "Missing data"]);
    $conn->close();
    exit();
}

$device_id = $data['device_id'];
$partial_fichas = $data['partial_fichas'];
$partial_dinero = $data['partial_dinero'];
$partial_p1 = $data['partial_p1'];
$partial_p2 = $data['partial_p2'];
$partial_p3 = $data['partial_p3'];
$employee_id = $data['employee_id'];
$created_at = date("Y-m-d H:i:s");

// Insertar datos en la tabla subcierres_expendedoras
$sql = "INSERT INTO subcierres_expendedoras (cierre_expendedora_id, partial_fichas, partial_dinero, partial_p1, partial_p2, partial_p3, employee_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
if (!$stmt) {
    error_log("Prepare failed: " . $conn->error);
    echo json_encode(["error" => "Prepare failed"]);
    $conn->close();
    exit();
}
$stmt->bind_param("siiiiiss", $device_id, $partial_fichas, $partial_dinero, $partial_p1, $partial_p2, $partial_p3, $employee_id, $created_at);

if ($stmt->execute()) {
    echo json_encode(["success" => "Data inserted successfully"]);
} else {
    error_log("Execute failed: " . $stmt->error);
    echo json_encode(["error" => "Error inserting data"]);
}

$stmt->close();
$conn->close();
?>