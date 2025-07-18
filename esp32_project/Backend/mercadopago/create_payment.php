<?php
require_once 'config.php';
require_once 'database.php';
require_once 'mercadopago.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['amount']) || !isset($input['machine_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Faltan parámetros requeridos']);
    exit;
}

$amount = floatval($input['amount']);
$machineId = $input['machine_id'];
$description = $input['description'] ?? '';

if ($amount <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'El monto debe ser mayor a 0']);
    exit;
}

try {
    $db = new Database();
    $mp = new MercadoPagoHandler($db->getConnection());

    $result = $mp->createPayment($amount, $machineId, $description);

    if ($result['success']) {
        echo json_encode($result);
    } else {
        http_response_code(400);
        echo json_encode($result);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error interno del servidor']);
}