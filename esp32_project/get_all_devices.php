<?php
// get_all_devices.php
// Returns every device_id that has ever reported in (from the devices heartbeat table)

ini_set('display_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error_log.txt');

date_default_timezone_set('America/Argentina/Buenos_Aires');
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Connection: close');

include 'conn/connection.php';

$conn->query("SET time_zone = '-03:00'");

// Pull every device_id that ever sent a heartbeat, plus its last_heartbeat time
$sql  = "SELECT device_id, last_heartbeat FROM devices ORDER BY device_id ASC";
$result = $conn->query($sql);

if (!$result) {
    http_response_code(500);
    echo json_encode(['error' => 'Query failed: ' . $conn->error]);
    $conn->close();
    exit();
}

$devices = [];
while ($row = $result->fetch_assoc()) {
    $devices[] = [
        'device_id'      => $row['device_id'],
        'last_heartbeat' => $row['last_heartbeat']
    ];
}

echo json_encode(['devices' => $devices]);
$conn->close();
?>