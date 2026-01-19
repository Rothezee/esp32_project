// Objeto para rastrear qué datos ya se han cargado
const datosCargados = {
    reportes: false,
    diarios: false,
    semanales: false,
    mensuales: false,
    graficas: false
};

let device_id; // Variable global para el ID del dispositivo

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM completamente cargado y parseado");

    const urlParams = new URLSearchParams(window.location.search);
    device_id = urlParams.get('device_id'); // Asignar a la variable global
    const machineName = document.getElementById('machine_name');

    if (machineName) {
        machineName.innerText = `Machine ${device_id}`;
    } else {
        console.warn("Elemento con id 'machine_name' no encontrado en el DOM.");
    }

    if (!device_id) { // Corregido el nombre de la variable
        console.error("El device_id es requerido.");
        return;
    }

    // Envolver la tabla de diarios en un contenedor con scroll si existe
    const tablaDiarios = document.getElementById('tabla-diarios');
    if (tablaDiarios && !tablaDiarios.parentElement.classList.contains('table-container')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-container';
        tablaDiarios.parentNode.insertBefore(wrapper, tablaDiarios);
        wrapper.appendChild(tablaDiarios);
    }

    // Configurar los clics del menú para usar la nueva función mostrarSeccion
    document.querySelectorAll('.navbar-nav a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            mostrarSeccion(this.getAttribute('href').substring(1));
        });
    });
 
    // Aplicar estilos para scroll horizontal en contenedores de tablas
    const style = document.createElement('style');
    style.innerHTML = `.table-container { overflow-x: auto; -webkit-overflow-scrolling: touch; }`;
    document.head.appendChild(style);

    // Hacer las tablas desplazables horizontalmente con el mouse
    const containers = document.querySelectorAll(".table-container");
    containers.forEach(container => {
        let isDown = false;
        let startX;
        let scrollLeft;

        container.addEventListener("mousedown", (e) => {
            isDown = true;
            container.classList.add("active");
            startX = e.pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
        });

        container.addEventListener("mouseleave", () => {
            isDown = false;
        });

        container.addEventListener("mouseup", () => {
            isDown = false;
        });

        container.addEventListener("mousemove", (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - container.offsetLeft;
            const walk = (x - startX) * 2; // Ajusta la velocidad del desplazamiento
            container.scrollLeft = scrollLeft - walk;
        });
    });

    // Mostrar la sección inicial por defecto y cargar sus datos
    mostrarSeccion('reportes');
});

function cargarReportes() {
    if (datosCargados.reportes) return; // No volver a cargar

    fetch(`/esp32_project/expendedora/get_report_expendedora.php?device_id=${device_id}`)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            console.log("Datos recibidos de reportes:", data);
            if (data.error) {
                console.error(data.error);
                return;
            }

            if (data.reports && Array.isArray(data.reports)) {
                const reversedReports = data.reports.reverse();
                cargarTabla('report_table', reversedReports, ['timestamp', 'dato1', 'dato2']);
                datosCargados.reportes = true; // Marcar como cargado
            } else {
                console.warn('No se recibieron reportes válidos.');
            }
        })
        .catch(error => {
            console.error("Error al obtener los datos de reportes:", error);
        });
}

function cargarCierresDiarios() {
    if (datosCargados.diarios) return; // No volver a cargar

    const fetchCierres = fetch(`/esp32_project/expendedora/get_close_expendedora.php?id_expendedora=${device_id}`).then(res => res.json());
    const fetchSubcierres = fetch(`/esp32_project/expendedora/get_subcierre_expendedora.php?id_expendedora=${device_id}`).then(res => res.json());

    Promise.all([fetchCierres, fetchSubcierres])
        .then(([cierresData, subcierresData]) => {
            console.log("Datos de cierres:", cierresData);
            console.log("Datos de subcierres:", subcierresData);

            const cierres = (cierresData.reports && Array.isArray(cierresData.reports)) ? cierresData.reports : [];
            // Intentar obtener subcierres de 'partial_reports' o 'reports' por si cambia la estructura del JSON
            const subcierres = (subcierresData && subcierresData.partial_reports && Array.isArray(subcierresData.partial_reports)) ? subcierresData.partial_reports : 
                               (subcierresData && subcierresData.reports && Array.isArray(subcierresData.reports)) ? subcierresData.reports : [];

            if (cierresData.error) {
                console.error("Error en cierres:", cierresData.error);
            }
            if (subcierresData.error) {
                console.error("Error en subcierres:", subcierresData.error);
            }

            fusionarYRenderizarDatos(cierres, subcierres);
            datosCargados.diarios = true; // Marcar como cargado
        })
        .catch(error => console.error("Error al obtener datos de cierres o subcierres:", error));
}

