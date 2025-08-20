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

// Log para depuración SIEMPRE
file_put_contents('webhook_log.txt', date("Y-m-d H:i:s") . " - " . $raw_input . "\n", FILE_APPEND);

// Validar estructura mínima
if (!isset($input['type']) || !isset($input['data']['id'])) {
    http_response_code(200); // responder igual 200
    echo json_encode(['status' => 'ignored', 'message' => 'Notificación sin datos válidos']);
    exit;
}

$type = $input['type'];
$paymentId = $input['data']['id'];

// 🔹 Si es notificación de PRUEBA (ej: desde el panel)
if ($paymentId === "123456" || strpos($paymentId, "test") !== false) {
    http_response_code(200);
    echo json_encode(['status' => 'ok', 'message' => 'Notificación de prueba recibida']);
    exit;
}

if ($type === 'payment') {
    try {
        $db = new Database();
        $conn = $db->getConnection();

        $mp = new MercadoPagoHandler($conn);
        $esp32 = new ESP32Communication($conn);

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

            http_response_code(200);
            echo json_encode($result);
        } else {
            http_response_code(200);
            echo json_encode(['status' => 'pending', 'message' => 'Pago no aprobado aún']);
        }
    } catch (Exception $e) {
        http_response_code(200); // devolver 200 siempre
        echo json_encode(['error' => 'Excepción en webhook', 'details' => $e->getMessage()]);
    }
} else {
    http_response_code(200);
    echo json_encode(['status' => 'ignored', 'message' => 'Evento no manejado']);
}
