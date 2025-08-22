-- Tabla de IPs de máquinas
CREATE TABLE IF NOT EXISTS machine_ips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,
    ip_address VARCHAR(15) NOT NULL,
    name VARCHAR(100),
    location VARCHAR(200),
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_device (device_id),
    INDEX idx_device_id (device_id),
    INDEX idx_ip_address (ip_address)
);

-- Requests de MercadoPago
CREATE TABLE IF NOT EXISTS mercadopago_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    preference_id VARCHAR(100) NOT NULL,
    payment_id VARCHAR(100) NULL,
    machine_id VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'cancelled', 'expired') DEFAULT 'pending',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    INDEX idx_preference_id (preference_id),
    INDEX idx_payment_id (payment_id),
    INDEX idx_machine_id (machine_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Transacciones de crédito
CREATE TABLE IF NOT EXISTS mercadopago_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    machine_id VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('success', 'failed', 'pending') NOT NULL,
    details TEXT,
    request_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_machine_id (machine_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (request_id) REFERENCES mercadopago_requests(id) ON DELETE SET NULL
);

-- Tabla de logs de webhook
CREATE TABLE IF NOT EXISTS mercadopago_webhook_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payment_id VARCHAR(100),
    event_type VARCHAR(50),
    status VARCHAR(50),
    raw_data TEXT,
    processed BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_payment_id (payment_id),
    INDEX idx_event_type (event_type),
    INDEX idx_processed (processed),
    INDEX idx_created_at (created_at)
);

-- Insertar datos de ejemplo para las máquinas
INSERT INTO machine_ips (device_id, ip_address, name, location) VALUES
('EXPENDEDORA_1', '192.168.1.100', 'Expendedora Principal', 'Planta Baja'),
('ESP32_001', '192.168.1.101', 'ESP32 Grúa 1', 'Sala Principal'),
('ESP32_002', '192.168.1.102', 'ESP32 Grúa 2', 'Sala Principal'),
('ESP32_003', '192.168.1.103', 'ESP32 Grúa 3', 'Sala Secundaria'),
('ESP32_004', '192.168.1.104', 'ESP32 Grúa 4', 'Sala Secundaria'),
('ESP32_005', '192.168.1.105', 'ESP32 Grúa 5', 'Sala VIP'),
('Videojuego_1', '192.168.1.110', 'Máquina Videojuego 1', 'Zona Arcade'),
('Videojuego_2', '192.168.1.111', 'Máquina Videojuego 2', 'Zona Arcade'),
('Ticket_1', '192.168.1.120', 'Máquina Tickets 1', 'Zona Premios'),
('Ticket_2', '192.168.1.121', 'Máquina Tickets 2', 'Zona Premios')
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    location = VALUES(location),
    updated_at = CURRENT_TIMESTAMP;