document.addEventListener("DOMContentLoaded", function() {
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

    // Obtener cierres diarios
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
                cargarTabla('tabla-diarios', data.reports, ['timestamp', 'fichas', 'dinero', 'p1', 'p2', 'p3']);
            } else {
                console.warn('No se recibieron cierres diarios válidos.');
            }
        })
        .catch(error => {
            console.error("Error al obtener los datos de cierres diarios:", error);
        });
});

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
