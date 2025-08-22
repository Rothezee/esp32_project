<?php
require_once 'config.php';
require_once 'database.php';
require_once 'mercadopago.php';

// Configurar logging
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/webhook_errors.log');

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

// Log para depuración
$log_entry = date("Y-m-d H:i:s") . " - Webhook recibido: " . $raw_input . "\n";
file_put_contents(__DIR__ . '/webhook_log.txt', $log_entry, FILE_APPEND | LOCK_EX);

// Validar estructura mínima
if (!isset($input['type']) || !isset($input['data']['id'])) {
    http_response_code(200);
    echo json_encode(['status' => 'ignored', 'message' => 'Notificación sin datos válidos']);
    exit;
}

$type = $input['type'];
$paymentId = $input['data']['id'];

// Filtrar notificaciones de prueba
if ($paymentId === "123456" || strpos($paymentId, "test") !== false) {
    http_response_code(200);
    echo json_encode(['status' => 'ok', 'message' => 'Notificación de prueba recibida']);
    exit;
}

// Procesar solo notificaciones de pago
if ($type === 'payment') {
    try {
        $db = new Database();
        $conn = $db->getConnection();
        
        // Configurar zona horaria
        $conn->exec("SET time_zone = '" . (Config::IS_PRODUCTION ? '-03:00' : '-03:00') . "'");
        date_default_timezone_set(Config::TIMEZONE);

        $mp = new MercadoPagoHandler($conn);
        
        // Obtener información del pago
        $paymentInfo = $mp->getPaymentInfo($paymentId);

        if (!$paymentInfo) {
            throw new Exception("No se pudo obtener información del pago $paymentId");
        }

        $status = $paymentInfo['status'] ?? 'unknown';
        $machineId = $paymentInfo['external_reference'] ?? null;
        $amount = $paymentInfo['transaction_amount'] ?? 0;

        if (!$machineId) {
            throw new Exception("No se encontró machine_id en external_reference");
        }

        // Log del estado del pago
        error_log("Webhook - Payment ID: $paymentId, Status: $status, Machine: $machineId, Amount: $amount");

        if ($status === 'approved') {
            // Verificar que no se haya procesado antes
            $stmt = $conn->prepare("
                SELECT COUNT(*) as count FROM mercadopago_requests 
                WHERE payment_id = ? AND status = 'approved'
            ");
            $stmt->execute([$paymentId]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($existing['count'] > 0) {
                http_response_code(200);
                echo json_encode(['status' => 'already_processed', 'message' => 'Pago ya procesado anteriormente']);
                exit;
            }

            // Procesar el pago aprobado
            $result = $mp->processApprovedPayment($paymentId, $machineId, $amount);
            
            http_response_code(200);
            echo json_encode($result);

        } elseif ($status === 'rejected' || $status === 'cancelled') {
            // Actualizar estado como rechazado
            $stmt = $conn->prepare("
                UPDATE mercadopago_requests 
                SET status = 'rejected', payment_id = ?, updated_at = NOW() 
                WHERE machine_id = ? AND status = 'pending'
                ORDER BY created_at DESC LIMIT 1
            ");
            $stmt->execute([$paymentId, $machineId]);

            http_response_code(200);
            echo json_encode(['status' => 'rejected', 'message' => 'Pago rechazado o cancelado']);

        } else {
            // Estado pendiente u otro
            http_response_code(200);
            echo json_encode(['status' => 'pending', 'message' => "Pago en estado: $status"]);
        }

    } catch (Exception $e) {
        error_log("Error en webhook: " . $e->getMessage());
        http_response_code(200); // Siempre devolver 200 para evitar reintentos
        echo json_encode(['error' => 'Error procesando webhook', 'details' => $e->getMessage()]);
    }
} else {
    http_response_code(200);
    echo json_encode(['status' => 'ignored', 'message' => "Evento '$type' no manejado"]);
}