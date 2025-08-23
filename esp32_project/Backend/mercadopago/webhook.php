<?php
require_once 'config.php';
require_once 'database.php';
require_once 'mercadopago.php';

// Configurar logging
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/webhook_errors.log');

header('Content-Type: application/json');

function logWebhook($label, $data = null) {
    $timestamp = date("Y-m-d H:i:s");
    $entry = "[$timestamp] $label";
    if ($data !== null) {
        $entry .= " | " . json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }
    $entry .= "\n" . str_repeat("-", 80) . "\n";
    file_put_contents(__DIR__ . '/webhook_log.txt', $entry, FILE_APPEND | LOCK_EX);
}

// =====================================================
// Capturar método y raw input
// =====================================================
$method    = $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN';
$raw_input = file_get_contents('php://input');
$headers   = getallheaders();

logWebhook("Webhook recibido", [
    'method'  => $method,
    'headers' => $headers,
    'raw'     => $raw_input,
    'server'  => [
        'REQUEST_URI' => $_SERVER['REQUEST_URI'] ?? '',
        'REMOTE_ADDR' => $_SERVER['REMOTE_ADDR'] ?? ''
    ]
]);

// =====================================================
// Si no es POST o no hay body -> MODO DEBUG
// =====================================================
if ($method !== 'POST' || trim($raw_input) === '') {
    $fake = [
        "type" => "payment",
        "data" => ["id" => "fake_payment_".time()],
        "debug" => true
    ];
    logWebhook("⚠️ DEBUG: Simulación de notificación", $fake);
    http_response_code(200);
    echo json_encode(['status' => 'debug', 'message' => 'Simulación de webhook', 'data' => $fake]);
    exit;
}

// =====================================================
// Decodificar JSON
// =====================================================
$input = json_decode($raw_input, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    logWebhook("ERROR: JSON inválido", ['error' => json_last_error_msg(), 'raw' => $raw_input]);
    http_response_code(200);
    echo json_encode(['status' => 'error', 'message' => 'JSON inválido']);
    exit;
}

// =====================================================
// Validar estructura mínima
// =====================================================
if (!isset($input['type']) || !isset($input['data']['id'])) {
    logWebhook("ERROR: Notificación sin datos válidos", $input);
    http_response_code(200);
    echo json_encode(['status' => 'ignored', 'message' => 'Notificación sin datos válidos']);
    exit;
}

$type      = $input['type'];
$paymentId = $input['data']['id'];

// Filtrar notificaciones de prueba
if ($paymentId === "123456" || strpos($paymentId, "test") !== false) {
    logWebhook("ℹ️ Notificación de prueba recibida", $input);
    http_response_code(200);
    echo json_encode(['status' => 'ok', 'message' => 'Notificación de prueba recibida']);
    exit;
}

// =====================================================
// Procesar pagos
// =====================================================
if ($type === 'payment') {
    try {
        $db = new Database();
        $conn = $db->getConnection();
        $conn->exec("SET time_zone = '" . (Config::IS_PRODUCTION ? '-03:00' : '-03:00') . "'");
        date_default_timezone_set(Config::TIMEZONE);

        $mp = new MercadoPagoHandler($conn);

        // Obtener información real del pago
        $paymentInfo = $mp->getPaymentInfo($paymentId);
        if (!$paymentInfo) {
            throw new Exception("No se pudo obtener información del pago $paymentId");
        }

        $status    = $paymentInfo['status'] ?? 'unknown';
        $machineId = $paymentInfo['external_reference'] ?? null;
        $amount    = $paymentInfo['transaction_amount'] ?? 0;

        logWebhook("ℹ️ Info del pago", [
            'paymentId' => $paymentId,
            'status'    => $status,
            'machineId' => $machineId,
            'amount'    => $amount
        ]);

        if ($status === 'approved') {
            // Verificar si ya se procesó
            $stmt = $conn->prepare("
                SELECT COUNT(*) as count FROM mercadopago_requests 
                WHERE payment_id = ? AND status = 'approved'
            ");
            $stmt->execute([$paymentId]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($existing['count'] > 0) {
                logWebhook("ℹ️ Pago ya procesado", ['paymentId' => $paymentId]);
                http_response_code(200);
                echo json_encode(['status' => 'already_processed']);
                exit;
            }

            // Procesar pago aprobado
            $result = $mp->processApprovedPayment($paymentId, $machineId, $amount);
            logWebhook("✅ Pago aprobado procesado", $result);

            http_response_code(200);
            echo json_encode($result);
        } else {
            logWebhook("⏳ Pago pendiente o rechazado", ['paymentId' => $paymentId, 'status' => $status]);
            http_response_code(200);
            echo json_encode(['status' => $status]);
        }
    } catch (Exception $e) {
        logWebhook("❌ Excepción en webhook", ['error' => $e->getMessage()]);
        http_response_code(200);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}

// =====================================================
// Otros eventos
// =====================================================
logWebhook("Evento ignorado", ['type' => $type]);
http_response_code(200);
echo json_encode(['status' => 'ignored']);
