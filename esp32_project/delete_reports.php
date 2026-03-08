<?php
/**
 * delete_reports.php
 *
 * Parámetros POST (JSON):
 *   mode        string  'single'     → borrar un reporte por ID
 *                       'range'      → borrar registros de un device entre dos fechas
 *                       'global'     → borrar registros de TODOS los devices hasta una fecha
 *   device_id   string  requerido para mode=single y mode=range
 *   report_id   int     requerido para mode=single
 *   fecha_desde string  YYYY-MM-DD  requerido para mode=range
 *   fecha_hasta string  YYYY-MM-DD  requerido para mode=range y mode=global
 *
 * Siempre devuelve JSON: { success, deleted, message } o { error }
 */

ini_set('display_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error_log.txt');

date_default_timezone_set('America/Argentina/Buenos_Aires');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Connection: close');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

include 'conn/connection.php';
$conn->query("SET time_zone = '-03:00'");

$input = file_get_contents('php://input');
$data  = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit();
}

$mode = $data['mode'] ?? '';

// ── Helper: validate date format YYYY-MM-DD ──────────────
function validDate($str) {
    if (!$str || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $str)) return false;
    [$y, $m, $d] = explode('-', $str);
    return checkdate((int)$m, (int)$d, (int)$y);
}

// ══════════════════════════════════════════════
//  MODE: single — borrar un reporte por ID
// ══════════════════════════════════════════════
if ($mode === 'single') {
    $device_id = $data['device_id'] ?? '';
    $report_id = isset($data['report_id']) ? (int)$data['report_id'] : 0;

    if (!$device_id || !$report_id) {
        http_response_code(400);
        echo json_encode(['error' => 'device_id y report_id son requeridos para mode=single']);
        exit();
    }

    // Verificar que el reporte pertenece al device (seguridad)
    $check = $conn->prepare("SELECT id FROM datos WHERE id = ? AND device_id = ?");
    $check->bind_param("is", $report_id, $device_id);
    $check->execute();
    $check->store_result();

    if ($check->num_rows === 0) {
        $check->close();
        http_response_code(404);
        echo json_encode(['error' => 'Reporte no encontrado o no pertenece a este dispositivo']);
        exit();
    }
    $check->close();

    $stmt = $conn->prepare("DELETE FROM datos WHERE id = ? AND device_id = ?");
    $stmt->bind_param("is", $report_id, $device_id);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'deleted' => $stmt->affected_rows, 'message' => "Reporte #$report_id eliminado"]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Error al eliminar: ' . $stmt->error]);
    }
    $stmt->close();

// ══════════════════════════════════════════════
//  MODE: range — borrar rango de un device
// ══════════════════════════════════════════════
} elseif ($mode === 'range') {
    $device_id   = $data['device_id']   ?? '';
    $fecha_desde = $data['fecha_desde'] ?? '';
    $fecha_hasta = $data['fecha_hasta'] ?? '';

    if (!$device_id) {
        http_response_code(400);
        echo json_encode(['error' => 'device_id es requerido para mode=range']);
        exit();
    }
    if (!validDate($fecha_desde) || !validDate($fecha_hasta)) {
        http_response_code(400);
        echo json_encode(['error' => 'Fechas inválidas. Formato esperado: YYYY-MM-DD']);
        exit();
    }
    if ($fecha_desde > $fecha_hasta) {
        http_response_code(400);
        echo json_encode(['error' => 'fecha_desde no puede ser posterior a fecha_hasta']);
        exit();
    }

    $sql  = "DELETE FROM datos WHERE device_id = ? AND DATE(timestamp) BETWEEN ? AND ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sss", $device_id, $fecha_desde, $fecha_hasta);

    if ($stmt->execute()) {
        $n = $stmt->affected_rows;
        echo json_encode(['success' => true, 'deleted' => $n, 'message' => "$n registro(s) eliminados de $device_id entre $fecha_desde y $fecha_hasta"]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Error al eliminar: ' . $stmt->error]);
    }
    $stmt->close();

// ══════════════════════════════════════════════
//  MODE: global — borrar TODOS los devices hasta fecha
// ══════════════════════════════════════════════
} elseif ($mode === 'global') {
    $fecha_hasta = $data['fecha_hasta'] ?? '';

    if (!validDate($fecha_hasta)) {
        http_response_code(400);
        echo json_encode(['error' => 'fecha_hasta inválida. Formato esperado: YYYY-MM-DD']);
        exit();
    }

    $sql  = "DELETE FROM datos WHERE DATE(timestamp) <= ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $fecha_hasta);

    if ($stmt->execute()) {
        $n = $stmt->affected_rows;
        echo json_encode(['success' => true, 'deleted' => $n, 'message' => "$n registro(s) eliminados de todos los dispositivos hasta $fecha_hasta"]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Error al eliminar: ' . $stmt->error]);
    }
    $stmt->close();

} else {
    http_response_code(400);
    echo json_encode(['error' => "mode inválido: '$mode'. Usar: single | range | global"]);
}

$conn->close();
?>