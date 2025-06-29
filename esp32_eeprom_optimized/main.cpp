/*
ESP32 Grúa Controller - Versión EEPROM Optimizada 2025
Características principales:
- Uso de EEPROM en lugar de Preferences para mayor estabilidad
- Arquitectura modular y mantenible
- Manejo robusto de WiFi con reconexión automática
- Sistema de heartbeat confiable
- Gestión eficiente de memoria y energía
- Manejo de errores mejorado
- Watchdog timer para prevenir cuelgues
- Escrituras inteligentes a EEPROM (solo cuando hay cambios)
- Código más legible y documentado
*/

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <EEPROM.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <esp_task_wdt.h>

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
    static constexpr unsigned long WATCHDOG_TIMEOUT = 30000;  // 30 segundos
    static constexpr unsigned long EEPROM_SAVE_INTERVAL = 10000;  // 10 segundos
    
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

// ==================== CLASES Y ESTRUCTURAS ====================

class EEPROMManager {
private:
    static constexpr int INIT_VALUE = 0x12345678;  // Valor mágico para verificar inicialización
    
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
        EEPROM.put(EEPROMAddresses::COIN, 0);
        EEPROM.put(EEPROMAddresses::CONTSALIDA, 0);
        EEPROM.put(EEPROMAddresses::BANK, 0);
        EEPROM.put(EEPROMAddresses::PAGO, 12);
        EEPROM.put(EEPROMAddresses::TIEMPO, 2000);
        EEPROM.put(EEPROMAddresses::FUERZA, 50);
        EEPROM.put(EEPROMAddresses::PJFIJO, 0);
        EEPROM.put(EEPROMAddresses::PPFIJO, 0);
        EEPROM.put(EEPROMAddresses::BARRERAAUX2, 0);
        EEPROM.put(EEPROMAddresses::GRUADISPLAY, 0);
        EEPROM.put(EEPROMAddresses::TIEMPO5, 0);
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
        EEPROM.put(EEPROMAddresses::COIN, 0);
        EEPROM.put(EEPROMAddresses::CONTSALIDA, 0);
        EEPROM.put(EEPROMAddresses::BANK, 0);
        EEPROM.put(EEPROMAddresses::PJFIJO, 0);
        EEPROM.put(EEPROMAddresses::PPFIJO, 0);
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
            esp_task_wdt_reset(); // Reset watchdog
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
        counters.coin = eepromManager->read<unsigned int>(EEPROMAddresses::COIN);
        counters.contsalida = eepromManager->read<unsigned int>(EEPROMAddresses::CONTSALIDA);
        counters.bank = eepromManager->read<int>(EEPROMAddresses::BANK);
        counters.pago = eepromManager->read<int>(EEPROMAddresses::PAGO);
        counters.pjfijo = eepromManager->read<unsigned int>(EEPROMAddresses::PJFIJO);
        counters.ppfijo = eepromManager->read<unsigned int>(EEPROMAddresses::PPFIJO);
        
        settings.tiempo = eepromManager->read<int>(EEPROMAddresses::TIEMPO);
        settings.fuerza = eepromManager->read<int>(EEPROMAddresses::FUERZA);
        settings.tiempo5 = eepromManager->read<int>(EEPROMAddresses::TIEMPO5);
        settings.barreraaux2 = eepromManager->read<int>(EEPROMAddresses::BARRERAAUX2);
        settings.gruadisplay = eepromManager->read<int>(EEPROMAddresses::GRUADISPLAY);
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
        eepromManager->write(EEPROMAddresses::COIN, counters.coin);
        eepromManager->write(EEPROMAddresses::CONTSALIDA, counters.contsalida);
        eepromManager->write(EEPROMAddresses::BANK, counters.bank);
        eepromManager->write(EEPROMAddresses::PAGO, counters.pago);
        eepromManager->write(EEPROMAddresses::PJFIJO, counters.pjfijo);
        eepromManager->write(EEPROMAddresses::PPFIJO, counters.ppfijo);
        
        eepromManager->write(EEPROMAddresses::TIEMPO, settings.tiempo);
        eepromManager->write(EEPROMAddresses::FUERZA, settings.fuerza);
        eepromManager->write(EEPROMAddresses::TIEMPO5, settings.tiempo5);
        eepromManager->write(EEPROMAddresses::BARRERAAUX2, settings.barreraaux2);
        eepromManager->write(EEPROMAddresses::GRUADISPLAY, settings.gruadisplay);
        
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
    
public:
    DisplayManager() : lcd(Config::LCD_ADDRESS, Config::LCD_COLUMNS, Config::LCD_ROWS) {}
    
    bool initialize() {
        lcd.init();
        lcd.backlight();
        return true;
    }
    
    void showCounters(const MachineData::Counters& counters, int bankTiempo) {
        lcd.clear();
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
    }
    
    void showCredit(int credito) {
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("Credito");
        lcd.setCursor(8, 0);
        lcd.print(credito);
    }
    
    void showBarrier() {
        lcd.setCursor(0, 1);
        lcd.print("###");
    }
    
    void showMessage(const String& line1, const String& line2 = "") {
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print(line1);
        if (line2.length() > 0) {
            lcd.setCursor(0, 1);
            lcd.print(line2);
        }
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

// ==================== FUNCIONES PRINCIPALES ====================

void setup() {
    Serial.begin(115200);
    Serial.println("=== ESP32 Grúa Controller v2.0 EEPROM ===");
    
    // Configurar watchdog
    esp_task_wdt_init(Config::WATCHDOG_TIMEOUT / 1000, true);
    esp_task_wdt_add(NULL);
    
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
    
    // Inicializar display
    updateDisplay();
    
    Serial.println("Inicialización completada");
}

void loop() {
    esp_task_wdt_reset(); // Reset watchdog
    
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
    displayManager.showMessage("VERSION 2.0", "EEPROM Optimized");
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
            updateDisplay();
        }
        
        // Verificar modo programación
        checkProgrammingMode();
        
        // Control de tiempo de juego
        handleGameTiming();
        
        // Verificar barrera periódicamente
        handleBarrierCheck();
        
        delay(1);
        esp_task_wdt_reset(); // Reset watchdog en el loop
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
    
    updateDisplay();
    
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
    updateDisplay();
    
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
        esp_task_wdt_reset(); // Reset watchdog
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
            
            esp_task_wdt_reset(); // Reset watchdog
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
        updateDisplay();
        
        if (digitalRead(Config::PIN_DATO12) == HIGH) {
            machineData.counters.contsalida++;
            machineData.counters.ppfijo++;
            machineData.counters.bank -= machineData.counters.pago;
            gameState.barrera = false;
            gameState.barreraAux = true;
            machineData.markForSave();
            updateDisplay();
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
    displayManager.showMessage("VERSION 2.0", "EEPROM Optimized");
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
    
    updateDisplay();
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
        esp_task_wdt_reset();
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
        esp_task_wdt_reset();
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
        esp_task_wdt_reset();
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
        esp_task_wdt_reset();
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
        esp_task_wdt_reset();
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
        esp_task_wdt_reset();
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
        esp_task_wdt_reset();
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
        
        esp_task_wdt_reset();
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