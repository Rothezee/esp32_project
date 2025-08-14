<?php
require_once 'config.php';
require_once 'database.php';
require_once 'mercadopago.php';
require_once 'esp32_communication.php';

header('Content-Type: application/json');

// Solo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

// Capturar datos crudos
$raw_input = file_get_contents('php://input');
$input = json_decode($raw_input, true);

if (!$input) {
    $input = $_POST; // fallback
}

// Log para depuración
file_put_contents('webhook_log.txt', date("Y-m-d H:i:s") . " - " . $raw_input . "\n", FILE_APPEND);

// Validar estructura mínima
if (!isset($input['type']) || !isset($input['data']['id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Datos inválidos']);
    exit;
}

if ($input['type'] === 'payment') {
    try {
        $db = new Database();
        $conn = $db->getConnection();

        $mp = new MercadoPagoHandler($conn);
        $esp32 = new ESP32Communication($conn);

        $paymentId = $input['data']['id'];
        $paymentInfo = $mp->getPaymentInfo($paymentId);

        if (isset($paymentInfo['status']) && $paymentInfo['status'] === 'approved') {
            $machineId = $paymentInfo['external_reference'];
            $amount = $paymentInfo['transaction_amount'];

            // Actualizar en DB
            $stmt = $conn->prepare("
                UPDATE mercadopago_requests 
                SET status = 'approved', payment_id = ?, updated_at = NOW() 
                WHERE machine_id = ? AND status = 'pending'
                ORDER BY created_at DESC LIMIT 1
            ");
            $stmt->execute([$paymentId, $machineId]);

            // Enviar crédito al ESP32
            $result = $esp32->sendCreditToMachine($machineId, $amount);

            echo json_encode($result);
        } else {
            echo json_encode(['status' => 'pending', 'message' => 'Pago no aprobado']);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error procesando webhook', 'details' => $e->getMessage()]);
    }
} else {
    echo json_encode(['status' => 'ignored', 'message' => 'Tipo de evento no manejado']);
}
