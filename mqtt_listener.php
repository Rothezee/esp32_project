<?php
// mqtt_listener.php

/**
 * Este script actúa como un "puente" entre el broker MQTT y tu backend PHP.
 * Se suscribe a los tópicos de las máquinas y, cuando recibe un mensaje,
 * lo procesa y lo envía al endpoint PHP correspondiente (ej. insert_data.php)
 * mediante una petición HTTP POST local.
 *
 * CÓMO EJECUTARLO:
 * 1. Asegúrate de haber instalado la librería MQTT: `composer require php-mqtt/client`
 * 2. Ejecuta este script desde la línea de comandos (terminal) en tu servidor: `php mqtt_listener.php`
 * 3. El script se quedará corriendo para escuchar los mensajes. Se recomienda usar una herramienta
 *    como 'screen' o 'supervisor' para mantenerlo activo en segundo plano en un servidor de producción.
 */

// Desactivar el límite de tiempo de ejecución para que el script pueda correr indefinidamente.
set_time_limit(0);
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Hacemos la ruta al autoloader absoluta para evitar problemas al ejecutar el script desde diferentes ubicaciones.
$autoloader = __DIR__ . '/vendor/autoload.php';
if (!file_exists($autoloader)) {
    echo "[ERROR] El archivo 'vendor/autoload.php' no se encuentra. Por favor, ejecuta 'composer install' en el directorio del proyecto.\n";
    exit(1); // Salir con un código de error
}
require $autoloader;

use PhpMqtt\Client\MqttClient;
use PhpMqtt\Client\ConnectionSettings;

// ===== CONFIGURACIÓN =====
// Usar broker.emqx.io que funciona correctamente desde tu red
$mqtt_server   = 'broker.emqx.io'; 
$mqtt_port     = 1883;
$mqtt_client_id = 'php-mqtt-listener-' . uniqid(); // ID de cliente único

// Tópico al que nos suscribiremos. El '+' es un comodín para cualquier 'device_id'.
$topic_datos = 'maquinas/+/datos';
$topic_heartbeat = 'maquinas/+/heartbeat';

// URLs de tu backend local donde se enviarán los datos.
// Usamos un array para manejar los diferentes tipos de máquinas.
$backend_urls = [
    'default'     => 'http://localhost/esp32_project/insert_data.php',
    'videojuego'  => 'http://localhost/esp32_project/insert_data_videojuego.php',
    'ticketera'   => 'http://localhost/esp32_project/insert_data_ticketera.php',
];
$backend_url_heartbeat = 'http://localhost/esp32_project/insert_heartbeat.php';

echo "Iniciando listener MQTT...\n";
echo "Servidor: {$mqtt_server}:{$mqtt_port}\n";
echo "Suscrito a: '{$topic_datos}' y '{$topic_heartbeat}'\n";

echo "Creando cliente MQTT con ID: {$mqtt_client_id}\n";
echo "Resolviendo DNS para {$mqtt_server}...\n";

// Verificar que podemos resolver el DNS
$ip = gethostbyname($mqtt_server);
if ($ip === $mqtt_server) {
    echo "[ADVERTENCIA] No se pudo resolver el DNS. Usando el hostname directamente.\n";
} else {
    echo "DNS resuelto: {$mqtt_server} -> {$ip}\n";
}

$mqtt = new MqttClient($mqtt_server, $mqtt_port, $mqtt_client_id);

/**
 * Envía datos a un endpoint del backend usando cURL.
 * IMPORTANTE: Esta función debe estar definida ANTES de los callbacks
 *
 * @param string $url La URL del endpoint.
 * @param string $json_data Los datos en formato JSON.
 */
function send_to_backend($url, $json_data)
{
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($ch, CURLOPT_POSTFIELDS, $json_data);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Content-Length: ' . strlen($json_data)
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5); // Timeout de 5 segundos
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        echo "[ERROR] cURL falló al enviar a {$url}: {$error}\n";
    } elseif ($http_code >= 200 && $http_code < 300) {
        echo "-> Datos enviados a {$url} correctamente (HTTP {$http_code}).\n";
        echo "   Respuesta del backend: {$response}\n";
    } else {
        echo "[ERROR] El backend respondió con un error (HTTP {$http_code}) en {$url}.\n";
        echo "   Respuesta: {$response}\n";
    }
}

function connect_and_subscribe(MqttClient $mqtt, array $topics_with_callbacks)
{
    echo "Intentando conectar al broker MQTT...\n";
    
    // Usar los mismos valores que funcionaron en el diagnóstico
    $keepAlive = 60;
    $timeout = 15; // Mismo valor que el test exitoso
    $cleanSession = true;
    
    // Argumentos: username, password, will, keepAlive, timeout, cleanSession
    $mqtt->connect(null, null, null, $keepAlive, $timeout, $cleanSession);
    echo "Conectado al broker MQTT.\n";

    foreach ($topics_with_callbacks as $topic => $details) {
        $mqtt->subscribe($topic, $details['callback'], $details['qos']);
        echo "Suscrito a '{$topic}'\n";
    }
    echo "Suscripciones renovadas.\n";
}

