<?php
class ESP32Communication {
    private $db;
    public function __construct($db) {
        $this->db = $db;
    }
    public function sendCreditToMachine($machineId, $amount) {
        $machineIP = $this->getMachineIP($machineId);
        if (!$machineIP) {
            return ['success' => false, 'error' => 'Máquina no encontrada'];
        }
        $url = "http://$machineIP/add-credit";
        $data = [
            'amount' => floatval($amount),
            'timestamp' => time(),
            'machine_id' => $machineId
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200) {
            $this->logCreditTransaction($machineId, $amount, 'success');
            return ['success' => true, 'response' => $response];
        } else {
            $this->logCreditTransaction($machineId, $amount, 'failed');
            return ['success' => false, 'error' => 'Error comunicándose con ESP32'];
        }
    }

    private function getMachineIP($machineId) {
        $stmt = $this->db->prepare("SELECT ip_address FROM machine_ips WHERE device_id = ?");
        $stmt->execute([$machineId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ? $result['ip_address'] : null;
    }

    private function logCreditTransaction($machineId, $amount, $status) {
        $stmt = $this->db->prepare("
            INSERT INTO mercadopago_transactions (machine_id, amount, status, created_at) 
            VALUES (?, ?, ?, NOW())
        ");
        $stmt->execute([$machineId, $amount, $status]);
    }
}
