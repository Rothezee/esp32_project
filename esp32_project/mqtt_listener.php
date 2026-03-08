<?php
// --- CONTROL DE EJECUCIÓN ---
set_time_limit(0); 
ignore_user_abort(true);

$lock_file = __DIR__ . '/mqtt_listener.lock';
$fp = fopen($lock_file, 'c');
if (!flock($fp, LOCK_EX | LOCK_NB)) {
    exit(); // Ya hay uno corriendo
}

function debug_log($message) {
    $log_entry = "[" . date('Y-m-d H:i:s') . "] " . $message . PHP_EOL;
    file_put_contents(__DIR__ . '/log_mqtt.txt', $log_entry, FILE_APPEND);
}

// --- CARGA DE LIBRERÍAS ---
$autoloader = __DIR__ . '/vendor/autoload.php';
if (!file_exists($autoloader)) {
    debug_log("[ERROR] No se encuentra vendor/autoload.php");
    exit(1);
}
require $autoloader;

use PhpMqtt\Client\MqttClient;
use PhpMqtt\Client\ConnectionSettings;

// ===== CONFIGURACIÓN =====
$mqtt_server    = 'broker.emqx.io'; 
$mqtt_port      = 1883;

// Agregamos un uniqid() al final para asegurar que cada vez que el cron lo 
// reinicia, EMQX no rechace la conexión por "Client ID ya en uso".
$mqtt_client_id = 'php_majo_listener_v3_' . uniqid(); 

// LA NUEVA URL ÚNICA UNIFICADA
$backend_url_api = './api_receptor.php';

// Tópico comodín (#). Escucha absolutamente todo lo que se publique bajo "maquinas/"
// Ya no hace falta separar datos y heartbeat en la suscripción.
$topic_general = 'maquinas/#'; 

function send_to_backend($url, $json_data) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($ch, CURLOPT_POSTFIELDS, $json_data);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Content-Length: ' . strlen($json_data)
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    // Agregué el $response al log. Así podés ver si el api_receptor.php 
    // tira algún error (ej. "DNI no registrado") directamente en log_mqtt.txt
    debug_log("-> Envío a API | HTTP: $http_code | Resp: " . trim($response));
}

$mqtt = new MqttClient($mqtt_server, $mqtt_port, $mqtt_client_id);

// Filtro para evitar duplicados en el mismo segundo
$last_payload = "";

// Un solo callback universal
$callback_general = function ($topic, $message) use ($backend_url_api, &$last_payload) {
    // Si el mensaje es exactamente igual al anterior, lo ignoramos (ráfagas)
    if ($message === $last_payload) return;
    $last_payload = $message;

    debug_log("Dato recibido en tópico: $topic");
    
    // Simplemente reenviamos el JSON tal cual llega al nuevo receptor inteligente
    send_to_backend($backend_url_api, $message);
};

try {
    debug_log("Conectando al broker EMQX...");
    $settings = (new ConnectionSettings)->setKeepAliveInterval(60)->setConnectTimeout(10);
    $mqtt->connect($settings, true);
    
    // Nos suscribimos al comodín universal
    $mqtt->subscribe($topic_general, $callback_general, 0);

    $start_time = time();
    // Lo hacemos durar solo 10 minutos para que el Cron lo refresque constantemente
    while (time() - $start_time < 600) {
        $mqtt->loop(true);
        usleep(50000); 
    }
} catch (\Throwable $e) {
    debug_log("[ERROR] " . $e->getMessage());
} finally {
    // Cerramos sesión y borramos el lock para que el siguiente Cron entre limpio
    flock($fp, LOCK_UN);
    fclose($fp);
    if (file_exists($lock_file)) unlink($lock_file);
    debug_log("Ciclo terminado. Lock liberado.");
}
?>