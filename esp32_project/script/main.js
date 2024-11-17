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
        { deviceId: 'Ticket_5', pesosId: '', coinId: 'coin_maquina_ticket_5', premiosId: '', statusId: 'status_maquina_ticket_5', bancoId: '', ticketId: 'ticket_maquina_ticket_5' }
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

function fetchData(deviceId, pesosId, coinId, premiosId, statusId, bancoId, ticketId) {
    fetch('get_data.php?device_id=' + deviceId)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error(data.error);
                setElementText(pesosId, 'N/A');
                setElementText(coinId, 'N/A');
                setElementText(premiosId, 'N/A');
                setElementText(bancoId, 'N/A');
                setElementText(ticketId, 'N/A');
                setElementText(statusId, 'Desconectado');
            } else {
                setElementText(pesosId, data.dato1 || 'N/A');
                setElementText(coinId, data.dato2 || 'N/A');
                setElementText(premiosId, data.dato3 || 'N/A');
                setBancoValue(bancoId, data.dato4 || 'N/A');
                setElementText(ticketId, data.dato5 || 'N/A');
                checkStatus(deviceId, statusId);
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            setElementText(pesosId, 'N/A');
            setElementText(coinId, 'N/A');
            setElementText(premiosId, 'N/A');
            setElementText(bancoId, 'N/A');
            setElementText(ticketId, 'N/A');
            setElementText(statusId, 'Desconectado');
        });
}

function setElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerText = text;
    } else {
        console.error('Element not found:', elementId);
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



function checkStatus(deviceId, elementId) {
    fetch('check_status.php?device_id=' + deviceId)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error(data.error);
                setElementText(elementId, 'Desconectado');
            } else {
                setElementText(elementId, data.status === 'online' ? 'Conectado' : 'Desconectado');
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            setElementText(elementId, 'Desconectado');
        });
}
