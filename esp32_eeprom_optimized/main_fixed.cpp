/*
ESP32 Grúa Controller - Versión EEPROM Optimizada 2025 - LCD Estabilizado
Características principales:
- Uso de EEPROM en lugar de Preferences para mayor estabilidad
- LCD con control de actualización inteligente (evita reinicio constante)
- Arquitectura modular y mantenible
- Manejo robusto de WiFi con reconexión automática
- Sistema de heartbeat confiable
- Gestión eficiente de memoria y energía
- Manejo de errores mejorado
- Watchdog timer para prevenir cuelgues
- Escrituras inteligentes a EEPROM (solo cuando hay cambios)
- Código más legible y documentado
- Compatible con ESP32 Arduino Core v2.x y v3.x
*/

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <EEPROM.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// Incluir watchdog solo si está disponible
#if defined(ESP_ARDUINO_VERSION_MAJOR) && ESP_ARDUINO_VERSION_MAJOR >= 2
  #include <esp_task_wdt.h>
  #define WATCHDOG_AVAILABLE
#endif

// ==================== CONFIGURACIÓN ====================
struct Config {
    // Identificación del dispositivo
    static constexpr const char* DEVICE_ID = "ESP32_005";
    
    // Configuración WiFi
    static constexpr const char* WIFI_SSID = "MOVISTAR-WIFI6-0160";
    static constexpr const char* WIFI_PASSWORD = "46332714";
    
    // URLs del servidor
    static constexpr const char* SERVER_DATA_URL = "https://maquinasbonus.com/esp32_project/insert_data.php";
    static constexpr const char* SERVER_HEARTBEAT_URL = "https://maquinasbonus.com/esp32_project/insert_heartbeat.php";
    
    // Configuración de pines
    static constexpr int PIN_TRIGGER = 13;
    static constexpr int PIN_ECHO = 12;
    static constexpr int PIN_DATO11 = 19;
    static constexpr int PIN_DATO7 = 14;
    static constexpr int PIN_DATO3 = 4;
    static constexpr int PIN_DATO5 = 25;
    static constexpr int PIN_EPINZA = 17;
    static constexpr int PIN_SPINZA = 16;
    static constexpr int PIN_DATO6 = 34;
    static constexpr int PIN_DATO10 = 35;
    static constexpr int PIN_DATO12 = 27;
    static constexpr int PIN_ECOIN = 26;
    
    // Configuración LCD
    static constexpr int LCD_ADDRESS = 0x27;
    static constexpr int LCD_COLUMNS = 16;
    static constexpr int LCD_ROWS = 2;
    
    // Intervalos de tiempo (ms)
    static constexpr unsigned long HEARTBEAT_INTERVAL = 60000;  // 1 minuto
    static constexpr unsigned long DATA_SEND_INTERVAL = 30000;  // 30 segundos
    static constexpr unsigned long WIFI_RECONNECT_INTERVAL = 30000;  // 30 segundos
    static constexpr unsigned long WATCHDOG_TIMEOUT = 30;  // 30 segundos
    static constexpr unsigned long EEPROM_SAVE_INTERVAL = 10000;  // 10 segundos
    static constexpr unsigned long LCD_UPDATE_INTERVAL = 1000;  // 1 segundo para LCD
    
    // Configuración de la máquina
    static constexpr int BARRERA_THRESHOLD = 130;
    static constexpr int COIN_DEBOUNCE_COUNT = 5;
    static constexpr int PROGRAMMING_HOLD_TIME = 30;
    static constexpr int GAME_TIMEOUT_CYCLES = 18000;
    static constexpr int BARRIER_CHECK_CYCLES = 200;
    
    // Tamaño de EEPROM
    static constexpr int EEPROM_SIZE = 512;
};

// ==================== DIRECCIONES EEPROM ====================
struct EEPROMAddresses {
    static constexpr int INIT_FLAG = 0;        // 4 bytes
    static constexpr int COIN = 4;             // 4 bytes
    static constexpr int CONTSALIDA = 8;       // 4 bytes
    static constexpr int BANK = 12;            // 4 bytes
    static constexpr int PAGO = 16;            // 4 bytes
    static constexpr int TIEMPO = 20;          // 4 bytes
    static constexpr int FUERZA = 24;          // 4 bytes
    static constexpr int PJFIJO = 28;          // 4 bytes
    static constexpr int PPFIJO = 32;          // 4 bytes
    static constexpr int BARRERAAUX2 = 36;     // 4 bytes
    static constexpr int GRUADISPLAY = 40;     // 4 bytes
    static constexpr int TIEMPO5 = 44;         // 4 bytes
    static constexpr int CHECKSUM = 48;        // 4 bytes
};

// ==================== FUNCIONES DE WATCHDOG ====================
void initWatchdog() {
#ifdef WATCHDOG_AVAILABLE
    #if ESP_ARDUINO_VERSION >= ESP_ARDUINO_VERSION_VAL(3, 0, 0)
        // ESP32 Arduino Core 3.x
        esp_task_wdt_config_t wdt_config = {
            .timeout_ms = Config::WATCHDOG_TIMEOUT * 1000,
            .idle_core_mask = (1 << portNUM_PROCESSORS) - 1,
            .trigger_panic = true
        };
        esp_task_wdt_init(&wdt_config);
    #else
        // ESP32 Arduino Core 2.x
        esp_task_wdt_init(Config::WATCHDOG_TIMEOUT, true);
    #endif
    esp_task_wdt_add(NULL);
    Serial.println("Watchdog inicializado");
#else
    Serial.println("Watchdog no disponible en esta versión");
#endif
}

