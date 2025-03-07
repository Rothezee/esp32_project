<?php
include 'conn/connection.php';

// Obtener los datos POST
$data = json_decode(file_get_contents('php://input'), true);

// Verificar que se hayan recibido todos los datos necesarios
if (!isset($data['device_id']) || !isset($data['dato2']) || !isset($data['dato5'])) {
    error_log("Missing data");
    echo json_encode(["error" => "Missing data"]);
    $conn->close();
    exit();
}

$device_id = $data['device_id'];
$dato2 = $data['dato2']; // Coin
$dato5 = $data['dato5']; // Tickets

$sql = "INSERT INTO datos (device_id, dato2, dato5) VALUES (?, ?, ?)";
$stmt = $conn->prepare($sql);
if (!$stmt) {
    error_log("Prepare failed: " . $conn->error);
    echo json_encode(["error" => "Prepare failed"]);
    $conn->close();
    exit();
}
$stmt->bind_param("sii", $device_id, $dato2, $dato5);

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
    $update_stmt->execute();

    echo json_encode(["success" => "Data inserted successfully"]);
} else {
    error_log("Execute failed: " . $stmt->error);
    echo json_encode(["error" => "Error inserting data"]);
}

$stmt->close();
$conn->close();
?>
