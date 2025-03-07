document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM completamente cargado y parseado"); // Depuración para confirmar que el DOM está listo

    const urlParams = new URLSearchParams(window.location.search);
    const device_id = urlParams.get('device_id');
    const machineName = document.getElementById('machine_name');

    if (!machineName) {
        console.error("Elemento #machine_name no encontrado en el DOM.");
        return;
    }

    machineName.innerText = `Machine ${device_id}`;

    // Obtener reportes y cierres diarios
    fetch(`/esp32_project/get_report_expendedora.php?device_id=${deviceId}`)
        .then(response => {
            console.log('Respuesta de fetch:', response);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); 
        })
        .then(data => {
            console.log("Datos recibidos:", data); // Verificar los datos

            if (data.error) {
                console.error(data.error);
            } else {
                const reports = data.reports || [];
                const tableBody = document.querySelector("#report_table tbody");
                
                if (!tableBody) {
                    console.error("Elemento #report_table tbody no encontrado en el DOM.");
                    return;
                }

                tableBody.innerHTML = ""; 

                reports.forEach(report => {
                    const reportRow = document.createElement("tr");
                    reportRow.innerHTML = `
                        <td>${report.device_id}</td>
                        <td>${report.fichas}</td>
                        <td>${report.dinero}</td>
                    `;
                    tableBody.appendChild(reportRow);
                });
                console.log("Tabla cargada con datos.");
            }
        })
        .catch(error => {
            console.error('Error al obtener los datos:', error);
        });

    // Llamar a la función para actualizar el estado de la expendedora
    actualizarEstadoExpendedora(deviceId);
});

function actualizarEstadoExpendedora(deviceId) {
    fetch(`/esp32_project/check_status.php?device_id=${deviceId}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error al obtener el estado:', data.error);
            } else {
                console.log('Estado de la expendedora:', data.status);
                // Aquí se actualiza el estado en el dashboard
                const estadoElement = document.getElementById(`status_${deviceId.toLowerCase()}`);
                if (estadoElement) {
                    estadoElement.innerText = data.status === 'online' ? 'Conectado' : 'Desconectado';
                    estadoElement.classList.toggle('conectado', data.status === 'online');
                    estadoElement.classList.toggle('desconectado', data.status !== 'online');
                }
            }
        })
        .catch(error => {
            console.error('Error en la solicitud de estado:', error);
        });
}

document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM completamente cargado y parseado");

    const urlParams = new URLSearchParams(window.location.search);
    const device_id = urlParams.get('device_id');
    const machineName = document.getElementById('machine_name');
    
    if (machineName) {  // Verifica si el elemento existe
        machineName.innerText = `Machine ${device_id}`;
    } else {
        console.warn("Elemento con id 'machine_name' no encontrado en el DOM.");
    }

    if (!device_id) {
        console.error("El id_expendedora es requerido.");
        return;
    }

    fetch(`/esp32_project/get_report_expendedora.php?device_id=${device_id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.reports && Array.isArray(data.reports)) {
                calcularCierresDiarios(data.reports);
                cargarTabla('tabla-diarios', datosDiarios, ['fecha', 'fichas', 'dinero']);
            } else {
                console.warn('No se recibieron reportes válidos.');
            }
        })
        .catch(error => {
            console.error("Error al obtener los datos:", error);
        });
});

// Función para calcular cierres diarios sin filtrar, para mostrar todos los días
function calcularCierresDiarios(reports) {
    const cierresPorDia = {}; // Objeto para almacenar los cierres por día

    // Agrupar los reportes por fecha
    reports.forEach(report => {
        const fecha = report.timestamp.split(" ")[0]; // Extraer solo la fecha (YYYY-MM-DD)

        // Si no existe un cierre para el día, inicializamos con el primer reporte
        if (!cierresPorDia[fecha]) {
            cierresPorDia[fecha] = [];
        }

        // Agregar el reporte a la lista del día correspondiente
        cierresPorDia[fecha].push(report);
    });

    // Convertir cierresPorDia en un array y procesar cada día
    datosDiarios = Object.entries(cierresPorDia).map(([fecha, reportesDelDia]) => {
        // Si hay un único reporte, tomarlo directamente
        if (reportesDelDia.length === 1) {
            const unicoReporte = reportesDelDia[0];
            return {
                fecha,
                fichas: unicoReporte.fichas,  // Mostrar tal cual
                dinero: unicoReporte.dinero, // Mostrar tal cual
            };
        } else {
            // Caso general: calcular las diferencias para fichas y dinero
            const primerReporte = reportesDelDia[0];
            const ultimoReporte = reportesDelDia[reportesDelDia.length - 1];

            return {
                fecha,
                fichas: primerReporte.fichas - ultimoReporte.fichas, // Diferencia de fichas
                dinero: primerReporte.dinero - ultimoReporte.dinero, // Diferencia de dinero
            };
        }
    });

    console.log("Cierres Diarios (agrupados por fecha):", datosDiarios);
}

function cargarTabla(idTabla, datos, columnas) {
    const tbody = document.getElementById(idTabla)?.querySelector("tbody");
    if (!tbody) {
        console.warn(`Elemento con id ${idTabla} no encontrado en el DOM.`);
        return;
    }
    tbody.innerHTML = ""; // Limpiar la tabla

    console.log(`Cargando datos en la tabla ${idTabla}:`, datos);

    datos.forEach(fila => {
        const tr = document.createElement("tr");
        columnas.forEach(columna => {
            const td = document.createElement("td");
            td.textContent = fila[columna];
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

// Inicializar Flatpickr para el selector de inicio de semana
flatpickr("#selector-inicio-semana", {
    dateFormat: "Y-m-d",
    onClose: function(selectedDates) {
        if (selectedDates.length === 1) {
            // Llamar a la función calcularCierreSemanalDesdeFecha
            calcularCierreSemanalDesdeFecha(selectedDates[0]);
        }
    }
});

// Inicializar Flatpickr para seleccionar solo el mes
flatpickr("#selector-inicio-mes", {
    dateFormat: "Y-m",
    altInput: true,
    altFormat: "F Y",
    plugins: [
        new monthSelectPlugin({
            shorthand: true,
            dateFormat: "Y-m",
            altFormat: "F Y"
        })
    ],
    onClose: function(selectedDates) {
        if (selectedDates.length === 1) {
            calcularCierreMensual(selectedDates[0]);
            cargarTabla('tabla-mensuales', datosMensuales, ['fecha', 'fichas', 'dinero']);
        }
    }
});