void resetWatchdog() {
#ifdef WATCHDOG_AVAILABLE
    esp_task_wdt_reset();
#endif
}

// ==================== CLASES Y ESTRUCTURAS ====================

class EEPROMManager {
private:
    static constexpr uint32_t INIT_VALUE = 0x12345678;  // Valor mágico para verificar inicialización
    
    uint32_t calculateChecksum() {
        uint32_t checksum = 0;
        for (int addr = EEPROMAddresses::COIN; addr < EEPROMAddresses::CHECKSUM; addr += 4) {
            uint32_t value;
            EEPROM.get(addr, value);
            checksum ^= value;
        }
        return checksum;
    }
    
    bool verifyChecksum() {
        uint32_t storedChecksum;
        EEPROM.get(EEPROMAddresses::CHECKSUM, storedChecksum);
        return storedChecksum == calculateChecksum();
    }
    
    void updateChecksum() {
        uint32_t checksum = calculateChecksum();
        EEPROM.put(EEPROMAddresses::CHECKSUM, checksum);
    }

public:
    bool initialize() {
        if (!EEPROM.begin(Config::EEPROM_SIZE)) {
            Serial.println("Error: No se pudo inicializar EEPROM");
            return false;
        }
        
        uint32_t initFlag;
        EEPROM.get(EEPROMAddresses::INIT_FLAG, initFlag);
        
        if (initFlag != INIT_VALUE || !verifyChecksum()) {
            Serial.println("Inicializando EEPROM con valores por defecto...");
            setDefaults();
            return true;
        }
        
        Serial.println("EEPROM inicializada correctamente");
        return true;
    }
    
    void setDefaults() {
        EEPROM.put(EEPROMAddresses::INIT_FLAG, INIT_VALUE);
        EEPROM.put(EEPROMAddresses::COIN, (uint32_t)0);
        EEPROM.put(EEPROMAddresses::CONTSALIDA, (uint32_t)0);
        EEPROM.put(EEPROMAddresses::BANK, (int32_t)0);
        EEPROM.put(EEPROMAddresses::PAGO, (int32_t)12);
        EEPROM.put(EEPROMAddresses::TIEMPO, (int32_t)2000);
        EEPROM.put(EEPROMAddresses::FUERZA, (int32_t)50);
        EEPROM.put(EEPROMAddresses::PJFIJO, (uint32_t)0);
        EEPROM.put(EEPROMAddresses::PPFIJO, (uint32_t)0);
        EEPROM.put(EEPROMAddresses::BARRERAAUX2, (int32_t)0);
        EEPROM.put(EEPROMAddresses::GRUADISPLAY, (int32_t)0);
        EEPROM.put(EEPROMAddresses::TIEMPO5, (int32_t)0);
        updateChecksum();
        EEPROM.commit();
    }
    
    template<typename T>
    T read(int address) {
        T value;
        EEPROM.get(address, value);
        return value;
    }
    
    template<typename T>
    void write(int address, T value) {
        EEPROM.put(address, value);
    }
    
    void commit() {
        updateChecksum();
        EEPROM.commit();
    }
    
    void resetCounters() {
        EEPROM.put(EEPROMAddresses::COIN, (uint32_t)0);
        EEPROM.put(EEPROMAddresses::CONTSALIDA, (uint32_t)0);
        EEPROM.put(EEPROMAddresses::BANK, (int32_t)0);
        EEPROM.put(EEPROMAddresses::PJFIJO, (uint32_t)0);
        EEPROM.put(EEPROMAddresses::PPFIJO, (uint32_t)0);
        commit();
    }
};

class WiFiManager {
private:
    unsigned long lastReconnectAttempt = 0;
    int reconnectAttempts = 0;
    static constexpr int MAX_RECONNECT_ATTEMPTS = 5;

public:
    bool connect() {
        WiFi.disconnect(true);
        delay(1000);
        
        Serial.println("Conectando a WiFi...");
        WiFi.begin(Config::WIFI_SSID, Config::WIFI_PASSWORD);
        
        int attempts = 0;
        while (WiFi.status() != WL_CONNECTED && attempts < 20) {
            delay(1000);
            Serial.print(".");
            attempts++;
            resetWatchdog(); // Reset watchdog
        }
        
        if (WiFi.status() == WL_CONNECTED) {
            Serial.println("\nWiFi conectado");
            Serial.print("IP: ");
            Serial.println(WiFi.localIP());
            reconnectAttempts = 0;
            return true;
        } else {
            Serial.println("\nError: No se pudo conectar a WiFi");
            return false;
        }
    }
    
    bool isConnected() {
        return WiFi.status() == WL_CONNECTED;
    }
    
    void handleReconnection() {
        if (!isConnected() && 
            (millis() - lastReconnectAttempt > Config::WIFI_RECONNECT_INTERVAL) &&
            reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            
            lastReconnectAttempt = millis();
            reconnectAttempts++;
            Serial.printf("Intento de reconexión WiFi #%d\n", reconnectAttempts);
            connect();
        }
    }
};

class HTTPManager {
private:
    HTTPClient http;
    
public:
    bool sendData(const String& url, const JsonDocument& data) {
        if (WiFi.status() != WL_CONNECTED) {
            Serial.println("WiFi desconectado - no se pueden enviar datos");
            return false;
        }
        
        http.begin(url);
        http.addHeader("Content-Type", "application/json");
        http.setTimeout(10000); // 10 segundos timeout
        
        String payload;
        serializeJson(data, payload);
        
        int httpResponseCode = http.POST(payload);
        bool success = (httpResponseCode > 0 && httpResponseCode < 400);
        
        if (success) {
            Serial.printf("Datos enviados exitosamente. Código: %d\n", httpResponseCode);
        } else {
            Serial.printf("Error enviando datos. Código: %d\n", httpResponseCode);
        }
        
        http.end();
        return success;
    }
    
