<?php
header('Content-Type: application/json');
// Configurar la zona horaria del servidor
date_default_timezone_set('America/Argentina/Buenos_Aires');
include 'conn/connection.php';

$device_id = $conn->real_escape_string($_GET['device_id']);
$fechaInicio = isset($_GET['fechaInicio']) ? $conn->real_escape_string($_GET['fechaInicio']) : null;
$fechaFin = isset($_GET['fechaFin']) ? $conn->real_escape_string($_GET['fechaFin']) : null;

// Construir la consulta SQL para obtener los reportes
$sql = "SELECT id, timestamp, dato1, dato2, dato3, dato4 FROM datos WHERE device_id = '$device_id'";

if ($fechaInicio && $fechaFin) {
    $sql .= " AND timestamp BETWEEN '$fechaInicio' AND '$fechaFin'";
}

$sql .= " ORDER BY timestamp DESC";

$result = $conn->query($sql);

if (!$result) {
    die(json_encode(["error" => "Error executing query: " . $conn->error]));
}

$reports = [];

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $reports[] = $row;
    }
}

// Retrieve daily closes
$sql_closes = "SELECT close_date FROM daily_closes ORDER BY close_date ASC";
$result_closes = $conn->query($sql_closes);

if (!$result_closes) {
    die(json_encode(["error" => "Error executing query: " . $conn->error]));
}

$closes = [];

if ($result_closes->num_rows > 0) {
    while ($row = $result_closes->fetch_assoc()) {
        $closes[] = $row['close_date'];
    }
}

echo json_encode(["reports" => $reports, "closes" => $closes]);

$conn->close();
?>