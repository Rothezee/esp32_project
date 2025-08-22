<?php
class Config {
    // Configuración de base de datos
    const DB_HOST = 'localhost';
    const DB_NAME = 'esp32_report';
    const DB_USER = 'root';
    const DB_PASS = '39090169';
    
    // Configuración de MercadoPago
    // IMPORTANTE: Reemplaza estos tokens con los reales de tu cuenta
    const MP_ACCESS_TOKEN = 'TEST-1234567890-123456-abcdef1234567890abcdef1234567890-123456789'; // Token de prueba
    const MP_PUBLIC_KEY = 'TEST-abcdef12-3456-7890-abcd-ef1234567890'; // Clave pública de prueba
    
    // URLs del webhook y redirección
    const WEBHOOK_URL = 'https://maquinasbonus.com/esp32_project/Backend/mercadopago/webhook.php';
    const SUCCESS_URL = 'https://maquinasbonus.com/esp32_project/Backend/mercadopago/success.php';
    const FAILURE_URL = 'https://maquinasbonus.com/esp32_project/Backend/mercadopago/failure.php';
    const PENDING_URL = 'https://maquinasbonus.com/esp32_project/Backend/mercadopago/pending.php';
    
    // Configuración general
    const CURRENCY = 'ARS';
    const TIMEZONE = 'America/Argentina/Buenos_Aires';
}