    bool sendHeartbeat() {
        JsonDocument doc;
        doc["device_id"] = Config::DEVICE_ID;
        return sendData(Config::SERVER_HEARTBEAT_URL, doc);
    }
    
    bool sendMachineData(int pesos, int coin, int premios, int banco) {
        JsonDocument doc;
        doc["device_id"] = Config::DEVICE_ID;
        doc["dato1"] = pesos;
        doc["dato2"] = coin;
        doc["dato3"] = premios;
        doc["dato4"] = banco;
        return sendData(Config::SERVER_DATA_URL, doc);
    }
};

class MachineData {
public:
    struct Counters {
        unsigned int coin = 0;
        unsigned int contsalida = 0;
        int bank = 0;
        int pago = 12;
        unsigned int pjfijo = 0;
        unsigned int ppfijo = 0;
    };
    
    struct Settings {
        int tiempo = 2000;
        int fuerza = 50;
        int tiempo5 = 0;
        int barreraaux2 = 0;
        int gruadisplay = 0;
    };
    
    Counters counters;
    Settings settings;
    
private:
    EEPROMManager* eepromManager;
    unsigned long lastSaveTime = 0;
    bool hasUnsavedChanges = false;
    
    // Variables para detectar cambios
    Counters lastSavedCounters;
    Settings lastSavedSettings;
    
public:
    bool initialize(EEPROMManager* eeprom) {
        eepromManager = eeprom;
        loadFromEEPROM();
        
        // Guardar estado inicial
        lastSavedCounters = counters;
        lastSavedSettings = settings;
        
        return true;
    }
    
    void loadFromEEPROM() {
        counters.coin = eepromManager->read<uint32_t>(EEPROMAddresses::COIN);
        counters.contsalida = eepromManager->read<uint32_t>(EEPROMAddresses::CONTSALIDA);
        counters.bank = eepromManager->read<int32_t>(EEPROMAddresses::BANK);
        counters.pago = eepromManager->read<int32_t>(EEPROMAddresses::PAGO);
        counters.pjfijo = eepromManager->read<uint32_t>(EEPROMAddresses::PJFIJO);
        counters.ppfijo = eepromManager->read<uint32_t>(EEPROMAddresses::PPFIJO);
        
        settings.tiempo = eepromManager->read<int32_t>(EEPROMAddresses::TIEMPO);
        settings.fuerza = eepromManager->read<int32_t>(EEPROMAddresses::FUERZA);
        settings.tiempo5 = eepromManager->read<int32_t>(EEPROMAddresses::TIEMPO5);
        settings.barreraaux2 = eepromManager->read<int32_t>(EEPROMAddresses::BARRERAAUX2);
        settings.gruadisplay = eepromManager->read<int32_t>(EEPROMAddresses::GRUADISPLAY);
    }
    
    bool hasChanges() {
        return (memcmp(&counters, &lastSavedCounters, sizeof(Counters)) != 0) ||
               (memcmp(&settings, &lastSavedSettings, sizeof(Settings)) != 0);
    }
    
    void markForSave() {
        hasUnsavedChanges = true;
    }
    
    void saveIfNeeded() {
        unsigned long currentTime = millis();
        
        // Guardar si hay cambios y ha pasado el tiempo mínimo
        if (hasUnsavedChanges && 
            (currentTime - lastSaveTime > Config::EEPROM_SAVE_INTERVAL)) {
            
            saveToEEPROM();
            hasUnsavedChanges = false;
            lastSaveTime = currentTime;
        }
    }
    
    void saveToEEPROM() {
        eepromManager->write(EEPROMAddresses::COIN, (uint32_t)counters.coin);
        eepromManager->write(EEPROMAddresses::CONTSALIDA, (uint32_t)counters.contsalida);
        eepromManager->write(EEPROMAddresses::BANK, (int32_t)counters.bank);
        eepromManager->write(EEPROMAddresses::PAGO, (int32_t)counters.pago);
        eepromManager->write(EEPROMAddresses::PJFIJO, (uint32_t)counters.pjfijo);
        eepromManager->write(EEPROMAddresses::PPFIJO, (uint32_t)counters.ppfijo);
        
        eepromManager->write(EEPROMAddresses::TIEMPO, (int32_t)settings.tiempo);
        eepromManager->write(EEPROMAddresses::FUERZA, (int32_t)settings.fuerza);
        eepromManager->write(EEPROMAddresses::TIEMPO5, (int32_t)settings.tiempo5);
        eepromManager->write(EEPROMAddresses::BARRERAAUX2, (int32_t)settings.barreraaux2);
        eepromManager->write(EEPROMAddresses::GRUADISPLAY, (int32_t)settings.gruadisplay);
        
        eepromManager->commit();
        
        // Actualizar estado guardado
        lastSavedCounters = counters;
        lastSavedSettings = settings;
        
        Serial.println("Datos guardados en EEPROM");
    }
    
    void forceSave() {
        saveToEEPROM();
        hasUnsavedChanges = false;
        lastSaveTime = millis();
    }
    
    void resetCounters() {
        counters.coin = 0;
        counters.contsalida = 0;
        counters.bank = 0;
        counters.pjfijo = 0;
        counters.ppfijo = 0;
        eepromManager->resetCounters();
        lastSavedCounters = counters;
    }
};

