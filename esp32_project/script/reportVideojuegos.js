document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM completamente cargado y parseado"); // Depuración para confirmar que el DOM está listo

    const urlParams = new URLSearchParams(window.location.search);
    const deviceId = urlParams.get('device_id');
    const machineName = document.getElementById('machine_name');

    if (!machineName) {
        console.error("Elemento #machine_name no encontrado en el DOM.");
        return;
    }

    machineName.innerText = `Machine ${deviceId}`;

    // Obtener reportes y cierres diarios
    fetch(`/esp32_project/get_report.php?device_id=${deviceId}`)
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
                    const reportDate = new Date(report.timestamp);
                    reportDate.setHours(reportDate.getHours() - 3); // Ajustar si es necesario

                    const reportRow = document.createElement("tr");
                    reportRow.innerHTML = `
                        <td>${reportDate.toLocaleString()}</td>
                        <td>${report.dato2 ?? 'N/A'}</td>
                    `;
                    tableBody.appendChild(reportRow);
                });
                console.log("Tabla cargada con datos.");
            }
        })
        .catch(error => {
            console.error('Error al obtener los datos:', error);
        });
});


document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM completamente cargado y parseado");

    const urlParams = new URLSearchParams(window.location.search);
    const deviceId = urlParams.get('device_id');
    const machineName = document.getElementById('machine_name');
    
    if (machineName) {  // Verifica si el elemento existe
        machineName.innerText = `Machine ${deviceId}`;
    } else {
        console.warn("Elemento con id 'machine_name' no encontrado en el DOM.");
    }

    if (!deviceId) {
        console.error("El device_id es requerido.");
        return;
    }

    fetch(`/esp32_project/get_closes.php?device_id=${deviceId}`)

        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.reports && Array.isArray(data.reports)) {
                calcularCierresDiarios(data.reports);
                cargarTabla('tabla-diarios', datosDiarios, ['fecha', 'coin']);
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
    const cierresPorDia = {};

    reports.forEach(report => {
        const fecha = report.timestamp.split(" ")[0];

        if (!cierresPorDia[fecha]) {
            cierresPorDia[fecha] = { fecha, coin: 0};
        }
        cierresPorDia[fecha].coin += report.dato2;
    });

    datosDiarios = Object.values(cierresPorDia);
    console.log("Cierres Diarios (agrupados por fecha):", datosDiarios);
}


function calcularCierreSemanalDesdeFecha(fechaInicio) {
    datosSemanales = []; // Reiniciar los datos semanales
    console.log("Fecha de inicio seleccionada por el usuario:", fechaInicio);
    console.log("Datos diarios disponibles:", datosDiarios);

    let fecha = new Date(fechaInicio);
    fecha.setHours(0, 0, 0, 0); // Asegurarse de que esté ajustado a medianoche

    // Mientras la fecha esté dentro del rango de los datos
    while (fecha <= new Date(datosDiarios[datosDiarios.length - 1].fecha) || datosSemanales.length === 0) {
        const semana = []; // Arreglo para la semana actual

        for (let i = 0; i < 7; i++) {
            const fechaDia = new Date(fecha.getTime() + i * 24 * 60 * 60 * 1000);
            const fechaStr = fechaDia.toISOString().split('T')[0];

            // Buscar el cierre diario para el día actual
            const cierreDiario = datosDiarios.find(dia => dia.fecha === fechaStr);

            if (cierreDiario) {
                semana.push(cierreDiario);
            } else {
                // Día sin datos, agregar valores en 0
                semana.push({
                    fecha: fechaStr,
                    coin: 0,
                });
            }
        }

        // Sumar los valores de la semana actual
        const totalSemana = semana.reduce((acc, dia) => {
            acc.coin += dia.coin;
            return acc;
        }, { fecha: `Semana del ${fecha.toLocaleDateString()}`, coin: 0});

        datosSemanales.push(totalSemana);
        fecha = new Date(fecha.getTime() + 7 * 24 * 60 * 60 * 1000); // Avanzar a la próxima semana
    }

    console.log("Cierres Semanales desde la fecha seleccionada:", datosSemanales);
    cargarTabla('tabla-semanales', datosSemanales, ['fecha','coin']);
}


