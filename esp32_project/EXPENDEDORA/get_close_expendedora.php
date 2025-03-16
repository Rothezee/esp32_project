<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$servername = "localhost";
$username = "root";
$password = "39090169";
$dbname = "esp32_report";

// Crear conexión
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar conexión
if ($conn->connect_error) {
    header('Content-Type: application/json');
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

// Verificar si se ha proporcionado un device_id
if (!isset($_GET['device_id'])) {
    header('Content-Type: application/json');
    die(json_encode(["error" => "device_id no proporcionado."]));
}

$device_id = $_GET['device_id'];

// Consulta para obtener los datos de la máquina de tickets
$sql = "SELECT id, device_id, dato1, dato2, timestamp FROM datos WHERE device_id = ?";
$stmt = $conn->prepare($sql);
if (!$stmt) {
    header('Content-Type: application/json');
    die(json_encode(["error" => "Prepare failed: " . $conn->error]));
}
$stmt->bind_param("s", $device_id);
$stmt->execute();
$result = $stmt->get_result();

$reports = [];
while ($row = $result->fetch_assoc()) {
    $reports[] = $row;
}

$response = [
    "reports" => $reports
];

header('Content-Type: application/json');
echo json_encode($response);

$stmt->close();
$conn->close();
?>
