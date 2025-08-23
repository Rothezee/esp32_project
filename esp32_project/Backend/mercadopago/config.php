<?php
class Config {
    // ============================================
    // CONFIGURACIÓN DE BASE DE DATOS
    // ============================================
    const DB_HOST = '185.173.111.133'; 
    const DB_NAME = 'u868087036_esp32_report';
    const DB_USER = 'u868087036_root';
    const DB_PASS = '39090169aA.';
    
    // Configuración de MercadoPago
    // IMPORTANTE: Reemplaza estos tokens con los reales de tu cuenta
    // Para pruebas usa TEST tokens, para producción usa PROD tokens
    const MP_ACCESS_TOKEN = 'APP_USR-3894290681951423-081608-4c7b7533a977728fa00f20e780b8e5b0-2626445920';
    const MP_PUBLIC_KEY = 'APP_USR-6c744452-3a32-4587-8f60-05c655422f60';
    const WEBHOOK_SECRET = 'a7a58bea378dba60a9348044ab3c1a582dff659790bd9235e73259d10582341c';
    
    // URLs del webhook y redirección
    const WEBHOOK_URL = 'https://maquinasbonus.com/esp32_project/mercadopago/webhook.php';
    const SUCCESS_URL = 'https://maquinasbonus.com/esp32_project/mercadopago/success.php';
    const FAILURE_URL = 'https://maquinasbonus.com/esp32_project/mercadopago/failure.php';
    const PENDING_URL = 'https://maquinasbonus.com/esp32_project/mercadopago/pending.php';
    
    // Configuración general
    const CURRENCY = 'ARS';
    const TIMEZONE = 'America/Argentina/Buenos_Aires';
    
    // Configuración de ambiente
    const IS_PRODUCTION = false; // Cambiar a true en producción
    
    // Montos mínimos y máximos
    const MIN_AMOUNT = 1.00;
    const MAX_AMOUNT = 10000.00;
}