// Función para calcular cierres mensuales basado en el rango de fechas seleccionado
function calcularCierreMensual(fechaInicio) {
    datosMensuales = []; // Reiniciar datos mensuales

    // Definir el inicio y fin del mes
    const inicioMes = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), 1, 0, 0, 0); // Día 1, 00:00
    const finMes = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + 1, 0, 23, 59, 59); // Último día del mes, 23:59

    console.log(`Calculando cierre mensual para el rango: ${inicioMes.toLocaleDateString()} - ${finMes.toLocaleDateString()}`);
    
    // Filtrar los días dentro del rango mensual seleccionado
    const diasDelMes = [];
    for (let dia = inicioMes; dia <= finMes; dia.setDate(dia.getDate() + 1)) {
        const fechaStr = dia.toISOString().split('T')[0];
        
        // Buscar si existe un cierre diario para el día actual
        const cierreDiario = datosDiarios.find(d => d.fecha === fechaStr);

        if (cierreDiario) {
            diasDelMes.push(cierreDiario);
        } else {
            // Día sin datos, añadir un objeto con valores en 0
            diasDelMes.push({
                fecha: fechaStr,
                coin: 0,
            });
        }
    }

    // Sumar los valores del mes
    const totalMes = diasDelMes.reduce((acc, dia) => {
        acc.coin += dia.coin;
        return acc;
    }, { fecha: `${inicioMes.toLocaleDateString()} - ${finMes.toLocaleDateString()}`, coin: 0});

    datosMensuales.push(totalMes); // Agregar el cierre mensual calculado
    console.log("Cierre Mensual calculado:", datosMensuales);
}


// Función para cargar datos en tablas
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
            cargarTabla('tabla-mensuales', datosMensuales, ['fecha', 'coin']);
        }
    }
});


// Función para mostrar la sección seleccionada y generar gráficas si es necesario
function mostrarSeccion(seccion) {
    const secciones = document.querySelectorAll(".seccion");
    secciones.forEach((s) => s.classList.remove("active"));
    document.getElementById(seccion).classList.add("active");

    // Generar las gráficas al seleccionar la sección correspondiente
    if (seccion === 'graficas' && !graficasCargadas.comparativa) {
        generarGraficaDiarias(datosDiarios);
        generarGraficaSemanales(datosSemanales);
        generarGraficaMensuales(datosMensuales);
        generarGraficaComparativa(datosMensuales);
        graficasCargadas.comparativa = true;
    }
}

// Variables para controlar el estado de las gráficas
let graficasCargadas = {
    diarios: false,
    semanales: false,
    mensuales: false,
    comparativa: false
};

// Ejemplo de función de generación de gráficas (usando Chart.js) para datos diarios
function generarGraficaDiarias(datos) {
    const ctx = document.getElementById('grafica-ganancias-diarias').getContext('2d');
    const etiquetas = datos.map(d => d.fecha);
    const ganancias = datos.map(d => d.pesos);  // Usando "pesos" como dato de ejemplo
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: etiquetas,
            datasets: [{
                label: 'Ganancias Diarias',
                data : ganancias,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}
function generarGraficaSemanales(datos) {
    const ctx = document.getElementById('grafica-ganancias-semanales').getContext('2d');
    const etiquetas = datos.map(d => d.fecha); // Etiqueta semanal
    const ganancias = datos.map(d => d.pesos); // 'pesos' como ganancias semanales
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: etiquetas,
            datasets: [{
                label: 'Ganancias Semanales',
                data: ganancias,
                borderColor: 'rgba(153, 102, 255, 1)',
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function generarGraficaMensuales(datos) {
    const ctx = document.getElementById('grafica-ganancias-mensuales').getContext('2d');
    const etiquetas = datos.map(d => d.fecha); // Fecha mensual
    const ganancias = datos.map(d => d.coin); // 'pesos' para ganancias mensuales
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: etiquetas,
            datasets: [{
                label: 'Ganancias Mensuales',
                data: ganancias,
                backgroundColor: 'rgba(255, 206, 86, 0.2)',
                borderColor: 'rgba(255, 206, 86, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function generarGraficaComparativa(datos) {
    const ctx = document.getElementById('grafica-comparativa').getContext('2d');
    const etiquetas = datos.map(d => d.fecha); // Fecha para la comparativa
    const ganancias = datos.map(d => d.coin); // 'pesos' como ganancias
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: etiquetas,
            datasets: [
                {
                    label: 'Ganancias',
                    data: ganancias,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    fill: false
                },
                {
                    label: 'Pérdidas',
                    data: perdidas,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}