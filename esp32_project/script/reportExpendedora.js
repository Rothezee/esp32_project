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
    if (datosCargados.diarios) return;

    const fetchCierres = fetch(`/esp32_project/expendedora/get_close_expendedora.php?id_expendedora=${device_id}`)
        .then(res => {
            if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
            return res.json();
        })
        .catch(err => {
            console.error("Error al obtener cierres:", err);
            return { reports: [], error: err.message };
        });

    const fetchSubcierres = fetch(`/esp32_project/expendedora/get_subcierre_expendedora.php?id_expendedora=${device_id}`)
        .then(res => {
            if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
            return res.json();
        })
        .catch(err => {
            console.error("Error al obtener subcierres:", err);
            return { partial_reports: [], error: err.message };
        });

    Promise.all([fetchCierres, fetchSubcierres])
        .then(([cierresData, subcierresData]) => {
            console.log("Datos de cierres:", cierresData);
            console.log("Datos de subcierres:", subcierresData);

            // Validación robusta con logs de debugging
            const cierres = (cierresData?.reports && Array.isArray(cierresData.reports)) 
                ? cierresData.reports 
                : [];

            // Intenta múltiples estructuras posibles de la respuesta
            let subcierres = [];
            if (subcierresData?.partial_reports && Array.isArray(subcierresData.partial_reports)) {
                subcierres = subcierresData.partial_reports;
            } else if (subcierresData?.reports && Array.isArray(subcierresData.reports)) {
                subcierres = subcierresData.reports;
            } else if (Array.isArray(subcierresData)) {
                // Por si el PHP devuelve directamente un array
                subcierres = subcierresData;
            }

            console.log(`Procesando ${cierres.length} cierres y ${subcierres.length} subcierres`);

            if (cierresData?.error) {
                console.error("Error en API de cierres:", cierresData.error);
            }
            if (subcierresData?.error) {
                console.error("Error en API de subcierres:", subcierresData.error);
            }

            fusionarYRenderizarDatos(cierres, subcierres);
            datosCargados.diarios = true;
        })
        .catch(error => {
            console.error("Error crítico en Promise.all:", error);
            // Renderizar aunque sea con datos vacíos
            fusionarYRenderizarDatos([], []);
        });
}

