<?php
include '../conn/connection.php';

// Obtener los datos POST
$data = json_decode(file_get_contents('php://input'), true);

// Verificar que se hayan recibido todos los datos necesarios
if (!isset($data['device_id']) || !isset($data['dato1']) || !isset($data['dato2'])) {
    error_log("Missing data: " . json_encode($data));
    echo json_encode(["error" => "Missing data"]);
    $conn->close();
    exit();
}

$device_id = $data['device_id'];
$dato1 = $data['dato1'];
$dato2 = $data['dato2'];
$dato3 = 0; // Valor predeterminado
$dato4 = 0; // Valor predeterminado
$dato5 = 0; // Valor predeterminado

// Insertar datos para máquinas de grúa
$sql = "INSERT INTO datos (device_id, dato1, dato2, dato3, dato4, dato5) VALUES (?, ?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
if (!$stmt) {
    error_log("Prepare failed: " . $conn->error);
    echo json_encode(["error" => "Prepare failed"]);
    $conn->close();
    exit();
}
$stmt->bind_param("siiiii", $device_id, $dato1, $dato2, $dato3, $dato4, $dato5);

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
    $update_stmt->bind_param("s", $device_id);
    if ($update_stmt->execute()) {
        echo json_encode(["success" => "Data inserted successfully"]);
    } else {
        error_log("Update execute failed: " . $update_stmt->error);
        echo json_encode(["error" => "Error updating last_heartbeat"]);
    }
    $update_stmt->close();
} else {
    error_log("Execute failed: " . $stmt->error);
    echo json_encode(["error" => "Error inserting data"]);
}

$stmt->close();
$conn->close();
?>