$callback_datos = function ($topic, $message) use ($backend_urls) {
    echo "--------------------------------\n";
    echo "Mensaje recibido en tópico 'datos': {$topic}\n";
    echo "Payload: {$message}\n";

    $data = json_decode($message, true);

    if (json_last_error() !== JSON_ERROR_NONE || !isset($data['device_id'])) {
        echo "[ERROR] JSON inválido o sin device_id en tópico de datos.\n";
        return;
    }

    $device_id = $data['device_id'];
    $payload_for_backend = null;
    $url_destino = null;

    // Decidimos a qué endpoint enviar los datos según el device_id
    if (strpos($device_id, 'Videojuego_') === 0) {
        // Es una máquina de videojuegos
        $url_destino = $backend_urls['videojuego'];
        $payload_for_backend = [
            'device_id' => $device_id,
            'dato2'     => $data['partidas_jugadas'] ?? 0, // 'coin' para videojuegos
        ];
        echo "-> Dispositivo detectado: Videojuego. Enrutando a '{$url_destino}'.\n";

    } elseif (strpos($device_id, 'Ticket_') === 0) {
        // Es una máquina ticketera
        $url_destino = $backend_urls['ticketera'];
        $payload_for_backend = [
            'device_id' => $device_id,
            'dato2'     => $data['partidas_jugadas'] ?? 0, // 'coin' para ticketeras
            'dato5'     => $data['premios_pagados'] ?? 0,  // 'tickets' para ticketeras
        ];
        echo "-> Dispositivo detectado: Ticketera. Enrutando a '{$url_destino}'.\n";

    } else {
        // Por defecto, es una máquina tragamonedas estándar
        $url_destino = $backend_urls['default'];
        $payload_for_backend = [
            'device_id' => $device_id,
            'dato1'     => $data['pago'] ?? 0,
            'dato2'     => $data['partidas_jugadas'] ?? 0,
            'dato3'     => $data['premios_pagados'] ?? 0,
            'dato4'     => $data['banco'] ?? 0,
        ];
        echo "-> Dispositivo detectado: Máquina estándar. Enrutando a '{$url_destino}'.\n";
    }

    // ¡AQUÍ ESTABA EL PROBLEMA! Faltaba esta línea
    if ($url_destino && $payload_for_backend) {
        $json_to_send = json_encode($payload_for_backend);
        send_to_backend($url_destino, $json_to_send);
    } else {
        echo "[ERROR] No se pudo determinar el destino o payload para el device_id: {$device_id}\n";
    }
};

$callback_heartbeat = function ($topic, $message) use ($backend_url_heartbeat) {
    echo "--------------------------------\n";
    echo "Heartbeat recibido en tópico: {$topic}\n";
    echo "Payload: {$message}\n";

    // El payload del heartbeat ya es compatible con `insert_heartbeat.php`
    $data = json_decode($message, true);
    if (json_last_error() === JSON_ERROR_NONE && isset($data['device_id'])) {
        send_to_backend($backend_url_heartbeat, $message);
    } else {
        echo "[ERROR] JSON inválido o sin device_id en tópico de heartbeat.\n";
    }
};

// Conexión inicial. Si falla, el script se detendrá.
try {
    $subscriptions = [
        $topic_datos => ['callback' => $callback_datos, 'qos' => 0],
        $topic_heartbeat => ['callback' => $callback_heartbeat, 'qos' => 0]
    ];
    connect_and_subscribe($mqtt, $subscriptions);
} catch (\PhpMqtt\Client\Exceptions\ConnectingToBrokerFailedException $e) {
    echo "[ERROR CRÍTICO] No se pudo conectar al broker MQTT al iniciar: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n✓ Sistema iniciado y escuchando mensajes...\n";
echo "Presiona Ctrl+C para detener el listener.\n\n";

// Bucle infinito para mantener la escucha. La reconexión se maneja con excepciones.
while (true) {
    try {
        // El `true` en loop hace que espere por mensajes.
        // Si la conexión se pierde, este método lanzará una excepción que será capturada abajo.
        $mqtt->loop(true);
    } catch (\PhpMqtt\Client\Exceptions\MqttClientException | \PhpMqtt\Client\Exceptions\ConnectingToBrokerFailedException $e) {
        echo "[ERROR] Conexión perdida o fallida: " . $e->getMessage() . "\n";
        echo "Intentando reconectar en 10 segundos...\n\n";
        sleep(10);
        try {
            connect_and_subscribe($mqtt, $subscriptions);
        } catch (\PhpMqtt\Client\Exceptions\ConnectingToBrokerFailedException $reconnect_e) {
            echo "[ERROR] Falló la reconexión: " . $reconnect_e->getMessage() . "\n";
        }
    } catch (\Throwable $e) {
        // Este bloque captura otros errores inesperados que no son de la librería MQTT.
        echo "[ERROR] Ocurrió un error inesperado en el bucle principal: " . $e->getMessage() . "\n";
        echo "Esperando 10 segundos antes de continuar...\n";
        sleep(10);
    }
}

echo "Listener detenido.\n";
?>