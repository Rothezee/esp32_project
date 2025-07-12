<?php
require_once 'config.php';
require_once 'database.php';
require_once 'mercadopago.php';
require_once 'esp32_communication.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['type']) || !isset($input['data'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Datos inválidos']);
    exit;
}

if ($input['type'] === 'payment') {
    try {
        $db = new Database();
        $mp = new MercadoPagoHandler($db->getConnection());
        $esp32 = new ESP32Communication($db->getConnection());

        $paymentId = $input['data']['id'];
        $paymentInfo = $mp->getPaymentInfo($paymentId);

        if ($paymentInfo['status'] === 'approved') {
            $machineId = $paymentInfo['external_reference'];
            $amount = $paymentInfo['transaction_amount'];

            // Actualizar estado en base de datos
            $stmt = $db->getConnection()->prepare("
                UPDATE mercadopago_requests 
                SET status = 'approved', payment_id = ?, updated_at = NOW() 
                WHERE machine_id = ? AND status = 'pending'
                ORDER BY created_at DESC LIMIT 1
            ");
            $stmt->execute([$paymentId, $machineId]);

            // Enviar crédito al ESP32
            $result = $esp32->sendCreditToMachine($machineId, $amount);

            if ($result['success']) {
                echo json_encode(['status' => 'success', 'message' => 'Crédito enviado']);
            } else {
                echo json_encode(['status' => 'error', 'message' => $result['error']]);
            }
        } else {
            echo json_encode(['status' => 'pending', 'message' => 'Pago no aprobado']);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error procesando webhook']);
    }
} else {
    echo json_encode(['status' => 'ignored', 'message' => 'Tipo de evento no manejado']);
}