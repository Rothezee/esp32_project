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
if (!isset($data['id_expendedora']) || !isset($data['fichas']) || !isset($data['dinero']) || !isset($data['p1']) || !isset($data['p2']) || !isset($data['p3'])) {
    error_log("Missing data");
    echo json_encode(["error" => "Missing data"]);
    $conn->close();
    exit();
}

$id_expendedora = $data['id_expendedora'];
$fichas = $data['fichas'];
$dinero = $data['dinero'];
$p1 = $data['p1'];
$p2 = $data['p2'];
$p3 = $data['p3'];
$timestamp = date("Y-m-d H:i:s");

// Insertar datos en la tabla cierres_expendedoras
$sql = "INSERT INTO cierres_expendedoras (id_expendedora, fichas, dinero, p1, p2, p3, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
if (!$stmt) {
    error_log("Prepare failed: " . $conn->error);
    echo json_encode(["error" => "Prepare failed"]);
    $conn->close();
    exit();
}
$stmt->bind_param("siiiiis", $id_expendedora, $fichas, $dinero, $p1, $p2, $p3, $timestamp);

if ($stmt->execute()) {
    // Actualizar el last_heartbeat en la tabla devices
    $update_sql = "INSERT INTO devices (device_id, last_heartbeat) VALUES (?, NOW()) ON DUPLICATE KEY UPDATE last_heartbeat = NOW()";
    $update_stmt = $conn->prepare($update_sql);
    if (!$update_stmt) {
        error_log("Update prepare failed: " . $conn->error);
        echo json_encode(["error" => "Update prepare failed"]);
        $conn->close();
        exit();
    }
    $update_stmt->bind_param("s", $id_expendedora);
    $update_stmt->execute();
    $update_stmt->close();

    echo json_encode(["success" => "Data inserted successfully"]);
} else {
    error_log("Execute failed: " . $stmt->error);
    echo json_encode(["error" => "Error inserting data"]);
}

$stmt->close();
$conn->close();
?>