function fusionarYRenderizarDatos(cierres, subcierres) {
    const tablaDiariosBody = document.querySelector('#tabla-diarios tbody');
    if (!tablaDiariosBody) {
        console.error("No se encontró el tbody de #tabla-diarios");
        return;
    }
    tablaDiariosBody.innerHTML = '';

    const datosAgrupados = {};

    // 1. Procesar cierres diarios con validación
    cierres.forEach(cierre => {
        if (!cierre || typeof cierre !== 'object') {
            console.warn("Cierre inválido:", cierre);
            return;
        }

        const timestampStr = cierre.timestamp || cierre.created_at || cierre.fecha;
        if (typeof timestampStr === 'string' && timestampStr.trim() !== '') {
            const fecha = timestampStr.split(' ')[0];
            if (!datosAgrupados[fecha]) {
                datosAgrupados[fecha] = { cierre: null, subcierres: [] };
            }
            datosAgrupados[fecha].cierre = cierre;
        } else {
            console.warn("Cierre sin timestamp válido:", cierre);
        }
    });

    // 2. Procesar subcierres con validación
    subcierres.forEach(subcierre => {
        if (!subcierre || typeof subcierre !== 'object') {
            console.warn("Subcierre inválido:", subcierre);
            return;
        }

        const fechaStr = subcierre.created_at || subcierre.timestamp || subcierre.fecha;
        if (typeof fechaStr === 'string' && fechaStr.trim() !== '') {
            const fecha = fechaStr.split(' ')[0];
            if (!datosAgrupados[fecha]) {
                datosAgrupados[fecha] = { cierre: null, subcierres: [] };
            }
            datosAgrupados[fecha].subcierres.push(subcierre);
        } else {
            console.warn("Subcierre sin timestamp válido:", subcierre);
        }
    });

    // 3. Renderizar la tabla
    const fechasOrdenadas = Object.keys(datosAgrupados).sort((a, b) => new Date(b) - new Date(a));

    fechasOrdenadas.forEach(fecha => {
        const { cierre, subcierres: subcierresDelDia } = datosAgrupados[fecha];

        // Crear la fila del cierre (real o fantasma)
        const filaCierre = document.createElement('tr');
        const cierreData = cierre || { 
            timestamp: `${fecha} (Sin cierre)`, 
            fichas: 0, 
            dinero: 0, 
            p1: 0, 
            p2: 0, 
            p3: 0, 
            fichas_devolucion: 0, 
            fichas_normales: 0, 
            fichas_promocion: 0 
        };

        const buttonCell = document.createElement('td');
        const button = createButton(fecha);
        buttonCell.appendChild(button);

        filaCierre.appendChild(createCell(cierreData.timestamp));
        filaCierre.appendChild(createCell(cierreData.fichas || 0));
        filaCierre.appendChild(createCell(cierreData.dinero || 0));
        filaCierre.appendChild(createCell(cierreData.p1 || 0));
        filaCierre.appendChild(createCell(cierreData.p2 || 0));
        filaCierre.appendChild(createCell(cierreData.p3 || 0));
        filaCierre.appendChild(createCell(cierreData.fichas_devolucion || 0));
        filaCierre.appendChild(createCell(cierreData.fichas_normales || 0));
        filaCierre.appendChild(createCell(cierreData.fichas_promocion || 0));
        filaCierre.appendChild(buttonCell);

        tablaDiariosBody.appendChild(filaCierre);

        // Crear la fila oculta para los subcierres
        const filaParciales = document.createElement("tr");
        filaParciales.id = `parciales-${fecha}`;
        filaParciales.style.display = "none";

        const cellParciales = document.createElement('td');
        cellParciales.colSpan = 10;

        const containerDiv = document.createElement('div');
        containerDiv.className = 'table-container';
        containerDiv.id = `scroll-container-parciales-${fecha}`;

        const subTable = document.createElement('table');
        const subTableHead = document.createElement('thead');
        const subTableBody = document.createElement('tbody');
        subTableBody.id = `subcierres-${fecha}`;

        const headerRow = createRow([
            createHeaderCell('Fecha'), createHeaderCell('Fichas'), createHeaderCell('Dinero'),
            createHeaderCell('P1'), createHeaderCell('P2'), createHeaderCell('P3'), 
            createHeaderCell('Fichas Devolución'), 
            createHeaderCell('Fichas Normales'), 
            createHeaderCell('Fichas Promocion'),
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
            subcierresDelDia.sort((a, b) => {
                const fechaA = a.created_at || a.timestamp || a.fecha || '';
                const fechaB = b.created_at || b.timestamp || b.fecha || '';
                return new Date(fechaA) - new Date(fechaB);
            });

            subcierresDelDia.forEach(parcial => {
                // CORRECCIÓN CRÍTICA: Función getVal corregida
                const getVal = (key) => {
                    // Primero intenta con el prefijo 'partial_'
                    if (parcial[`partial_${key}`] !== undefined) {
                        return parcial[`partial_${key}`];
                    }
                    // Luego intenta sin prefijo
                    if (parcial[key] !== undefined) {
                        return parcial[key];
                    }
                    // Por defecto devuelve 0
                    return 0;
                };

                const filaParcial = createRow([
                    createCell(parcial.created_at || parcial.timestamp || parcial.fecha || ''), 
                    createCell(getVal('fichas')),  // ← CORREGIDO: sin 'partial_'
                    createCell(getVal('dinero')),
                    createCell(getVal('p1')), 
                    createCell(getVal('p2')), 
                    createCell(getVal('p3')),
                    createCell(getVal('devolucion')),
                    createCell(getVal('normales')),
                    createCell(getVal('promocion')),
                    createCell(parcial.employee_id || parcial.empleado || '')
                ]);
                subTableBody.appendChild(filaParcial);
            });
        } else {
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
