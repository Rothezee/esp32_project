-- phpMyAdmin SQL Dump
-- version 4.9.1
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost
-- Tiempo de generación: 20-01-2026 a las 01:58:25
-- Versión del servidor: 8.0.17
-- Versión de PHP: 7.3.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `esp32_report`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cierres_expendedoras`
--

CREATE TABLE `cierres_expendedoras` (
  `id_expendedora` varchar(50) NOT NULL,
  `fichas` int(11) DEFAULT NULL,
  `dinero` int(11) DEFAULT NULL,
  `p1` int(11) DEFAULT NULL,
  `p2` int(11) DEFAULT NULL,
  `p3` int(11) DEFAULT NULL,
  `fichas_devolucion` int(11) DEFAULT '0',
  `fichas_normales` int(11) DEFAULT '0',
  `fichas_promocion` int(11) DEFAULT '0',
  `timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `cierres_expendedoras`
--

INSERT INTO `cierres_expendedoras` (`id_expendedora`, `fichas`, `dinero`, `p1`, `p2`, `p3`, `fichas_devolucion`, `fichas_normales`, `fichas_promocion`) VALUES
('EXPENDEDORA_005', 15, 1500, 1, 0, 0, 2, 10, 3),
('EXPENDEDORA_1', 0, 0, 0, 0, 0, 0, 0, 0),
('EXPENDEDORA_1', 0, 0, 0, 0, 0, 0, 0, 0),
('EXPENDEDORA_1', 8, 3000, 0, 0, 0, 0, 0, 0),
('EXPENDEDORA_1', 1, 1000, 0, 0, 0, 0, 0, 0),
('EXPENDEDORA_1', 16, 20000, 1, 0, 0, 0, 0, 0),
('EXPENDEDORA_1', 29, 24000, 4, 0, 0, 0, 0, 0),
('EXPENDEDORA_5', 9, 5000, 1, 0, 0, 2, 2, 5);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `daily_closes`
--