class DisplayManager {
private:
    LiquidCrystal_I2C lcd;
    unsigned long lastUpdateTime = 0;
    bool needsUpdate = true;
    bool isInitialized = false;
    
    // Variables para detectar cambios en el display
    struct DisplayState {
        int coin = -1;
        int contsalida = -1;
        int pago = -1;
        int bankTiempo = -1;
        int bank = -1;
        int credito = -1;
        int displayMode = -1;
    } lastDisplayState;
    
public:
    DisplayManager() : lcd(Config::LCD_ADDRESS, Config::LCD_COLUMNS, Config::LCD_ROWS) {}
    
    bool initialize() {
        // Inicializar I2C con velocidad más baja para mayor estabilidad
        Wire.begin();
        Wire.setClock(100000); // 100kHz en lugar de 400kHz por defecto
        
        delay(100); // Dar tiempo al LCD para inicializar
        
        lcd.init();
        delay(50);
        lcd.backlight();
        delay(50);
        
        // Limpiar pantalla inicial
        lcd.clear();
        delay(100);
        
        isInitialized = true;
        Serial.println("LCD inicializado correctamente");
        return true;
    }
    
    void showCounters(const MachineData::Counters& counters, int bankTiempo) {
        if (!isInitialized) return;
        
        // Solo actualizar si hay cambios o ha pasado suficiente tiempo
        unsigned long currentTime = millis();
        bool hasChanges = (
            lastDisplayState.coin != (int)counters.coin ||
            lastDisplayState.contsalida != (int)counters.contsalida ||
            lastDisplayState.pago != counters.pago ||
            lastDisplayState.bankTiempo != bankTiempo ||
            lastDisplayState.bank != counters.bank ||
            lastDisplayState.displayMode != 0
        );
        
        if (!hasChanges && (currentTime - lastUpdateTime < Config::LCD_UPDATE_INTERVAL)) {
            return; // No actualizar si no hay cambios y no ha pasado suficiente tiempo
        }
        
        // Actualizar solo si es necesario
        if (hasChanges || needsUpdate) {
            lcd.clear();
            delay(10); // Pequeña pausa después de clear
            
            lcd.setCursor(0, 0);
            lcd.print("PJ:");
            lcd.setCursor(3, 0);
            lcd.print(counters.coin);
            lcd.setCursor(9, 0);
            lcd.print("PP:");
            lcd.setCursor(12, 0);
            lcd.print(counters.contsalida);
            
            lcd.setCursor(0, 1);
            lcd.print("PA:");
            lcd.setCursor(3, 1);
            lcd.print(counters.pago);
            lcd.setCursor(7, 1);
            lcd.print(bankTiempo);
            lcd.setCursor(9, 1);
            lcd.print("BK:");
            lcd.setCursor(12, 1);
            lcd.print(counters.bank);
            
            // Actualizar estado guardado
            lastDisplayState.coin = counters.coin;
            lastDisplayState.contsalida = counters.contsalida;
            lastDisplayState.pago = counters.pago;
            lastDisplayState.bankTiempo = bankTiempo;
            lastDisplayState.bank = counters.bank;
            lastDisplayState.displayMode = 0;
            
            lastUpdateTime = currentTime;
            needsUpdate = false;
        }
    }
    
    void showCredit(int credito) {
        if (!isInitialized) return;
        
        // Solo actualizar si hay cambios
        unsigned long currentTime = millis();
        bool hasChanges = (
            lastDisplayState.credito != credito ||
            lastDisplayState.displayMode != 1
        );
        
        if (!hasChanges && (currentTime - lastUpdateTime < Config::LCD_UPDATE_INTERVAL)) {
            return;
        }
        
        if (hasChanges || needsUpdate) {
            lcd.clear();
            delay(10);
            
            lcd.setCursor(0, 0);
            lcd.print("Credito");
            lcd.setCursor(8, 0);
            lcd.print(credito);
            
            lastDisplayState.credito = credito;
            lastDisplayState.displayMode = 1;
            
            lastUpdateTime = currentTime;
            needsUpdate = false;
        }
    }
    
    void showBarrier() {
        if (!isInitialized) return;
        
        lcd.setCursor(0, 1);
        lcd.print("###");
        needsUpdate = true; // Forzar actualización en la próxima llamada
    }
    
    void showMessage(const String& line1, const String& line2 = "") {
        if (!isInitialized) return;
        
        lcd.clear();
        delay(10);
        
        lcd.setCursor(0, 0);
        lcd.print(line1);
        if (line2.length() > 0) {
            lcd.setCursor(0, 1);
            lcd.print(line2);
        }
        
        needsUpdate = true; // Forzar actualización después de mostrar mensaje
    }
    
    void forceUpdate() {
        needsUpdate = true;
        lastUpdateTime = 0; // Forzar actualización inmediata
    }
};

class SensorManager {
private:
    int referenceDistance = 0;
    
public:
    bool initialize() {
        // Calibrar sensor ultrasónico
        int measurements = 0;
        long totalDistance = 0;
        
        for (int i = 0; i < 10; i++) {
            int distance = readUltrasonicDistance();
            if (distance > 0 && distance < 4000) { // Filtrar lecturas inválidas
                totalDistance += distance;
                measurements++;
            }
            delay(50);
        }
        
        if (measurements > 0) {
            referenceDistance = totalDistance / measurements;
            Serial.printf("Distancia de referencia calibrada: %d\n", referenceDistance);
            return true;
        } else {
            Serial.println("Error: No se pudo calibrar el sensor ultrasónico");
            return false;
        }
    }
    
