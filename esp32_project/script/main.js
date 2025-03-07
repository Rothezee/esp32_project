document.addEventListener("DOMContentLoaded", function () {
    const devices = [
        { deviceId: 'ESP32_001', pesosId: 'pesos_maquina_1', coinId: 'coin_maquina_1', premiosId: 'premios_maquina_1', statusId: 'status_maquina_1', bancoId: 'banco_maquina_1', ticketId: '' },
        { deviceId: 'ESP32_002', pesosId: 'pesos_maquina_2', coinId: 'coin_maquina_2', premiosId: 'premios_maquina_2', statusId: 'status_maquina_2', bancoId: 'banco_maquina_2', ticketId: '' },
        { deviceId: 'ESP32_003', pesosId: 'pesos_maquina_3', coinId: 'coin_maquina_3', premiosId: 'premios_maquina_3', statusId: 'status_maquina_3', bancoId: 'banco_maquina_3', ticketId: '' },
        { deviceId: 'ESP32_004', pesosId: 'pesos_maquina_4', coinId: 'coin_maquina_4', premiosId: 'premios_maquina_4', statusId: 'status_maquina_4', bancoId: 'banco_maquina_4', ticketId: '' },
        { deviceId: 'ESP32_005', pesosId: 'pesos_maquina_5', coinId: 'coin_maquina_5', premiosId: 'premios_maquina_5', statusId: 'status_maquina_5', bancoId: 'banco_maquina_5', ticketId: '' },
        { deviceId: 'ESP32_006', pesosId: 'pesos_maquina_6', coinId: 'coin_maquina_6', premiosId: 'premios_maquina_6', statusId: 'status_maquina_6', bancoId: 'banco_maquina_6', ticketId: '' },
        { deviceId: 'ESP32_007', pesosId: 'pesos_maquina_7', coinId: 'coin_maquina_7', premiosId: 'premios_maquina_7', statusId: 'status_maquina_7', bancoId: 'banco_maquina_7', ticketId: '' },
        { deviceId: 'ESP32_008', pesosId: 'pesos_maquina_8', coinId: 'coin_maquina_8', premiosId: 'premios_maquina_8', statusId: 'status_maquina_8', bancoId: 'banco_maquina_8', ticketId: '' },
        { deviceId: 'ESP32_009', pesosId: 'pesos_maquina_9', coinId: 'coin_maquina_9', premiosId: 'premios_maquina_9', statusId: 'status_maquina_9', bancoId: 'banco_maquina_9', ticketId: '' },
        { deviceId: 'ESP32_010', pesosId: 'pesos_maquina_10', coinId: 'coin_maquina_10', premiosId: 'premios_maquina_10', statusId: 'status_maquina_10', bancoId: 'banco_maquina_10', ticketId: '' },
        { deviceId: 'Videojuego_1', pesosId: '', coinId: 'coin_maquina_videojuego_1', premiosId: '', statusId: 'status_maquina_videojuego_1', bancoId: '', ticketId: '' },
        { deviceId: 'Videojuego_2', pesosId: '', coinId: 'coin_maquina_videojuego_2', premiosId: '', statusId: 'status_maquina_videojuego_2', bancoId: '', ticketId: '' },
        { deviceId: 'Videojuego_3', pesosId: '', coinId: 'coin_maquina_videojuego_3', premiosId: '', statusId: 'status_maquina_videojuego_3', bancoId: '', ticketId: '' },
        { deviceId: 'Videojuego_4', pesosId: '', coinId: 'coin_maquina_videojuego_4', premiosId: '', statusId: 'status_maquina_videojuego_4', bancoId: '', ticketId: '' },
        { deviceId: 'Videojuego_5', pesosId: '', coinId: 'coin_maquina_videojuego_5', premiosId: '', statusId: 'status_maquina_videojuego_5', bancoId: '', ticketId: '' },
        { deviceId: 'Ticket_1', pesosId: '', coinId: 'coin_maquina_ticket_1', premiosId: '', statusId: 'status_maquina_ticket_1', bancoId: '', ticketId: 'ticket_maquina_ticket_1' },
        { deviceId: 'Ticket_2', pesosId: '', coinId: 'coin_maquina_ticket_2', premiosId: '', statusId: 'status_maquina_ticket_2', bancoId: '', ticketId: 'ticket_maquina_ticket_2' },
        { deviceId: 'Ticket_3', pesosId: '', coinId: 'coin_maquina_ticket_3', premiosId: '', statusId: 'status_maquina_ticket_3', bancoId: '', ticketId: 'ticket_maquina_ticket_3' },
        { deviceId: 'Ticket_4', pesosId: '', coinId: 'coin_maquina_ticket_4', premiosId: '', statusId: 'status_maquina_ticket_4', bancoId: '', ticketId: 'ticket_maquina_ticket_4' },
        { deviceId: 'Ticket_5', pesosId: '', coinId: 'coin_maquina_ticket_5', premiosId: '', statusId: 'status_maquina_ticket_5', bancoId: '', ticketId: 'ticket_maquina_ticket_5' },
        { deviceId: 'EXPENDEDORA_1', pesosId: 'fichas_expendedora_1', coinId: 'dinero_expendedora_1', premiosId: '', statusId: 'status_expendedora_1', bancoId: '', ticketId: '' },
        { deviceId: 'EXPENDEDORA_2', pesosId: 'fichas_expendedora_2', coinId: 'dinero_expendedora_2', premiosId: '', statusId: 'status_expendedora_2', bancoId: '', ticketId: '' },
        { deviceId: 'EXPENDEDORA_3', pesosId: 'fichas_expendedora_3', coinId: 'dinero_expendedora_3', premiosId: '', statusId: 'status_expendedora_3', bancoId: '', ticketId: '' },
        { deviceId: 'EXPENDEDORA_4', pesosId: 'fichas_expendedora_4', coinId: 'dinero_expendedora_4', premiosId: '', statusId: 'status_expendedora_4', bancoId: '', ticketId: '' },
        { deviceId: 'EXPENDEDORA_5', pesosId: 'fichas_expendedora_5', coinId: 'dinero_expendedora_5', premiosId: '', statusId: 'status_expendedora_5', bancoId: '', ticketId: '' }
    ];

    devices.forEach(device => {
        fetchData(device.deviceId, device.pesosId, device.coinId, device.premiosId, device.statusId, device.bancoId, device.ticketId);
    });

    // Actualizar el estado y los datos cada minuto
    setInterval(() => {
        devices.forEach(device => {
            fetchData(device.deviceId, device.pesosId, device.coinId, device.premiosId, device.statusId, device.bancoId, device.ticketId);
        });
    }, 60000);
});

