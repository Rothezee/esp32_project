-- Tabla de IPs de máquinas
CREATE TABLE machine_ips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,
    ip_address VARCHAR(15) NOT NULL,
    name VARCHAR(100),
    location VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_device (device_id)
);

-- Requests de MercadoPago
CREATE TABLE mercadopago_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    preference_id VARCHAR(100) NOT NULL,
    payment_id VARCHAR(100) NULL,
    machine_id VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_machine_id (machine_id),
    INDEX idx_status (status)
);

-- Transacciones de crédito
CREATE TABLE mercadopago_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    machine_id VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('success', 'failed') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_machine_id (machine_id),
    INDEX idx_created_at (created_at)
);

-- Ejemplo de IPs
INSERT INTO machine_ips (device_id, ip_address, name, location) VALUES
('EXPENDEDORA_1', '192.168.1.100', 'Expendedora Principal', 'Planta Baja'),
('ESP32_001', '192.168.1.101', 'ESP32 Sensor 1', 'Oficina'),
('ESP32_002', '192.168.1.102', 'ESP32 Sensor 2', 'Depósito'),
('Videojuego_1', '192.168.1.103', 'Máquina Videojuego', 'Sala de Juegos');