    int readUltrasonicDistance() {
        digitalWrite(Config::PIN_TRIGGER, LOW);
        delayMicroseconds(2);
        digitalWrite(Config::PIN_TRIGGER, HIGH);
        delayMicroseconds(10);
        digitalWrite(Config::PIN_TRIGGER, LOW);
        
        long duration = pulseIn(Config::PIN_ECHO, HIGH, 30000); // Timeout de 30ms
        if (duration == 0) return -1; // Timeout
        
        return duration / 10; // Conversión a distancia
    }
    
    bool isBarrierTriggered() {
        int currentDistance = readUltrasonicDistance();
        if (currentDistance < 0) return false; // Error de lectura
        
        return abs(currentDistance - referenceDistance) > Config::BARRERA_THRESHOLD;
    }
    
    bool isInfraredBarrierTriggered() {
        return digitalRead(Config::PIN_DATO7) == HIGH;
    }
    
    int getReferenceDistance() const {
        return referenceDistance;
    }
};

class CoinManager {
private:
    int auxCoin = 0;
    bool aux2Coin = false;
    
public:
    bool checkCoin() {
        bool coinDetected = false;
        
        // Debounce del sensor de monedas
        while (digitalRead(Config::PIN_ECOIN) == LOW && auxCoin < Config::COIN_DEBOUNCE_COUNT) {
            auxCoin++;
            delay(1);
            if (digitalRead(Config::PIN_ECOIN) == HIGH) auxCoin = 0;
        }
        
        if (auxCoin == Config::COIN_DEBOUNCE_COUNT && !aux2Coin) {
            coinDetected = true;
            aux2Coin = true;
        }
        
        while (digitalRead(Config::PIN_ECOIN) == HIGH && auxCoin > 0) {
            auxCoin--;
            delay(2);
            if (digitalRead(Config::PIN_ECOIN) == LOW) auxCoin = Config::COIN_DEBOUNCE_COUNT;
        }
        
        if (auxCoin == 0 && aux2Coin) aux2Coin = false;
        
        return coinDetected;
    }
};

// ==================== VARIABLES GLOBALES ====================
EEPROMManager eepromManager;
WiFiManager wifiManager;
HTTPManager httpManager;
MachineData machineData;
DisplayManager displayManager;
SensorManager sensorManager;
CoinManager coinManager;

// Variables de estado del juego
struct GameState {
    int credito = 0;
    unsigned int bankTiempo = 0;
    unsigned int cTiempo = 0;
    unsigned long tiempo7 = 0;
    unsigned long tiempo8 = 0;
    bool barrera = false;
    bool barreraAux = false;
    int auxDato3 = 0;
    unsigned long X = 0;
    
    // Variables para envío de datos
    struct {
        int prevPJFIJO = 0;
        int prevBANK = 0;
        int prevPPFIJO = 0;
        int prevPAGO = 0;
    } previous;
} gameState;

// Timers
unsigned long lastHeartbeat = 0;
unsigned long lastDataSend = 0;
unsigned long lastWiFiCheck = 0;
unsigned long lastDisplayUpdate = 0;

// ==================== FUNCIONES PRINCIPALES ====================

void setup() {
    Serial.begin(115200);
    Serial.println("=== ESP32 Grúa Controller v2.0 EEPROM - LCD Estabilizado ===");
    
    // Configurar watchdog
    initWatchdog();
    
    // Inicializar EEPROM
    if (!eepromManager.initialize()) {
        Serial.println("Error crítico en inicialización de EEPROM");
        ESP.restart();
    }
    
    // Inicializar componentes
    if (!initializeHardware()) {
        Serial.println("Error crítico en inicialización de hardware");
        ESP.restart();
    }
    
    if (!machineData.initialize(&eepromManager)) {
        Serial.println("Error crítico en inicialización de datos");
        ESP.restart();
    }
    
    if (!displayManager.initialize()) {
        Serial.println("Error crítico en inicialización de display");
        ESP.restart();
    }
    
    if (!sensorManager.initialize()) {
        Serial.println("Advertencia: Error en inicialización de sensores");
    }
    
    // Mostrar información inicial
    showInitialInfo();
    
    // Conectar WiFi
    wifiManager.connect();
    
    // Configurar PWM para la pinza
    analogWriteFrequency(Config::PIN_SPINZA, 100);
    
    // Inicializar display con datos actuales
    updateDisplay();
    
    Serial.println("Inicialización completada");
}

void loop() {
    resetWatchdog(); // Reset watchdog
    
    // Manejar reconexión WiFi
    wifiManager.handleReconnection();
    
    // Enviar heartbeat periódico
    handleHeartbeat();
    
    // Lógica principal del juego
    handleGameLogic();
    
    // Enviar datos si hay cambios
    handleDataTransmission();
    
    // Guardar datos en EEPROM si es necesario
    machineData.saveIfNeeded();
    
    // Actualizar display de forma controlada
    updateDisplayControlled();
    
    delay(1); // Pequeña pausa para el watchdog
}

// ==================== FUNCIONES DE INICIALIZACIÓN ====================