document.addEventListener("DOMContentLoaded", function () {
    const devices = [
        { deviceId: 'ESP32_001', pesosId: 'pesos_maquina_1', coinId: 'coin_maquina_1', premiosId: 'premios_maquina_1', statusId: 'status_maquina_1', bancoId: 'banco_maquina_1', ticketId: '' },
        { deviceId: 'ESP32_002', pesosId: 'pesos_maquina_2', coinId: 'coin_maquina_2', premiosId: 'premios_maquina_2', statusId: 'status_maquina_2', bancoId: 'banco_maquina_2', ticketId: '' },
        // Añadir más dispositivos según sea necesario...
    ];

    devices.forEach(device => {
        fetchData(device);
    });

    // Actualizar el estado y los datos cada minuto
    setInterval(() => {
        devices.forEach(device => {
            fetchData(device);
        });
    }, 60000);
});

function fetchData(device) {

    fetch('get_data.php?device_id=' + device.deviceId)
        .then(response => response.json())
        .then(data => {

            if (data.error) {
                updateElementIfExists(device.pesosId, 'N/A');
                updateElementIfExists(device.coinId, 'N/A');
                updateElementIfExists(device.premiosId, 'N/A');
                updateElementIfExists(device.bancoId, 'N/A');
                updateElementIfExists(device.ticketId, 'N/A');
                updateElementIfExists(device.statusId, 'Desconectado');
            } else {
                updateElementIfExists(device.pesosId, data.dato1 || 'N/A');
                updateElementIfExists(device.coinId, data.dato2 || 'N/A');
                updateElementIfExists(device.premiosId, data.dato3 || 'N/A');
                updateElementIfExists(device.ticketId, data.dato5 || 'N/A');
                updateElementIfExists(device.statusId, data.status === 'online' ? 'Conectado' : 'Desconectado');

                if (device.bancoId) {
                    setBancoValue(device.bancoId, data.dato4 || 'N/A');
                }

                // Llamar a checkStatus para actualizar el estado
                checkStatus(device.deviceId, device.statusId);
            }
        })
        .catch(error => {
            console.error(`Error en fetch para ${device.deviceId}:`, error);
            updateElementIfExists(device.pesosId, 'N/A');
            updateElementIfExists(device.coinId, 'N/A');
            updateElementIfExists(device.premiosId, 'N/A');
            updateElementIfExists(device.bancoId, 'N/A');
            updateElementIfExists(device.ticketId, 'N/A');
            updateElementIfExists(device.statusId, 'Desconectado');
        });
}

function updateElementIfExists(elementId, value) {
    if (elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerText = value;
        }
    }
}

// Resaltar BANCO si es menor o igual a -10
function setBancoValue(bancoId, value) {
    const bancoElement = document.getElementById(bancoId); // Elemento del span de BANCO
    const itemElement = bancoElement.closest('.item'); // Contenedor padre con la clase "item"

    if (bancoElement && itemElement) {
        const numericValue = parseFloat(value); // Convertir el valor a número
        bancoElement.innerText = value;

        // Verificar si el valor cumple la condición
        if (!isNaN(numericValue) && numericValue <= -10) {
            itemElement.style.backgroundColor = "red"; // Fondo rojo para el contenedor
            itemElement.style.color = "white"; // Texto blanco para contraste
        } else {
            // Restablecer estilos si no cumple la condición
            itemElement.style.backgroundColor = "";
            itemElement.style.color = "";
        }
    } else {
        console.error('Element or item container not found for:', bancoId);
    }
}

function checkStatus(deviceId, statusId) {
    if (!statusId) return; // Si el statusId está vacío, no hacemos nada

    fetch('check_status.php?device_id=' + deviceId)
        .then(response => response.json())
        .then(data => {

            if (data.error) {
                console.error(`Error al obtener estado de ${deviceId}:`, data.error);
                updateElementIfExists(statusId, 'Desconectado');
            } else {
                const statusText = data.status === 'online' ? 'Conectado' : 'Desconectado';
                updateElementIfExists(statusId, statusText);
            }
        })
        .catch(error => {
            updateElementIfExists(statusId, 'Desconectado');
        });
}
