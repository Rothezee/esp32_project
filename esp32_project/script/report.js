let datosDiarios = [];
let datosSemanales = [];
let datosMensuales = [];

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM completamente cargado y parseado");

    const urlParams = new URLSearchParams(window.location.search);
    const deviceId = urlParams.get('device_id');
    const machineName = document.getElementById('machine_name');

    if (!machineName) {
        console.error("Elemento #machine_name no encontrado en el DOM.");
        return;
    }

    machineName.innerText = `Machine ${deviceId}`;

    if (!deviceId) {
        console.error("El device_id es requerido.");
        return;
    }

    fetch(`/esp32_project/get_report.php?device_id=${deviceId}`)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
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
                    reportDate.setHours(reportDate.getHours() - 3);

                    const reportRow = document.createElement("tr");
                    reportRow.innerHTML = `
                        <td>${reportDate.toLocaleString()}</td>
                        <td>${report.dato1 ?? 'N/A'}</td>
                        <td>${report.dato2 ?? 'N/A'}</td>
                        <td>${report.dato3 ?? 'N/A'}</td>
                        <td>${report.dato4 ?? 'N/A'}</td>
                    `;
                    tableBody.appendChild(reportRow);
                });

                calcularCierresDiarios(reports);
                cargarTabla('tabla-diarios', datosDiarios, ['fecha', 'pesos', 'coin', 'premios', 'banco']);
            }
        })
        .catch(error => console.error('Error al obtener los datos:', error));

    // Inicializar el selector de inicio de semana
    flatpickr("#selector-inicio-semana", {
        dateFormat: "Y-m-d",
        onClose: function(selectedDates) {
            if (selectedDates.length === 1) {
                calcularCierreSemanalDesdeFecha(selectedDates[0], deviceId);
            }
        }
    });

    // Inicializar el selector de inicio de mes
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
                calcularCierreMensual(selectedDates[0], deviceId);
            }
        }
    });
});

function calcularCierresDiarios(reports) {
    const cierresPorDia = {};

    reports.forEach(report => {
        const fecha = report.timestamp.split(" ")[0];

        if (!cierresPorDia[fecha]) {
            cierresPorDia[fecha] = [];
        }

        cierresPorDia[fecha].push(report);
    });

    datosDiarios = Object.entries(cierresPorDia).map(([fecha, reportesDelDia]) => {
        // Ordenar los reportes por timestamp ascendente para asegurar que el primer reporte es el más temprano y el último reporte es el más tardío
        reportesDelDia.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        if (reportesDelDia.length === 1) {
            const unicoReporte = reportesDelDia[0];
            return {
                fecha,
                pesos: unicoReporte.dato1 ?? 0,
                coin: unicoReporte.dato2 ?? 0,
                premios: unicoReporte.dato3 ?? 0,
                banco: unicoReporte.dato4 ?? 0
            };
        } else {
            const primerReporte = reportesDelDia[0];
            const ultimoReporte = reportesDelDia[reportesDelDia.length - 1];

            console.log(`Día: ${fecha}, Primer reporte:`, primerReporte, `Último reporte:`, ultimoReporte);

            return {
                fecha,
                pesos: primerReporte.dato1 ?? 0,
                coin: (ultimoReporte.dato2 ?? 0) - (primerReporte.dato2 ?? 0),
                premios: (ultimoReporte.dato3 ?? 0) - (primerReporte.dato3 ?? 0),
                banco: primerReporte.dato4 ?? 0
            };
        }
    });

    console.log("Cierres Diarios (agrupados por fecha):", datosDiarios);
}

function calcularCierreSemanalDesdeFecha(fechaInicio, deviceId) {
    if (!fechaInicio) {
        console.error("Fecha de inicio no proporcionada.");
        return;
    }

    const fechaFin = new Date(fechaInicio);
    fechaFin.setDate(fechaFin.getDate() + 6);

    fetch(`/esp32_project/get_report.php?device_id=${deviceId}&fechaInicio=${fechaInicio.toISOString().split('T')[0]}&fechaFin=${fechaFin.toISOString().split('T')[0]}`)
        .then(response => response.json())
        .then(data => {
            if (!data || data.error || !Array.isArray(data.reports)) {
                console.error("Error en los datos de la base de datos:", data.error);
                return;
            }

            if (data.reports.length === 0) {
                console.warn("No se encontraron reportes para el rango de fechas especificado.");
                return;
            }

            let cierreSemanal;

            if (data.reports.length === 1) {
                // Si hay un solo reporte en la semana, mostrarlo tal cual
                const unicoReporte = data.reports[0];
                cierreSemanal = {
                    fecha: `Semana del ${fechaInicio.toLocaleDateString()}`,
                    pesos: unicoReporte.dato1 ?? 0,
                    coin: unicoReporte.dato2 ?? 0,
                    premios: unicoReporte.dato3 ?? 0,
                    banco: unicoReporte.dato4 ?? 0
                };
            } else {
                // Ordenar reportes por fecha ascendente
                data.reports.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

                const primerReporte = data.reports[0];
                const ultimoReporte = data.reports[data.reports.length - 1];

                console.log(`Calculando cierre semanal para la semana del ${fechaInicio.toLocaleDateString()} al ${fechaFin.toLocaleDateString()}`);
                console.log("Primer reporte de la semana:", primerReporte);
                console.log("Último reporte de la semana:", ultimoReporte);

                const pesos = Number(ultimoReporte.dato1 ?? 0);
                const coin = Number(ultimoReporte.dato2 ?? 0) - Number(primerReporte.dato2 ?? 0);
                const premios = Number(ultimoReporte.dato3 ?? 0) - Number(primerReporte.dato3 ?? 0);
                const banco = Number(ultimoReporte.dato4 ?? 0);

                console.log(`Pesos calculados: ${pesos}`);
                console.log(`Coin calculado: ${coin}`);
                console.log(`Premios calculados: ${premios}`);
                console.log(`Banco calculado: ${banco}`);

                cierreSemanal = {
                    fecha: `Semana del ${fechaInicio.toLocaleDateString()}`,
                    pesos: pesos,
                    coin: coin,
                    premios: premios,
                    banco: banco
                };
            }

            datosSemanales.push(cierreSemanal);
            cargarTabla('tabla-semanales', datosSemanales, ['fecha', 'pesos', 'coin', 'premios', 'banco']);
        })
        .catch(error => console.error("Error al obtener el cierre semanal:", error));
}