bool initializeHardware() {
    // Configurar pines
    pinMode(Config::PIN_TRIGGER, OUTPUT);
    pinMode(Config::PIN_ECHO, INPUT);
    pinMode(Config::PIN_DATO7, INPUT_PULLUP);
    pinMode(Config::PIN_DATO5, OUTPUT);
    pinMode(Config::PIN_DATO3, INPUT_PULLUP);
    pinMode(Config::PIN_SPINZA, OUTPUT);
    pinMode(Config::PIN_EPINZA, INPUT_PULLUP);
    pinMode(Config::PIN_DATO11, OUTPUT);
    pinMode(Config::PIN_DATO6, INPUT_PULLUP);
    pinMode(Config::PIN_DATO10, INPUT_PULLUP);
    pinMode(Config::PIN_DATO12, INPUT_PULLUP);
    pinMode(Config::PIN_ECOIN, INPUT_PULLUP);
    
    // Inicializar salidas
    digitalWrite(Config::PIN_DATO11, HIGH);
    digitalWrite(Config::PIN_DATO5, LOW);
    analogWrite(Config::PIN_SPINZA, 0);
    
    return true;
}

void showInitialInfo() {
    displayManager.showMessage("VERSION 2.0", "EEPROM LCD Fix");
    delay(2000);
    
    // Mostrar contadores fijos si se presiona DATO3
    if (digitalRead(Config::PIN_DATO3) == LOW) {
        displayManager.showMessage("CONT.FIJOS", 
            "PJ:" + String(machineData.counters.pjfijo) + " PP:" + String(machineData.counters.ppfijo));
        delay(1000);
        while (digitalRead(Config::PIN_DATO3) == HIGH) { delay(20); }
    }
}

// ==================== FUNCIONES DE COMUNICACIÓN ====================

void handleHeartbeat() {
    if (millis() - lastHeartbeat >= Config::HEARTBEAT_INTERVAL) {
        lastHeartbeat = millis();
        
        if (wifiManager.isConnected()) {
            if (httpManager.sendHeartbeat()) {
                Serial.println("Heartbeat enviado exitosamente");
            } else {
                Serial.println("Error enviando heartbeat");
            }
        }
    }
}

void handleDataTransmission() {
    // Verificar si hay cambios en los datos importantes
    bool hasChanges = (
        machineData.counters.pjfijo != gameState.previous.prevPJFIJO ||
        machineData.counters.ppfijo != gameState.previous.prevPPFIJO ||
        machineData.counters.bank != gameState.previous.prevBANK ||
        machineData.counters.pago != gameState.previous.prevPAGO
    );
    
    if (hasChanges && wifiManager.isConnected()) {
        if (httpManager.sendMachineData(
            machineData.counters.pago,
            machineData.counters.pjfijo,
            machineData.counters.ppfijo,
            machineData.counters.bank
        )) {
            // Actualizar valores previos
            gameState.previous.prevPJFIJO = machineData.counters.pjfijo;
            gameState.previous.prevPPFIJO = machineData.counters.ppfijo;
            gameState.previous.prevBANK = machineData.counters.bank;
            gameState.previous.prevPAGO = machineData.counters.pago;
            
            // Marcar para guardar en EEPROM
            machineData.markForSave();
            
            Serial.println("Datos de máquina enviados exitosamente");
        }
    }
}

// ==================== LÓGICA DEL JUEGO ====================

void handleGameLogic() {
    // Esperar señal de pinza
    while (digitalRead(Config::PIN_EPINZA) == LOW && gameState.cTiempo < 5) {
        gameState.cTiempo++;
        
        // Leer monedas
        if (coinManager.checkCoin()) {
            gameState.credito++;
            // No actualizar display inmediatamente, se hará en updateDisplayControlled()
        }
        
        // Verificar modo programación
        checkProgrammingMode();
        
        // Control de tiempo de juego
        handleGameTiming();
        
        // Verificar barrera periódicamente
        handleBarrierCheck();
        
        delay(1);
        resetWatchdog(); // Reset watchdog en el loop
    }
    
    // Procesar juego
    processGame();
}

void processGame() {
    gameState.barreraAux = false;
    gameState.cTiempo = 0;
    gameState.barrera = false;
    
    // Descontar crédito
    if (gameState.credito >= 1) {
        gameState.credito--;
    }
    
    if (gameState.bankTiempo < 10) {
        gameState.bankTiempo++;
    }
    
    int randomValue = random(5);
    bool shouldWin = (machineData.counters.pago <= machineData.counters.bank && randomValue <= 3);
    
    if (shouldWin) {
        executeWinSequence();
    } else {
        executeLoseSequence();
    }
    
    // Incrementar contadores
    machineData.counters.coin++;
    machineData.counters.bank++;
    machineData.counters.pjfijo++;
    
    // Marcar para guardar
    machineData.markForSave();
    
    // Apagar pinza
    analogWrite(Config::PIN_SPINZA, 0);
    
    // Reset variables
    gameState.tiempo8 = 0;
    gameState.X = 0;
}

void executeWinSequence() {
    Serial.println("Secuencia de victoria");
    analogWrite(Config::PIN_SPINZA, 250);
    delay(2000);
    
    waitForPinzaReturn();
}

void executeLoseSequence() {
    Serial.println("Secuencia de pérdida");
    
    // Cerrar pinza completamente
    analogWrite(Config::PIN_SPINZA, 255);
    delay(machineData.settings.tiempo5);
    
    // Ajustar fuerza según banco
    int adjustedForce = machineData.settings.fuerza;
    if (machineData.counters.bank <= -10) {
        adjustedForce = machineData.settings.fuerza * 0.8;
    }
    
    // Secuencia de aflojamiento progresivo
    executeProgressiveRelease(adjustedForce);
    
    waitForPinzaReturn();
}