function cargarSemanales() {
    if (datosCargados.semanales) return; // No volver a cargar
    console.log("Cargando datos semanales...");
    // Aquí iría la lógica para cargar los datos semanales.
    // Por ahora, solo inicializamos el selector de fecha.
    datosCargados.semanales = true;
}
function createCell(text) {
    const cell = document.createElement('td');
    cell.textContent = text;
    return cell;
}

function createHeaderCell(text) {
    const cell = document.createElement('th');
    cell.textContent = text;
    return cell;
}

function createButton(fecha) {
    const button = document.createElement('button');
    button.id = `btn-${fecha}`;
    button.textContent = 'Extender';
    button.onclick = () => toggleParciales(fecha);
    return button;
}

function createRow(cells) {
    const row = document.createElement('tr');
    cells.forEach(cell => row.appendChild(cell));
    return row;
}
function fusionarYRenderizarDatos(cierres, subcierres) {
    const tablaDiariosBody = document.querySelector('#tabla-diarios tbody');
    if (!tablaDiariosBody) {
        console.error("No se encontró el tbody de #tabla-diarios");
        return;
    }
    tablaDiariosBody.innerHTML = '';

    const datosAgrupados = {};

    // 1. Procesar cierres diarios
    cierres.forEach(cierre => {
        // Añadir validación para asegurar que el timestamp existe
        if (cierre && typeof cierre.timestamp === 'string') {
            const fecha = cierre.timestamp.split(' ')[0];
            if (!datosAgrupados[fecha]) {
                datosAgrupados[fecha] = { cierre: null, subcierres: [] };
            }
            datosAgrupados[fecha].cierre = cierre;
        }
    });

    // 2. Procesar subcierres
    subcierres.forEach(subcierre => {
        // Validación clave para evitar el error
        const fechaStr = subcierre.created_at || subcierre.timestamp || subcierre.fecha;
        if (subcierre && typeof fechaStr === 'string') {
            const fecha = fechaStr.split(' ')[0];
            if (!datosAgrupados[fecha]) {
                // Si no hay cierre para esta fecha, creamos una entrada
                datosAgrupados[fecha] = { cierre: null, subcierres: [] };
            }
            datosAgrupados[fecha].subcierres.push(subcierre);
        }
    });

    // 3. Renderizar la tabla
    const fechasOrdenadas = Object.keys(datosAgrupados).sort((a, b) => new Date(b) - new Date(a)); // De más reciente a más antiguo

    fechasOrdenadas.forEach(fecha => {
        const { cierre, subcierres: subcierresDelDia } = datosAgrupados[fecha];

        // Crear la fila del cierre (real o fantasma)
        const filaCierre = document.createElement('tr');
        const cierreData = cierre || { timestamp: `${fecha} (Sin cierre)`, fichas: 0, dinero: 0, p1: 0, p2: 0, p3: 0, fichas_devolucion: 0, fichas_normales: 0, fichas_promocion: 0 };

        const buttonCell = document.createElement('td');
        const button = createButton(fecha);
        buttonCell.appendChild(button);

        filaCierre.appendChild(createCell(cierreData.timestamp));
        filaCierre.appendChild(createCell(cierreData.fichas));
        filaCierre.appendChild(createCell(cierreData.dinero));
        filaCierre.appendChild(createCell(cierreData.p1));
        filaCierre.appendChild(createCell(cierreData.p2));
        filaCierre.appendChild(createCell(cierreData.p3));
        filaCierre.appendChild(createCell(cierreData.fichas_devolucion));
        filaCierre.appendChild(createCell(cierreData.fichas_normales));
        filaCierre.appendChild(createCell(cierreData.fichas_promocion));
        filaCierre.appendChild(buttonCell);

        tablaDiariosBody.appendChild(filaCierre);

        // Crear la fila oculta para los subcierres
        const filaParciales = document.createElement("tr");
        filaParciales.id = `parciales-${fecha}`;
        filaParciales.style.display = "none";

        const cellParciales = document.createElement('td');
        cellParciales.colSpan = 10; // Corregido: La tabla padre tiene 10 columnas, no 7.

        const containerDiv = document.createElement('div');
        containerDiv.className = 'table-container';
        containerDiv.id = `scroll-container-parciales-${fecha}`;

        const subTable = document.createElement('table');
        const subTableHead = document.createElement('thead');
        const subTableBody = document.createElement('tbody');
        subTableBody.id = `subcierres-${fecha}`;

        const headerRow = createRow([
            createHeaderCell('Fecha'), createHeaderCell('Fichas'), createHeaderCell('Dinero'),
            createHeaderCell('P1'), createHeaderCell('P2'), createHeaderCell('P3'), createHeaderCell('Fichas Devolución'), 
            createHeaderCell('Fichas Normales'), createHeaderCell('Fichas Promocion'),
            createHeaderCell('Empleado')
        ]);

        subTableHead.appendChild(headerRow);
        subTable.appendChild(subTableHead);
        subTable.appendChild(subTableBody);
        containerDiv.appendChild(subTable);
        cellParciales.appendChild(containerDiv);
        filaParciales.appendChild(cellParciales);
        tablaDiariosBody.appendChild(filaParciales);

        // Llenar la tabla de subcierres
        if (subcierresDelDia.length > 0) {
            // Ordenar subcierres por fecha para consistencia
            subcierresDelDia.sort((a, b) => new Date(a.created_at || a.timestamp || a.fecha) - new Date(b.created_at || b.timestamp || b.fecha));

            subcierresDelDia.forEach(parcial => {
                // Función auxiliar para obtener valor con o sin prefijo 'partial_'
                const getVal = (key) => parcial[`partial_${key}`] !== undefined ? parcial[`partial_${key}`] : (parcial[key] !== undefined ? parcial[key] : 0);

                const filaParcial = createRow([
                    createCell(parcial.created_at || parcial.timestamp || parcial.fecha), createCell(getVal('partial_fichas')), createCell(getVal('partial_dinero')),
                    createCell(getVal('partial_p1')), createCell(getVal('partial_p2')), createCell(getVal('partial_p3')),
                    createCell(getVal('partial_devolucion')), // Agregado para alinear con header
                    createCell(getVal('partial_normales')),   // Agregado para alinear con header
                    createCell(getVal('partial_promocion')),  // Agregado para alinear con header
                    createCell(parcial.employee_id || parcial.empleado || '')
                ]);
                subTableBody.appendChild(filaParcial);
            });
        } else {
            // Si no hay subcierres, pero hay un cierre, el botón "Extender" no debería hacer nada
            // o mostrar un mensaje. Podemos deshabilitar el botón.
            button.disabled = true;
            button.innerText = "No hay";
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
    // Ocultar todas las secciones y quitar la clase 'active' de los links del menú
    const secciones = document.querySelectorAll(".seccion");
    secciones.forEach((s) => s.classList.remove("active"));
    document.querySelectorAll('.navbar-nav li').forEach(li => li.classList.remove('active'));

    // Mostrar la sección activa y marcar el link del menú como activo
    const seccionActiva = document.getElementById(seccionId);
    if (seccionActiva) {
        seccionActiva.classList.add("active");
        const linkActivo = document.querySelector(`a[href="#${seccionId}"]`);
        if (linkActivo) {
            linkActivo.parentElement.classList.add('active');
        }

        // Cargar los datos correspondientes a la sección si no se han cargado
        if (seccionId === 'reportes') {
            cargarReportes();
        } else if (seccionId === 'diarios') {
            cargarCierresDiarios();
        } else if (seccionId === 'semanales') {
            cargarSemanales();
        }

    } else {
        console.error(`Sección con id ${seccionId} no encontrada.`);
    }
}

// Inicializar Flatpickr para el selector de inicio de semana
flatpickr("#selector-inicio-semana", {
    dateFormat: "Y-m-d",
    onClose: function(selectedDates) {
        if (selectedDates.length === 1) {
            // Aquí iría la lógica para calcular y mostrar el cierre semanal
            console.log("Fecha semanal seleccionada:", selectedDates[0]);
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
            // Aquí iría la lógica para calcular y mostrar el cierre mensual
            console.log("Mes seleccionado:", selectedDates[0]);
        }
    }
});