CREATE TABLE `daily_closes` (
  `id` int(11) NOT NULL,
  `close_date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `datos`
--

CREATE TABLE `datos` (
  `id` int(11) NOT NULL,
  `device_id` varchar(50) NOT NULL,
  `dato1` int(11) DEFAULT NULL,
  `dato2` int(11) DEFAULT NULL,
  `dato3` int(11) DEFAULT NULL,
  `dato4` int(11) NOT NULL,
  `dato5` int(255) DEFAULT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `datos`
--

INSERT INTO `datos` (`id`, `device_id`, `dato1`, `dato2`, `dato3`, `dato4`, `dato5`, `timestamp`) VALUES
(3388, 'EXPENDEDORA_1', 117, 54800, 0, 0, 0, '2025-09-16 22:20:54'),
(3389, 'EXPENDEDORA_1', 1, 0, 0, 0, 0, '2025-10-17 01:10:56'),
(3390, 'EXPENDEDORA_1', 1, 0, 0, 0, 0, '2025-10-17 01:37:27'),
(3391, 'POSTMAN_TEST_1', 15, 7500, 0, 0, 0, '2025-10-17 01:40:11'),
(3392, 'EXPENDEDORA_1', 2, 0, 0, 0, 0, '2025-10-17 01:44:43'),
(3393, 'POSTMAN_TEST_1', 15, 7500, 0, 0, 0, '2025-10-17 01:45:06'),
(3394, 'POSTMAN_TEST_1', 15, 7500, 0, 0, 0, '2025-10-17 01:52:42'),
(3395, 'POSTMAN_TEST_1', 15, 7500, 0, 0, 0, '2025-10-17 01:53:18'),
(3396, 'POSTMAN_TEST_1', 15, 7500, 0, 0, 0, '2025-10-17 01:54:22'),
(3397, 'POSTMAN_TEST_1', 15, 7500, 0, 0, 0, '2025-10-17 01:56:33'),
(3398, 'POSTMAN_TEST_1', 15, 7500, 0, 0, 0, '2025-10-17 02:01:11'),
(3399, 'EXPENDEDORA_1', 3, 0, 0, 0, 0, '2025-10-17 02:02:59'),
(3400, 'EXPENDEDORA_1', 4, 0, 0, 0, 0, '2025-10-17 02:17:20'),
(3401, 'EXPENDEDORA_1', 1, 0, 0, 0, 0, '2025-10-17 02:22:20'),
(3402, 'EXPENDEDORA_1', 15, 7500, 0, 0, 0, '2025-10-17 02:23:46'),
(3403, 'EXPENDEDORA_1', 15, 7500, 0, 0, 0, '2025-10-17 02:24:13'),
(3404, 'EXPENDEDORA_1', 15, 7500, 0, 0, 0, '2025-10-17 02:24:39'),
(3405, 'EXPENDEDORA_1', 2, 0, 0, 0, 0, '2025-10-17 02:26:23'),
(3406, 'EXPENDEDORA_1', 1, 10000, 0, 0, 0, '2025-10-17 02:28:24'),
(3407, 'EXPENDEDORA_1', 6, 3000, 0, 0, 0, '2025-10-17 02:30:53'),
(3408, 'EXPENDEDORA_1', 2, 2000, 0, 0, 0, '2025-10-17 02:33:41'),
(3409, 'EXPENDEDORA_1', 1, 1000, 0, 0, 0, '2025-10-24 22:26:01'),
(3410, 'EXPENDEDORA_1', 1, 1, 0, 0, 0, '2025-10-24 22:40:13'),
(3411, 'EXPENDEDORA_1', 2, 2000, 0, 0, 0, '2025-10-31 23:05:42'),
(3412, 'EXPENDEDORA_1', 5, 3000, 0, 0, 0, '2025-10-31 23:06:01'),
(3413, 'EXPENDEDORA_1', 8, 3000, 0, 0, 0, '2025-10-31 23:11:37'),
(3414, 'ESP32_005', 12, 21, 1, 9, NULL, '2025-11-15 15:11:45'),
(3415, 'ESP32_005', 12, 23, 1, 11, NULL, '2025-11-15 15:36:26'),
(3416, 'ESP32_005', 12, 23, 1, 11, NULL, '2025-11-15 15:36:53'),
(3417, 'ESP32_005', 30, 24, 1, 12, NULL, '2025-11-15 15:59:01'),
(3418, 'ESP32_005', 30, 25, 1, 13, NULL, '2025-11-15 15:59:16'),
(3419, 'ESP32_005', 30, 29, 1, 17, NULL, '2025-11-15 17:27:53'),
(3420, 'ESP32_005', 30, 30, 1, 18, NULL, '2025-11-15 17:28:21'),
(3421, 'ESP32_005', 30, 31, 1, 19, NULL, '2025-11-15 18:20:20'),
(3422, 'EXPENDEDORA_1', 1, 0, 0, 0, 0, '2025-12-01 21:42:05'),
(3423, 'EXPENDEDORA_1', 1, 0, 0, 0, 0, '2025-12-01 21:43:47'),
(3424, 'EXPENDEDORA_1', 1, 0, 0, 0, 0, '2025-12-01 21:44:48'),
(3425, 'EXPENDEDORA_1', 6, 0, 0, 0, 0, '2025-12-01 21:48:10'),
(3426, 'EXPENDEDORA_1', 7, 0, 0, 0, 0, '2025-12-01 21:51:18'),
(3427, 'EXPENDEDORA_1', 1, 0, 0, 0, 0, '2025-12-01 22:51:19'),
(3428, 'EXPENDEDORA_1', 1, 1000, 0, 0, 0, '2025-12-01 23:09:52'),
(3429, 'EXPENDEDORA_1', 3, 3000, 0, 0, 0, '2025-12-02 15:41:56'),
(3430, 'EXPENDEDORA_1', 1, 1000, 0, 0, 0, '2025-12-02 15:44:17'),
(3431, 'EXPENDEDORA_1', 2, 2000, 0, 0, 0, '2025-12-02 21:32:39'),
(3432, 'EXPENDEDORA_1', 2, 2000, 0, 0, 0, '2025-12-02 21:42:45'),
(3433, 'EXPENDEDORA_1', 2, 2000, 0, 0, 0, '2025-12-02 22:16:13'),
(3434, 'EXPENDEDORA_1', 1, 1000, 0, 0, 0, '2025-12-10 17:41:15'),
(3435, 'EXPENDEDORA_1', 3, 4000, 0, 0, 0, '2025-12-18 14:26:16'),
(3436, 'EXPENDEDORA_1', 8, 7000, 0, 0, 0, '2025-12-18 14:26:22'),
(3437, 'EXPENDEDORA_1', 3, 6000, 0, 0, 0, '2025-12-18 14:36:37'),
(3438, 'EXPENDEDORA_1', 6, 3000, 0, 0, 0, '2025-12-18 14:36:53'),
(3439, 'EXPENDEDORA_1', 14, 9000, 0, 0, 0, '2025-12-18 14:37:05'),
(3440, 'EXPENDEDORA_1', 24, 15000, 0, 0, 0, '2025-12-18 14:37:12'),
(3441, 'EXPENDEDORA_1', 5, 3000, 0, 0, 0, '2025-12-18 14:48:16'),
(3450, 'TEST_DEVICE_01', 1000, 100, 10, 0, NULL, '2023-10-01 11:00:00'),
(3451, 'TEST_DEVICE_01', 1500, 150, 20, 0, NULL, '2023-10-01 17:00:00'),
(3452, 'TEST_DEVICE_01', 2000, 200, 30, 0, NULL, '2023-10-02 02:50:00'),
(3453, 'TEST_DEVICE_01', 2200, 220, 35, 0, NULL, '2023-10-02 12:00:00'),
(3454, 'TEST_DEVICE_01', 3000, 300, 50, 0, NULL, '2023-10-03 02:45:00'),
(3455, 'TEST_DEVICE_01', 3500, 350, 60, 0, NULL, '2023-10-03 13:00:00'),
(3456, 'TEST_DEVICE_01', 4000, 400, 70, 0, NULL, '2023-10-03 18:00:00'),
(3457, 'TEST_DEVICE_01', 5000, 500, 80, 0, NULL, '2023-10-04 02:59:00'),
(3458, 'EXPENDEDORA_1', 5, 5000, 0, 0, 0, '2026-01-17 14:49:25'),
(3459, 'EXPENDEDORA_1', 10, 10000, 0, 0, 0, '2026-01-17 14:49:42'),
(3460, 'EXPENDEDORA_5', 1, 6000, 0, 0, 0, '2026-01-17 15:14:05'),
(3461, 'EXPENDEDORA_5', 2, 10000, 0, 0, 0, '2026-01-19 01:08:12'),
(3462, 'EXPENDEDORA_5', 4, 10000, 0, 0, 0, '2026-01-19 01:08:30'),
(3463, 'EXPENDEDORA_5', 5, 3000, 0, 0, 0, '2026-01-19 01:39:58'),
(3464, 'EXPENDEDORA_5', 7, 3000, 0, 0, 0, '2026-01-19 01:40:17'),
(3465, 'EXPENDEDORA_5', 12, 3000, 0, 0, 0, '2026-01-19 01:40:57'),
(3466, 'EXPENDEDORA_5', 13, 3000, 0, 0, 0, '2026-01-19 01:41:10'),
(3467, 'EXPENDEDORA_5', 2, 0, 0, 0, 0, '2026-01-19 01:44:47'),
(3468, 'EXPENDEDORA_5', 1, 1000, 0, 0, 0, '2026-01-19 01:57:46'),
(3469, '', 4, 2, 0, 0, 0, '2026-01-19 15:38:46'),
(3470, 'EXPENDEDORA_5', 5, 3000, 0, 0, 0, '2026-01-19 16:08:04'),
(3471, 'EXPENDEDORA_5', 7, 3000, 0, 0, 0, '2026-01-19 16:08:12'),
(3472, 'EXPENDEDORA_5', 9, 5000, 0, 0, 0, '2026-01-19 16:08:19');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `devices`
--

CREATE TABLE `devices` (
  `device_id` varchar(50) NOT NULL,
  `last_heartbeat` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `devices`
--

INSERT INTO `devices` (`device_id`) VALUES
(''),
('ESP32_001'),
('ESP32_002'),
('ESP32_005'),
('EXPENDEDORA_005'),
('EXPENDEDORA_1'),
('EXPENDEDORA_5'),
('POSTMAN_TEST_1'),
('Videojuego_1');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `employees`
--

CREATE TABLE `employees` (
  `nombre` varchar(255) NOT NULL,
  `contrasena` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `employees`
--

INSERT INTO `employees` (`nombre`, `contrasena`) VALUES
('admin', 'admin'),
('usuario', 'usuario');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `machine_ips`
--

CREATE TABLE `machine_ips` (
  `id` int(11) NOT NULL,
  `device_id` varchar(50) NOT NULL,
  `ip_address` varchar(15) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `machine_ips`
--

INSERT INTO `machine_ips` (`id`, `device_id`, `ip_address`) VALUES
(2, 'ESP32_001', '192.168.1.38'),
(11, 'ESP32_002', '192.168.1.39');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mercadopago_requests`
--

CREATE TABLE `mercadopago_requests` (
  `id` int(11) NOT NULL,
  `preference_id` varchar(100) NOT NULL,
  `payment_id` varchar(100) DEFAULT NULL,
  `machine_id` varchar(50) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `mercadopago_requests`
--

INSERT INTO `mercadopago_requests` (`id`, `preference_id`, `payment_id`, `machine_id`, `amount`, `status`, `created_at`) VALUES
(1, '1106405809-68238db4-09e5-4974-aff4-8d43c5037ebd', NULL, 'ESP32_001', '1000.00', 'pending', '2025-07-24 22:24:19'),
(2, '1106405809-85fb74f1-2865-413d-bd02-3e016dd45270', NULL, 'ESP32_001', '1000.00', 'pending', '2025-07-24 22:28:10'),
(3, '1106405809-5f4dbc8f-d084-4e24-9aa1-86fdcceb458a', NULL, 'ESP32_001', '1000.00', 'pending', '2025-08-08 14:17:11'),
(4, '1106405809-6991e91d-bc3b-4068-94f0-b6f228acde3d', 'SIMULATED-1755632020', 'TEST-001', '100.00', 'approved', '2025-08-19 19:31:01'),
(5, '1106405809-360ab80b-ac87-4125-bbdb-32bc9643ab5d', NULL, 'DEBUG-001', '100.00', 'pending', '2025-08-19 22:32:18'),
(6, '1106405809-d33b929f-c07c-416a-aa88-19003a5ecbcb', NULL, 'SANDBOX-TEST', '50.00', 'pending', '2025-08-19 22:33:01');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mercadopago_transactions`
--

CREATE TABLE `mercadopago_transactions` (
  `id` int(11) NOT NULL,
  `machine_id` varchar(50) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('success','failed') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `subcierres_expendedoras`
--

CREATE TABLE `subcierres_expendedoras` (
  `id` int(11) NOT NULL,
  `cierre_expendedora_id` varchar(50) NOT NULL,
  `partial_fichas` int(11) DEFAULT NULL,
  `partial_dinero` int(11) DEFAULT NULL,
  `partial_p1` int(11) DEFAULT NULL,
  `partial_p2` int(11) DEFAULT NULL,
  `partial_p3` int(11) DEFAULT NULL,
  `partial_devolucion` int(11) DEFAULT '0',
  `partial_normales` int(11) DEFAULT '0',
  `partial_promocion` int(11) DEFAULT '0',
  `employee_id` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `subcierres_expendedoras`
--

INSERT INTO `subcierres_expendedoras` (`id`, `cierre_expendedora_id`, `partial_fichas`, `partial_dinero`, `partial_p1`, `partial_p2`, `partial_p3`, `partial_devolucion`, `partial_normales`, `partial_promocion`, `employee_id`, `created_at`) VALUES
(33, 'EXPENDEDORA_1', 0, 0, 0, 0, 0, 0, 0, 0, 'admin', '2025-10-24 22:42:44'),
(34, 'EXPENDEDORA_1', 2, 2000, 0, 0, 0, 0, 0, 0, 'admin', '2025-10-31 23:05:46'),
(35, 'EXPENDEDORA_1', 5, 3000, 0, 0, 0, 0, 0, 0, 'admin', '2025-10-31 23:06:11'),
(36, 'EXPENDEDORA_1', 0, 0, 0, 0, 0, 0, 0, 0, 'admin', '2025-10-31 23:08:14'),
(37, 'EXPENDEDORA_1', 0, 0, 0, 0, 0, 0, 0, 0, 'admin', '2025-11-29 23:57:01'),
(38, 'EXPENDEDORA_1', 0, 0, 0, 0, 0, 0, 0, 0, 'admin', '2025-11-30 00:20:55'),
(39, 'EXPENDEDORA_1', 1, 1000, 0, 0, 0, 0, 0, 0, 'admin', '2025-12-01 23:10:52'),
(40, 'EXPENDEDORA_1', 0, 0, 0, 0, 0, 0, 0, 0, 'admin', '2025-12-01 23:17:39'),
(41, 'EXPENDEDORA_1', 0, 1000, 0, 0, 0, 0, 0, 0, 'admin', '2025-12-02 15:38:39'),
(42, 'EXPENDEDORA_1', 3, 3000, 0, 0, 0, 0, 0, 0, 'admin', '2025-12-02 15:41:59'),
(43, 'EXPENDEDORA_1', 1, 1000, 0, 0, 0, 0, 0, 0, 'admin', '2025-12-02 15:44:24'),
(44, 'EXPENDEDORA_1', 2, 4000, 0, 0, 0, 0, 0, 0, 'admin', '2025-12-02 21:42:48'),
(45, 'EXPENDEDORA_1', 2, 2000, 0, 0, 0, 0, 0, 0, 'admin', '2025-12-02 22:16:15'),
(46, 'EXPENDEDORA_1', 0, 2000, 0, 0, 0, 0, 0, 0, 'admin', '2025-12-02 22:17:25'),
(47, 'EXPENDEDORA_1', 0, 0, 0, 0, 0, 0, 0, 0, 'admin', '2025-12-18 14:26:32'),
(48, 'EXPENDEDORA_1', 3, 6000, 0, 0, 0, 0, 0, 0, 'admin', '2025-12-18 14:36:39'),
(49, 'EXPENDEDORA_1', 21, 15000, 3, 0, 0, 0, 0, 0, 'admin', '2025-12-18 14:37:35'),
(50, 'EXPENDEDORA_1', 5, 3000, 1, 0, 0, 0, 0, 0, 'admin', '2025-12-18 14:48:24'),
(51, 'EXPENDEDORA_1', 5, 10000, 0, 0, 0, 0, 0, 0, 'usuario', '2026-01-17 14:57:59'),
(58, 'EXPENDEDORA_005', 15, 1500, 1, 0, 0, 2, 10, 3, 'admin', '2026-01-19 02:51:56'),
(61, 'EXPENDEDORA_5', 9, 5000, 1, 0, 0, 2, 2, 5, 'admin', '2026-01-19 16:08:35');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `cierres_expendedoras`
--
ALTER TABLE `cierres_expendedoras`
  ADD PRIMARY KEY (`id_expendedora`,`timestamp`);

--
-- Indices de la tabla `daily_closes`
--
ALTER TABLE `daily_closes`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `datos`
--
ALTER TABLE `datos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `devices`
--
ALTER TABLE `devices`
  ADD PRIMARY KEY (`device_id`);

--
-- Indices de la tabla `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`nombre`);

--
-- Indices de la tabla `machine_ips`
--
ALTER TABLE `machine_ips`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_device` (`device_id`);

--
-- Indices de la tabla `mercadopago_requests`
--
ALTER TABLE `mercadopago_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_machine_id` (`machine_id`),
  ADD KEY `idx_status` (`status`);

--
-- Indices de la tabla `mercadopago_transactions`
--
ALTER TABLE `mercadopago_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_machine_id` (`machine_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indices de la tabla `subcierres_expendedoras`
--
ALTER TABLE `subcierres_expendedoras`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cierre_expendedora_id` (`cierre_expendedora_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `daily_closes`
--
ALTER TABLE `daily_closes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `datos`
--
ALTER TABLE `datos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3473;

--
-- AUTO_INCREMENT de la tabla `machine_ips`
--
ALTER TABLE `machine_ips`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT de la tabla `mercadopago_requests`
--
ALTER TABLE `mercadopago_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `mercadopago_transactions`
--
ALTER TABLE `mercadopago_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `subcierres_expendedoras`
--
ALTER TABLE `subcierres_expendedoras`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=62;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `subcierres_expendedoras`
--
ALTER TABLE `subcierres_expendedoras`
  ADD CONSTRAINT `subcierres_expendedoras_ibfk_1` FOREIGN KEY (`cierre_expendedora_id`) REFERENCES `cierres_expendedoras` (`id_expendedora`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
