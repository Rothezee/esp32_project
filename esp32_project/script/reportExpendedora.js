document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM completamente cargado y parseado");

    const urlParams = new URLSearchParams(window.location.search);
    const device_id = urlParams.get('device_id');
    const machineName = document.getElementById('machine_name');
    
    if (machineName) {
        machineName.innerText = `Machine ${device_id}`;
    } else {
        console.warn("Elemento con id 'machine_name' no encontrado en el DOM.");
    }

    if (!device_id) {
        console.error("El id_expendedora es requerido.");
        return;
    }

    // Obtener reportes
    fetch(`/esp32_project/expendedora/get_report_expendedora.php?device_id=${device_id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Datos recibidos de reportes:", data);

            if (data.error) {
                console.error(data.error);
                return;
            }

            if (data.reports && Array.isArray(data.reports)) {
                // Invertir el array de reportes para mostrar el más reciente en la cima
                const reversedReports = data.reports.reverse();
                cargarTabla('report_table', reversedReports, ['timestamp', 'dato1', 'dato2']);
            } else {
                console.warn('No se recibieron reportes válidos.');
            }
        })
        .catch(error => {
            console.error("Error al obtener los datos de reportes:", error);
        });

    // Obtener datos de cierres diarios
    fetch(`/esp32_project/expendedora/get_close_expendedora.php?id_expendedora=${device_id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Datos recibidos de cierres diarios:", data);

            if (data.error) {
                console.error(data.error);
                return;
            }

            if (data.reports && Array.isArray(data.reports)) {
                cargarTablaDiarios('tabla-diarios', data.reports);
            } else {
                console.warn('No se recibieron cierres diarios válidos.');
            }
        })
        .catch(error => {
            console.error("Error al obtener los datos de cierres diarios:", error);
        });

    // Obtener datos de subcierres
    fetch(`/esp32_project/expendedora/get_subcierre_expendedora.php?id_expendedora=${device_id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Datos recibidos de subcierres:", data);

            if (data.error) {
                console.error(data.error);
                return;
            }

            if (data.partial_reports && Array.isArray(data.partial_reports)) {
                cargarTablaSubcierres(data.partial_reports);
            } else {
                console.warn('No se recibieron subcierres válidos.');
            }
        })
        .catch(error => {
            console.error("Error al obtener los datos de subcierres:", error);
        });
});

function cargarTablaDiarios(tablaId, reports) {
    const tabla = document.getElementById(tablaId).querySelector('tbody');
    tabla.innerHTML = ''; // Limpiar la tabla

    console.log("Cargando cierres diarios en la tabla:", reports);

    reports.forEach(report => {
        const fecha = report.timestamp.split(' ')[0]; // Obtener solo la fecha de timestamp
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${report.timestamp}</td>
            <td>${report.fichas}</td>
            <td>${report.dinero}</td>
            <td>${report.p1}</td>
            <td>${report.p2}</td>
            <td>${report.p3}</td>
            <td><button id="btn-${fecha}" onclick="toggleParciales('${fecha}')">Extender</button></td>
        `;
        tabla.appendChild(fila);

        // Crear una fila para los cierres parciales
        const filaParciales = document.createElement("tr");
        filaParciales.id = `parciales-${fecha}`;
        filaParciales.style.display = "none";
        filaParciales.innerHTML = `
            <td colspan="7">
                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Fichas</th>
                            <th>Dinero</th>
                            <th>P1</th>
                            <th>P2</th>
                            <th>P3</th>
                            <th>Empleado</th>
                            <th>Creado</th>
                            <th>Actualizado</th>
                        </tr>
                    </thead>
                    <tbody id="subcierres-${fecha}">
                        <!-- Subcierres se cargarán aquí -->
                    </tbody>
                </table>
            </td>
        `;
        tabla.appendChild(filaParciales);
    });
}

function cargarTablaSubcierres(partialReports) {
    console.log("Cargando subcierres en la tabla:", partialReports);

    partialReports.forEach(parcial => {
        const fecha = parcial.updated_at.split(' ')[0]; // Obtener solo la fecha de updated_at
        const subcierresTabla = document.getElementById(`subcierres-${fecha}`);
        if (subcierresTabla) {
            const filaParcial = document.createElement('tr');
            filaParcial.innerHTML = `
                <td>${parcial.created_at}</td>
                <td>${parcial.partial_fichas}</td>
                <td>${parcial.partial_dinero}</td>
                <td>${parcial.partial_p1}</td>
                <td>${parcial.partial_p2}</td>
                <td>${parcial.partial_p3}</td>
                <td>${parcial.employee_id}</td>
                <td>${parcial.created_at}</td>
                <td>${parcial.updated_at}</td>
            `;
            subcierresTabla.appendChild(filaParcial);
        } else {
            console.warn(`No se encontró la tabla para subcierres con fecha: ${fecha}`);
        }
    });
}

function toggleParciales(fecha) {
    const filaParciales = document.getElementById(`parciales-${fecha}`);
    if (filaParciales) {
        filaParciales.style.display = filaParciales.style.display === "none" ? "table-row" : "none";
    }
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

// Función para mostrar secciones
function mostrarSeccion(seccionId) {
    const secciones = document.querySelectorAll('.seccion');
    secciones.forEach(seccion => {
        seccion.style.display = 'none';
    });

    const seccion = document.getElementById(seccionId);
    if (seccion) {
        seccion.style.display = 'block';
    } else {
        console.error(`Sección con id ${seccionId} no encontrada.`);
    }
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