function calcularCierreMensual(fechaInicio, deviceId) {
    if (!fechaInicio) {
        console.error("Fecha de inicio no proporcionada.");
        return;
    }

    const inicioMes = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), 1);
    const finMes = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + 1, 0, 23, 59, 59);

    fetch(`/esp32_project/get_report.php?device_id=${deviceId}&fechaInicio=${inicioMes.toISOString().split('T')[0]}&fechaFin=${finMes.toISOString().split('T')[0]}`)
        .then(response => response.json())
        .then(data => {
            if (!data || data.error || !Array.isArray(data.reports)) {
                console.error("Error en los datos de la base de datos:", data.error);
                return;
            }

            if (data.reports.length === 0) {
                console.warn("No se encontraron reportes para el rango de fechas especificado.");
                return;
            }

            let cierreMensual;

            if (data.reports.length === 1) {
                // Si hay un solo reporte en el mes, mostrarlo tal cual
                const unicoReporte = data.reports[0];
                cierreMensual = {
                    fecha: `${inicioMes.toLocaleDateString()} - ${finMes.toLocaleDateString()}`,
                    pesos: unicoReporte.dato1 ?? 0,
                    coin: unicoReporte.dato2 ?? 0,
                    premios: unicoReporte.dato3 ?? 0,
                    banco: unicoReporte.dato4 ?? 0
                };
            } else {
                // Ordenar reportes por fecha ascendente
                data.reports.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

                const primerReporte = data.reports[0];
                const ultimoReporte = data.reports[data.reports.length - 1];

                console.log(`Calculando cierre mensual para el mes de ${inicioMes.toLocaleDateString()} a ${finMes.toLocaleDateString()}`);
                console.log("Primer reporte del mes:", primerReporte);
                console.log("Último reporte del mes:", ultimoReporte);

                const pesos = Number(ultimoReporte.dato1 ?? 0);
                const coin = Number(ultimoReporte.dato2 ?? 0) - Number(primerReporte.dato2 ?? 0);
                const premios = Number(ultimoReporte.dato3 ?? 0) - Number(primerReporte.dato3 ?? 0);
                const banco = Number(ultimoReporte.dato4 ?? 0);

                console.log(`Pesos calculados: ${pesos}`);
                console.log(`Coin calculado: ${coin}`);
                console.log(`Premios calculados: ${premios}`);
                console.log(`Banco calculado: ${banco}`);

                cierreMensual = {
                    fecha: `${inicioMes.toLocaleDateString()} - ${finMes.toLocaleDateString()}`,
                    pesos: pesos,
                    coin: coin,
                    premios: premios,
                    banco: banco
                };
            }

            datosMensuales.push(cierreMensual);
            cargarTabla('tabla-mensuales', datosMensuales, ['fecha', 'pesos', 'coin', 'premios', 'banco']);
        })
        .catch(error => console.error("Error al obtener el cierre mensual:", error));
}

function cargarTabla(idTabla, datos, columnas) {
    const tbody = document.getElementById(idTabla)?.querySelector("tbody");
    if (!tbody) {
        console.warn(`Elemento con id ${idTabla} no encontrado en el DOM.`);
        return;
    }
    tbody.innerHTML = "";

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

function mostrarSeccion(seccion) {
    const secciones = document.querySelectorAll(".seccion");
    secciones.forEach((s) => s.classList.remove("active"));
    document.getElementById(seccion).classList.add("active");

    if (seccion === 'graficas' && !graficasCargadas.comparativa) {
        generarGraficaDiarias(datosDiarios);
        generarGraficaSemanales(datosSemanales);
        generarGraficaMensuales(datosMensuales);
        generarGraficaComparativa(datosMensuales);
        graficasCargadas.comparativa = true;
    }
}

function generarGraficaDiarias(datos) {
    const ctx = document.getElementById('grafica-ganancias-diarias').getContext('2d');
    const etiquetas = datos.map(d => d.fecha);
    const ganancias = datos.map(d => d.pesos);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: etiquetas,
            datasets: [{
                label: 'Ganancias Diarias',
                data: ganancias,
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
    const etiquetas = datos.map(d => d.fecha);
    const ganancias = datos.map(d => d.pesos);
    
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
    const etiquetas = datos.map(d => d.fecha);
    const ganancias = datos.map(d => d.pesos);
    
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
    const etiquetas = datos.map(d => d.fecha);
    const ganancias = datos.map(d => d.pesos);
    const perdidas = datos.map(d => d.perdidas || 0);
    
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