void executeProgressiveRelease(int baseForce) {
    float currentForce = random(baseForce * 1.8, baseForce * 2.5);
    float forceDecrement = (currentForce - baseForce) / 10.0;
    int timeStep = machineData.settings.tiempo / 10;
    
    for (int i = 0; i <= 10; i++) {
        currentForce -= forceDecrement;
        analogWrite(Config::PIN_SPINZA, (int)currentForce);
        delay(timeStep);
        resetWatchdog(); // Reset watchdog
    }
    
    // Ajuste final
    analogWrite(Config::PIN_SPINZA, baseForce * 1.3);
    delay(300);
    analogWrite(Config::PIN_SPINZA, baseForce);
    delay(100);
    analogWrite(Config::PIN_SPINZA, baseForce * 1.3);
}

void waitForPinzaReturn() {
    bool waitingForReturn = true;
    
    while (waitingForReturn) {
        while (gameState.X < 3000) {
            if (digitalRead(Config::PIN_EPINZA) == HIGH) {
                gameState.X = 0;
            }
            
            if (gameState.X == 150) {
                analogWrite(Config::PIN_SPINZA, 0);
            }
            
            if (digitalRead(Config::PIN_EPINZA) == LOW) {
                gameState.X++;
                delay(1);
            }
            
            // Verificar barrera periódicamente
            if (gameState.tiempo8 <= 20) {
                gameState.tiempo8++;
            }
            if (gameState.tiempo8 >= 19) {
                gameState.tiempo8 = 0;
                if (!gameState.barreraAux) {
                    checkBarrier();
                }
            }
            
            if (gameState.X == 2998) {
                waitingForReturn = false;
            }
            
            if (gameState.barreraAux) {
                waitingForReturn = false;
                break;
            }
            
            resetWatchdog(); // Reset watchdog
        }
    }
}

// ==================== FUNCIONES DE BARRERA ====================

void handleBarrierCheck() {
    if (gameState.tiempo8 < Config::BARRIER_CHECK_CYCLES) {
        gameState.tiempo8++;
        if (gameState.tiempo8 == Config::BARRIER_CHECK_CYCLES - 1) {
            gameState.tiempo8 = 0;
            if (!gameState.barreraAux) {
                checkBarrier();
            }
        }
    }
}

void checkBarrier() {
    bool barrierTriggered = false;
    
    if (machineData.settings.barreraaux2 == 1) {
        // Sensor ultrasónico
        barrierTriggered = sensorManager.isBarrierTriggered();
    } else {
        // Sensor infrarrojo
        barrierTriggered = sensorManager.isInfraredBarrierTriggered();
    }
    
    if (barrierTriggered) {
        gameState.barrera = true;
        displayManager.showBarrier();
        delay(2500);
        
        if (digitalRead(Config::PIN_DATO12) == HIGH) {
            machineData.counters.contsalida++;
            machineData.counters.ppfijo++;
            machineData.counters.bank -= machineData.counters.pago;
            gameState.barrera = false;
            gameState.barreraAux = true;
            machineData.markForSave();
        }
    }
}

// ==================== FUNCIONES DE TEMPORIZACIÓN ====================

void handleGameTiming() {
    if (gameState.tiempo7 < 100000) {
        gameState.tiempo7++;
    }
    
    if (gameState.cTiempo >= Config::GAME_TIMEOUT_CYCLES && gameState.bankTiempo > 0) {
        gameState.cTiempo = 0;
        gameState.bankTiempo--;
    }
}

// ==================== FUNCIONES DE PROGRAMACIÓN ====================

void checkProgrammingMode() {
    if (digitalRead(Config::PIN_DATO3) == LOW) {
        gameState.auxDato3++;
    } else {
        gameState.auxDato3 = 0;
    }
    
    if (digitalRead(Config::PIN_DATO3) == LOW && gameState.auxDato3 == Config::PROGRAMMING_HOLD_TIME) {
        enterProgrammingMode();
        gameState.auxDato3 = 0;
    }
}

void enterProgrammingMode() {
    Serial.println("Entrando en modo programación");
    
    // Mostrar versión
    displayManager.showMessage("VERSION 2.0", "EEPROM LCD Fix");
    delay(500);
    while (digitalRead(Config::PIN_DATO3) == HIGH) { delay(20); }
    
    // Mostrar contadores fijos
    displayManager.showMessage("PJ:" + String(machineData.counters.pjfijo), 
                              "PP:" + String(machineData.counters.ppfijo));
    delay(500);
    while (digitalRead(Config::PIN_DATO3) == HIGH) { delay(20); }
    
    // Opción para borrar contadores
    programResetCounters();
    
    // Configurar modo de display
    programDisplayMode();
    
    // Configurar pago
    programPayment();
    
    // Configurar tiempo
    programTiming();
    
    // Configurar tiempo fuerza fuerte
    programStrongForceTime();
    
    // Configurar fuerza
    programForce();
    
    // Configurar tipo de barrera
    programBarrierType();
    
    // Probar barrera
    testBarrier();
    
    // Guardar cambios inmediatamente
    machineData.forceSave();
    
    // Forzar actualización del display
    displayManager.forceUpdate();
    
    delay(500);
}

void programResetCounters() {
    bool resetCounters = false;
    displayManager.showMessage("BORRA CONTADORES", "NO");
    delay(500);
    
    while (digitalRead(Config::PIN_DATO3) == HIGH) {
        if (digitalRead(Config::PIN_DATO6) == LOW) {
            resetCounters = true;
            displayManager.showMessage("BORRA CONTADORES", "SI");
            delay(500);
        }
        if (digitalRead(Config::PIN_DATO10) == LOW) {
            resetCounters = false;
            displayManager.showMessage("BORRA CONTADORES", "NO");
            delay(500);
        }
        resetWatchdog();
    }
    
    if (resetCounters) {
        machineData.resetCounters();
        displayManager.showMessage("BORRADOS", "");
        delay(1000);
    }
}

