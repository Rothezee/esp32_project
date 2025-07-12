<?php
require_once 'config.php';
class MercadoPagoHandler {
    private $accessToken;
    private $db;
    public function __construct($db) {
        $this->accessToken = Config::MP_ACCESS_TOKEN;
        $this->db = $db;
    }
    public function createPayment($amount, $machineId, $description = '') {
        $url = 'https://api.mercadopago.com/checkout/preferences';

        $preference = [
            'items' => [
                [
                    'title' => $description ?: "Crédito para máquina $machineId",
                    'unit_price' => floatval($amount),
                    'quantity' => 1,
                    'currency_id' => 'ARS'
                ]
            ],
            'external_reference' => $machineId,
            'notification_url' => 'https://TU_DOMINIO/webhook.php', // cambia a tu dominio real
            'auto_return' => 'approved',
            'back_urls' => [
                'success' => 'https://TU_DOMINIO/success.php',
                'failure' => 'https://TU_DOMINIO/failure.php',
                'pending' => 'https://TU_DOMINIO/pending.php'
            ]
        ];

        $headers = [
            'Authorization: Bearer ' . $this->accessToken,
            'Content-Type: application/json'
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($preference));
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 201) {
            $data = json_decode($response, true);

            // Guardar en base de datos
            $this->savePaymentRequest($data['id'], $machineId, $amount);

            return [
                'success' => true,
                'preference_id' => $data['id'],
                'init_point' => $data['init_point'],
                'qr_code' => isset($data['qr_code']) ? $data['qr_code'] : null,
                'qr_code_base64' => isset($data['qr_code_base64']) ? $data['qr_code_base64'] : null
            ];
        } else {
            return [
                'success' => false,
                'error' => 'Error creando preferencia: ' . $response
            ];
        }
    }

    private function savePaymentRequest($preferenceId, $machineId, $amount) {
        $stmt = $this->db->prepare("
            INSERT INTO mercadopago_requests (preference_id, machine_id, amount, status, created_at) 
            VALUES (?, ?, ?, 'pending', NOW())
        ");
        $stmt->execute([$preferenceId, $machineId, $amount]);
    }

    public function getPaymentInfo($paymentId) {
        $url = "https://api.mercadopago.com/v1/payments/$paymentId";

        $headers = [
            'Authorization: Bearer ' . $this->accessToken
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $response = curl_exec($ch);
        curl_close($ch);

        return json_decode($response, true);
    }
}