void programDisplayMode() {
    displayManager.showMessage("Display Modo", 
        machineData.settings.gruadisplay == 0 ? "Contadores" : "Coin");
    delay(500);
    
    while (digitalRead(Config::PIN_DATO3) == HIGH) {
        if (digitalRead(Config::PIN_DATO6) == LOW) {
            machineData.settings.gruadisplay = 0;
            displayManager.showMessage("Display Modo", "Contadores");
            delay(200);
        }
        if (digitalRead(Config::PIN_DATO10) == LOW) {
            machineData.settings.gruadisplay = 1;
            displayManager.showMessage("Display Modo", "Coin");
            delay(200);
        }
        resetWatchdog();
    }
}

void programPayment() {
    displayManager.showMessage("AJUSTAR PAGO", "");
    delay(500);
    
    while (digitalRead(Config::PIN_DATO3) == HIGH) {
        displayManager.showMessage("AJUSTAR PAGO", String(machineData.counters.pago));
        delay(100);
        
        if (digitalRead(Config::PIN_DATO6) == LOW) {
            machineData.counters.pago++;
            delay(400);
        }
        if (digitalRead(Config::PIN_DATO10) == LOW) {
            machineData.counters.pago--;
            delay(400);
        }
        resetWatchdog();
    }
}

void programTiming() {
    displayManager.showMessage("AJUSTAR TIEMPO", "");
    delay(500);
    
    while (digitalRead(Config::PIN_DATO3) == HIGH) {
        displayManager.showMessage("AJUSTAR TIEMPO", String(machineData.settings.tiempo));
        delay(100);
        
        if (digitalRead(Config::PIN_DATO6) == LOW && machineData.settings.tiempo < 5000) {
            machineData.settings.tiempo += 10;
        }
        if (digitalRead(Config::PIN_DATO10) == LOW && machineData.settings.tiempo > 500) {
            machineData.settings.tiempo -= 10;
        }
        resetWatchdog();
    }
}

void programStrongForceTime() {
    displayManager.showMessage("TIEMPO F. FUERTE", "");
    delay(500);
    
    while (digitalRead(Config::PIN_DATO3) == HIGH) {
        displayManager.showMessage("TIEMPO F. FUERTE", String(machineData.settings.tiempo5));
        delay(100);
        
        if (digitalRead(Config::PIN_DATO6) == LOW && machineData.settings.tiempo5 < 5000) {
            machineData.settings.tiempo5 += 10;
        }
        if (digitalRead(Config::PIN_DATO10) == LOW && machineData.settings.tiempo5 > 0) {
            machineData.settings.tiempo5 -= 10;
        }
        resetWatchdog();
    }
}

void programForce() {
    displayManager.showMessage("AJUSTAR FUERZA", "");
    delay(500);
    
    while (digitalRead(Config::PIN_DATO3) == HIGH) {
        displayManager.showMessage("AJUSTAR FUERZA", String(machineData.settings.fuerza));
        delay(100);
        
        if (digitalRead(Config::PIN_DATO6) == LOW && machineData.settings.fuerza < 101) {
            machineData.settings.fuerza++;
        }
        if (digitalRead(Config::PIN_DATO10) == LOW && machineData.settings.fuerza > 5) {
            machineData.settings.fuerza--;
        }
        resetWatchdog();
    }
}

void programBarrierType() {
    displayManager.showMessage("TIPO BARRERA", 
        machineData.settings.barreraaux2 == 0 ? "INFRARROJO" : "ULTRASONIDO");
    delay(500);
    
    while (digitalRead(Config::PIN_DATO3) == HIGH) {
        if (digitalRead(Config::PIN_DATO6) == LOW) {
            machineData.settings.barreraaux2 = 0;
            displayManager.showMessage("TIPO BARRERA", "INFRARROJO");
            delay(200);
        }
        if (digitalRead(Config::PIN_DATO10) == LOW) {
            machineData.settings.barreraaux2 = 1;
            displayManager.showMessage("TIPO BARRERA", "ULTRASONIDO");
            delay(200);
        }
        resetWatchdog();
    }
}

void testBarrier() {
    displayManager.showMessage("PRUEBA BARRERA", "");
    delay(500);
    
    while (digitalRead(Config::PIN_DATO3) == HIGH) {
        int distance = sensorManager.readUltrasonicDistance();
        displayManager.showMessage("PRUEBA BARRERA", 
            String(distance) + " R:" + String(sensorManager.getReferenceDistance()));
        
        bool triggered = false;
        if (machineData.settings.barreraaux2 == 1) {
            triggered = sensorManager.isBarrierTriggered();
        } else {
            triggered = sensorManager.isInfraredBarrierTriggered();
        }
        
        if (triggered) {
            displayManager.showMessage("PRUEBA BARRERA", "###");
            delay(1000);
        }
        
        resetWatchdog();
        delay(100);
    }
}

// ==================== FUNCIONES DE DISPLAY ====================

void updateDisplay() {
    if (machineData.settings.gruadisplay == 0) {
        displayManager.showCounters(machineData.counters, gameState.bankTiempo);
    } else {
        displayManager.showCredit(gameState.credito);
    }
}

void updateDisplayControlled() {
    // Actualizar display de forma controlada para evitar reinicio constante
    unsigned long currentTime = millis();
    if (currentTime - lastDisplayUpdate >= Config::LCD_UPDATE_INTERVAL) {
        updateDisplay();
        lastDisplayUpdate = currentTime;
    }
}