/**
 * report.js — Reportes de Máquina
 *
 * BUGS CORREGIDOS vs versión anterior:
 *  1. Cierre diario 1 reporte → coin y premios = 0 (no hay delta calculable)
 *  2. Sort de timestamps MySQL ("YYYY-MM-DD HH:MM:SS") con replace ' '→'T'
 *     para evitar parsing inconsistente de new Date()
 *  3. Diferencias negativas → 0 (contador reseteado, no mostrar negativo)
 *  4. URL relativa en lugar de /esp32_project/ hardcodeado
 *  5. Gráficas realmente llamadas al mostrar la sección
 *  6. Race condition diarios: reintento si allReports todavía no cargó
 *  7. Gráfica comparativa usa datos reales (coin vs premios vs pesos)
 *  8. Color coding en tablas (verde/rojo relativo al promedio del período)
 */

/* ══════════════════════════════════════════════════
   ESTADO GLOBAL
══════════════════════════════════════════════════ */
const datosCargados = {
    reportes:  false,
    diarios:   false,
};

let datosDiarios   = [];
let datosSemanales = [];
let datosMensuales = [];
let deviceId       = null;
let allReports     = [];

// Instancias de Chart.js activas (para destruirlas antes de re-renderizar)
const charts = {};

/* ══════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
    const params = new URLSearchParams(window.location.search);
    deviceId = params.get('device_id');

    if (!deviceId) {
        console.error('device_id requerido en la URL');
        return;
    }

    // Selector de semana con flatpickr
    flatpickr('#selector-inicio-semana', {
        dateFormat: 'Y-m-d',
        locale: 'es',
        onClose(selectedDates) {
            if (selectedDates.length === 1) {
                calcularCierreSemanal(selectedDates[0]);
            }
        }
    });

    // Selector de mes nativo (input type="month")
    const selectorMes = document.getElementById('selector-inicio-mes');
    if (selectorMes) {
        selectorMes.addEventListener('change', function () {
            if (!this.value) return;
            const [y, m] = this.value.split('-').map(Number);
            calcularCierreMensual(new Date(y, m - 1, 1));
        });
    }

    // Clicks de la barra de navegación
    document.querySelectorAll('.navbar-nav a[href^="#"]').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            mostrarSeccion(this.getAttribute('href').substring(1));
        });
    });

    mostrarSeccion('reportes');
});

/* ══════════════════════════════════════════════════
   HELPER: parsear timestamp MySQL → Date
   "2025-03-01 10:30:00" → new Date("2025-03-01T10:30:00")
   El espacio causa parsing inconsistente en algunos browsers.
══════════════════════════════════════════════════ */
function parseTS(ts) {
    if (!ts) return new Date(0);
    return new Date(ts.replace(' ', 'T'));
}

/* ══════════════════════════════════════════════════
   HELPER: diferencia segura
   Devuelve Math.max(0, b - a) para no mostrar negativos
   causados por resets de contador.
   Si b < a el contador fue reseteado → retorna 0.
══════════════════════════════════════════════════ */
function diffSafe(ultimo, primero) {
    const d = Number(ultimo ?? 0) - Number(primero ?? 0);
    return d >= 0 ? d : 0;
}

/* ══════════════════════════════════════════════════
   MOSTRAR SECCIÓN
══════════════════════════════════════════════════ */
function mostrarSeccion(seccionId) {
    document.querySelectorAll('.seccion').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.navbar-nav li').forEach(li => li.classList.remove('active'));

    const sec = document.getElementById(seccionId);
    if (!sec) return console.error(`Sección "${seccionId}" no encontrada`);
    sec.classList.add('active');

    // Tab link activo
    document.querySelectorAll('.tab-link').forEach(t => {
        const oc = t.getAttribute('onclick') || '';
        if (oc.includes(`'${seccionId}'`) || oc.includes(`"${seccionId}"`)) t.classList.add('active');
    });
    const navLink = document.querySelector(`.navbar-nav a[href="#${seccionId}"]`);
    if (navLink) navLink.parentElement.classList.add('active');

    // Cargar datos según sección
    switch (seccionId) {
        case 'reportes': cargarReportes(); break;
        case 'diarios':  cargarCierresDiarios(); break;
        case 'graficas': cargarGraficas(); break;
        // semanales y mensuales se cargan al elegir fecha
    }
}

/* ══════════════════════════════════════════════════
   CARGAR REPORTES (tabla raw)
══════════════════════════════════════════════════ */
function cargarReportes() {
    if (datosCargados.reportes) return;

    fetch(`get_report.php?device_id=${encodeURIComponent(deviceId)}`)
        .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
        .then(data => {
            if (data.error) return console.error('Error servidor:', data.error);

            allReports = (data.reports || []).sort(
                (a, b) => parseTS(a.timestamp) - parseTS(b.timestamp)
            );

            // Mostrar más reciente primero en la tabla
            cargarTabla('report_table',
                [...allReports].reverse(),
                ['id', 'timestamp', 'dato1', 'dato2', 'dato3', 'dato4']
            );
            datosCargados.reportes = true;
        })
        .catch(err => console.error('Error reportes:', err));
}

/* ══════════════════════════════════════════════════
   CIERRES DIARIOS
══════════════════════════════════════════════════ */
function cargarCierresDiarios() {
    if (datosCargados.diarios && datosDiarios.length > 0) {
        cargarTabla('tabla-diarios', datosDiarios,
            ['fecha', 'pesos', 'coin', 'premios', 'banco']);
        return;
    }

    // Si los reportes aún no se cargaron, cargarlos primero y reintentar
    if (allReports.length === 0) {
        if (!datosCargados.reportes) {
            fetch(`get_report.php?device_id=${encodeURIComponent(deviceId)}`)
                .then(r => r.json())
                .then(data => {
                    allReports = (data.reports || []).sort(
                        (a, b) => parseTS(a.timestamp) - parseTS(b.timestamp)
                    );
                    datosCargados.reportes = true;
                    _calcularYMostrarDiarios();
                })
                .catch(err => console.error('Error cargando reportes para diarios:', err));
        }
        return;
    }

    _calcularYMostrarDiarios();
}

function _calcularYMostrarDiarios() {
    calcularCierresDiarios(allReports);
    cargarTabla('tabla-diarios', datosDiarios,
        ['fecha', 'pesos', 'coin', 'premios', 'banco'],
        true /* colorCoding */);
    datosCargados.diarios = true;
}

function calcularCierresDiarios(reports) {
    const porDia = {};

    reports.forEach(r => {
        const fecha = r.timestamp.split(' ')[0]; // "2025-03-01"
        if (!porDia[fecha]) porDia[fecha] = [];
        porDia[fecha].push(r);
    });

    datosDiarios = Object.entries(porDia)
        .sort(([a], [b]) => b.localeCompare(a)) // más reciente primero
        .map(([fecha, reportesDelDia]) => {

            // Asegurar orden cronológico dentro del día
            reportesDelDia.sort((a, b) => parseTS(a.timestamp) - parseTS(b.timestamp));

            const primero = reportesDelDia[0];
            const ultimo  = reportesDelDia[reportesDelDia.length - 1];

            if (reportesDelDia.length === 1) {
                // Un solo reporte: no se puede calcular actividad del día
                // coin y premios = 0 (no hay delta)
                return {
                    fecha,
                    pesos:   Number(primero.dato1 ?? 0),
                    coin:    0,
                    premios: 0,
                    banco:   Number(primero.dato4 ?? 0),
                    _unico:  true
                };
            }

            return {
                fecha,
                pesos:   diffSafe(ultimo.dato1,  primero.dato1),
                coin:    diffSafe(ultimo.dato2,  primero.dato2),
                premios: diffSafe(ultimo.dato3,  primero.dato3),
                banco:   Number(ultimo.dato4 ?? 0),
                _unico:  false
            };
        });
}

/* ══════════════════════════════════════════════════
   CIERRES SEMANALES
══════════════════════════════════════════════════ */
function calcularCierreSemanal(fechaInicio) {
    const fechaFin = new Date(fechaInicio);
    fechaFin.setDate(fechaFin.getDate() + 6);

    const fi = fechaInicio.toISOString().split('T')[0];
    const ff = fechaFin.toISOString().split('T')[0];

    const label = `${formatFecha(fechaInicio)} – ${formatFecha(fechaFin)}`;

    fetch(`get_report.php?device_id=${encodeURIComponent(deviceId)}&fechaInicio=${fi}&fechaFin=${ff}`)
        .then(r => r.json())
        .then(data => {
            if (!data || data.error || !Array.isArray(data.reports)) {
                return console.error('Error datos semanales:', data?.error);
            }
            if (data.reports.length === 0) {
                mostrarAviso('tabla-semanales', 'Sin datos para ese rango de fechas.');
                return;
            }

            // SORT CORRECTO: reemplazar espacio por T antes de parsear
            data.reports.sort((a, b) => parseTS(a.timestamp) - parseTS(b.timestamp));

            const primero = data.reports[0];
            const ultimo  = data.reports[data.reports.length - 1];

            const cierre = data.reports.length === 1
                ? { fecha: label, pesos: Number(primero.dato1 ?? 0),
                    coin: 0, premios: 0, banco: Number(primero.dato4 ?? 0) }
                : { fecha: label,
                    pesos:   diffSafe(ultimo.dato1,  primero.dato1),
                    coin:    diffSafe(ultimo.dato2,  primero.dato2),
                    premios: diffSafe(ultimo.dato3,  primero.dato3),
                    banco:   Number(ultimo.dato4 ?? 0) };

            // Evitar duplicados si el usuario elige la misma semana dos veces
            const idx = datosSemanales.findIndex(s => s.fecha === label);
            if (idx >= 0) datosSemanales[idx] = cierre;
            else          datosSemanales.push(cierre);

            // Mantener orden cronológico
            datosSemanales.sort((a, b) => b.fecha.localeCompare(a.fecha)); // reciente primero

            cargarTabla('tabla-semanales', datosSemanales,
                ['fecha', 'pesos', 'coin', 'premios', 'banco'],
                true /* colorCoding */);
        })
        .catch(err => console.error('Error cierre semanal:', err));
}

/* ══════════════════════════════════════════════════
   CIERRES MENSUALES
══════════════════════════════════════════════════ */
function calcularCierreMensual(fechaInicio) {
    const inicio = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), 1);
    const fin    = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + 1, 0, 23, 59, 59);

    const fi = inicio.toISOString().split('T')[0];
    const ff = fin.toISOString().split('T')[0];

    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const label = `${meses[inicio.getMonth()]} ${inicio.getFullYear()}`;

    fetch(`get_report.php?device_id=${encodeURIComponent(deviceId)}&fechaInicio=${fi}&fechaFin=${ff}`)
        .then(r => r.json())
        .then(data => {
            if (!data || data.error || !Array.isArray(data.reports)) {
                return console.error('Error datos mensuales:', data?.error);
            }
            if (data.reports.length === 0) {
                mostrarAviso('tabla-mensuales', 'Sin datos para ese mes.');
                return;
            }

            data.reports.sort((a, b) => parseTS(a.timestamp) - parseTS(b.timestamp));

            const primero = data.reports[0];
            const ultimo  = data.reports[data.reports.length - 1];

            const cierre = data.reports.length === 1
                ? { fecha: label, pesos: Number(primero.dato1 ?? 0),
                    coin: 0, premios: 0, banco: Number(primero.dato4 ?? 0) }
                : { fecha: label,
                    pesos:   diffSafe(ultimo.dato1,  primero.dato1),
                    coin:    diffSafe(ultimo.dato2,  primero.dato2),
                    premios: diffSafe(ultimo.dato3,  primero.dato3),
                    banco:   Number(ultimo.dato4 ?? 0) };

            const idx = datosMensuales.findIndex(m => m.fecha === label);
            if (idx >= 0) datosMensuales[idx] = cierre;
            else          datosMensuales.push(cierre);

            datosMensuales.sort((a, b) => b.fecha.localeCompare(a.fecha)); // reciente primero

            cargarTabla('tabla-mensuales', datosMensuales,
                ['fecha', 'pesos', 'coin', 'premios', 'banco'],
                true /* colorCoding */);
        })
        .catch(err => console.error('Error cierre mensual:', err));
}

/* ══════════════════════════════════════════════════
   CARGAR TABLA
   colorCoding: pinta verde/rojo las filas según
   si el valor de 'coin' está por encima o por debajo
   del promedio del período mostrado.
══════════════════════════════════════════════════ */
function cargarTabla(idTabla, datos, columnas, colorCoding = false) {
    const tabla = document.getElementById(idTabla);
    const tbody = tabla?.querySelector('tbody');
    if (!tbody) return console.warn(`Tabla #${idTabla} no encontrada`);

    tbody.innerHTML = '';

    if (!datos || datos.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = columnas.length;
        td.textContent = 'Sin datos disponibles';
        td.className = 'table-empty';
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    // Calcular promedio de 'coin' para color coding
    let avgCoin = 0;
    if (colorCoding) {
        const vals = datos.map(d => Number(d.coin) || 0).filter(v => v > 0);
        avgCoin = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
    }

    datos.forEach(fila => {
        const tr = document.createElement('tr');

        if (colorCoding && !fila._unico) {
            const coin = Number(fila.coin) || 0;
            if (avgCoin > 0) {
                if (coin >= avgCoin * 1.1)      tr.classList.add('row-high');
                else if (coin <= avgCoin * 0.9) tr.classList.add('row-low');
            }
        }

        columnas.forEach(col => {
            const td = document.createElement('td');
            let val = fila[col];

            // Si solo había un reporte ese día, marcar coin/premios como "—"
            if (fila._unico && (col === 'coin' || col === 'premios')) {
                td.textContent = '—';
                td.title = 'Un solo registro ese día, sin delta calculable';
                td.style.color = 'var(--text-muted)';
            } else {
                td.textContent = val ?? '—';
            }

            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
}

/* ══════════════════════════════════════════════════
   GRÁFICAS
   Se cargan cuando el usuario va a la sección 'graficas'.
   Si los diarios aún no están calculados, los calcula primero.
══════════════════════════════════════════════════ */
function cargarGraficas() {
    // Si todavía no tenemos datos base, cargarlos y luego re-intentar
    if (allReports.length === 0) {
        fetch(`get_report.php?device_id=${encodeURIComponent(deviceId)}`)
            .then(r => r.json())
            .then(data => {
                allReports = (data.reports || []).sort(
                    (a, b) => parseTS(a.timestamp) - parseTS(b.timestamp)
                );
                datosCargados.reportes = true;
                if (datosDiarios.length === 0) calcularCierresDiarios(allReports);
                _renderGraficas();
            })
            .catch(err => console.error('Error cargando datos para gráficas:', err));
        return;
    }

    if (datosDiarios.length === 0) calcularCierresDiarios(allReports);
    _renderGraficas();
}

function _renderGraficas() {
    // Tomar los últimos 30 días para no saturar el gráfico
    const diasRecientes = datosDiarios.slice(-30);

    renderChart('grafica-ganancias-diarias',   graficaDiaria(diasRecientes));
    renderChart('grafica-ganancias-semanales', graficaSemanales());
    renderChart('grafica-ganancias-mensuales', graficaMensuales());
    renderChart('grafica-comparativa',         graficaComparativa(diasRecientes));
}

/* Destruye el chart anterior (si existe) y crea uno nuevo */
function renderChart(canvasId, config) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    if (charts[canvasId]) {
        charts[canvasId].destroy();
        delete charts[canvasId];
    }
    if (!config) return; // no data
    charts[canvasId] = new Chart(canvas.getContext('2d'), config);
}

/* ── Paleta compartida ── */
const C = {
    blue:       'rgb(59,130,246)',
    blueDim:    'rgba(59,130,246,0.15)',
    green:      'rgb(16,185,129)',
    greenDim:   'rgba(16,185,129,0.15)',
    amber:      'rgb(245,158,11)',
    amberDim:   'rgba(245,158,11,0.15)',
    red:        'rgb(244,63,94)',
    redDim:     'rgba(244,63,94,0.15)',
    muted:      '#3d506b',
    text:       '#8896b3',
    gridLine:   'rgba(30,45,69,0.7)',
};

function chartDefaults(extraScales) {
    return {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: {
                labels: { color: C.text, font: { family: 'DM Sans', size: 11 }, boxWidth: 12 }
            },
            tooltip: {
                backgroundColor: '#18213a',
                borderColor: '#1e2d45',
                borderWidth: 1,
                titleColor: '#e2e8f0',
                bodyColor: '#8896b3',
                padding: 10,
            }
        },
        scales: {
            x: {
                ticks: { color: C.muted, font: { family: 'Fira Code', size: 10 }, maxRotation: 45 },
                grid:  { color: C.gridLine }
            },
            y: {
                beginAtZero: true,
                ticks: { color: C.muted, font: { family: 'Fira Code', size: 10 } },
                grid:  { color: C.gridLine },
                ...extraScales
            }
        }
    };
}

/* ── Gráfica 1: Coin por día (barras) con línea de promedio ── */
function graficaDiaria(dias) {
    if (!dias || dias.length === 0) return null;

    const labels  = dias.map(d => d.fecha);
    const coins   = dias.map(d => d._unico ? null : (Number(d.coin) || 0));

    // Promedio (sin nulls)
    const vals   = coins.filter(v => v !== null);
    const avg    = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
    const avgLine = dias.map(() => Math.round(avg));

    return {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Coin',
                    data: coins,
                    backgroundColor: dias.map((d, i) => {
                        if (d._unico) return C.muted;
                        const v = Number(d.coin) || 0;
                        if (v >= avg * 1.1) return C.greenDim;
                        if (v <= avg * 0.9 && v > 0) return C.redDim;
                        return C.blueDim;
                    }),
                    borderColor: dias.map((d, i) => {
                        if (d._unico) return C.muted;
                        const v = Number(d.coin) || 0;
                        if (v >= avg * 1.1) return C.green;
                        if (v <= avg * 0.9 && v > 0) return C.red;
                        return C.blue;
                    }),
                    borderWidth: 1.5,
                    borderRadius: 3,
                },
                {
                    label: 'Promedio',
                    data: avgLine,
                    type: 'line',
                    borderColor: C.amber,
                    borderDash: [5, 4],
                    borderWidth: 1.5,
                    pointRadius: 0,
                    fill: false,
                }
            ]
        },
        options: {
            ...chartDefaults(),
            plugins: {
                ...chartDefaults().plugins,
                title: {
                    display: true,
                    text: 'Actividad diaria — verde = por encima del promedio, rojo = por debajo',
                    color: C.muted,
                    font: { size: 10, family: 'DM Sans' },
                    padding: { bottom: 8 }
                }
            }
        }
    };
}

/* ── Gráfica 2: Semanales ── */
function graficaSemanales() {
    if (!datosSemanales || datosSemanales.length === 0) {
        return _placeholderChart('Seleccioná semanas en la pestaña Cierres Semanales para ver la gráfica');
    }

    const labels = datosSemanales.map(d => d.fecha);
    const coins  = datosSemanales.map(d => Number(d.coin)    || 0);
    const prems  = datosSemanales.map(d => Number(d.premios) || 0);

    return {
        type: 'line',
        data: {
            labels,
            datasets: [
                { label: 'Coin',    data: coins, borderColor: C.blue,  backgroundColor: C.blueDim,  fill: true,  tension: 0.3, pointRadius: 4 },
                { label: 'Premios', data: prems, borderColor: C.green, backgroundColor: C.greenDim, fill: true,  tension: 0.3, pointRadius: 4 }
            ]
        },
        options: chartDefaults()
    };
}

/* ── Gráfica 3: Mensuales ── */
function graficaMensuales() {
    if (!datosMensuales || datosMensuales.length === 0) {
        return _placeholderChart('Seleccioná meses en la pestaña Cierres Mensuales para ver la gráfica');
    }

    const labels = datosMensuales.map(d => d.fecha);
    const coins  = datosMensuales.map(d => Number(d.coin)    || 0);
    const prems  = datosMensuales.map(d => Number(d.premios) || 0);

    return {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { label: 'Coin',    data: coins, backgroundColor: C.blueDim,  borderColor: C.blue,  borderWidth: 1.5, borderRadius: 3 },
                { label: 'Premios', data: prems, backgroundColor: C.amberDim, borderColor: C.amber, borderWidth: 1.5, borderRadius: 3 }
            ]
        },
        options: chartDefaults()
    };
}

/* ── Gráfica 4: Comparativa — Coin vs Premios vs Pesos por día ── */
function graficaComparativa(dias) {
    if (!dias || dias.length === 0) return null;

    const labels  = dias.map(d => d.fecha);
    const coins   = dias.map(d => d._unico ? null : (Number(d.coin)    || 0));
    const prems   = dias.map(d => d._unico ? null : (Number(d.premios) || 0));
    const pesos   = dias.map(d => Number(d.pesos) || 0);

    return {
        type: 'line',
        data: {
            labels,
            datasets: [
                { label: 'Coin',    data: coins, borderColor: C.blue,  backgroundColor: 'transparent', tension: 0.3, pointRadius: 3, spanGaps: true },
                { label: 'Premios', data: prems, borderColor: C.amber, backgroundColor: 'transparent', tension: 0.3, pointRadius: 3, spanGaps: true },
                { label: 'Pesos',   data: pesos, borderColor: C.green, backgroundColor: 'transparent', tension: 0.3, pointRadius: 3, borderDash: [4,3] },
            ]
        },
        options: {
            ...chartDefaults(),
            plugins: {
                ...chartDefaults().plugins,
                title: {
                    display: true,
                    text: 'Comparativa diaria: Coin / Premios / Pesos',
                    color: C.muted,
                    font: { size: 10, family: 'DM Sans' },
                }
            }
        }
    };
}

/* Placeholder cuando aún no hay datos para una gráfica */
function _placeholderChart(mensaje) {
    return {
        type: 'bar',
        data: { labels: [mensaje], datasets: [{ data: [0], backgroundColor: 'transparent', borderColor: 'transparent' }] },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false },
                title: { display: true, text: mensaje, color: C.muted, font: { size: 11, family: 'DM Sans' }, padding: 20 }
            },
            scales: { x: { display: false }, y: { display: false } }
        }
    };
}

/* ══════════════════════════════════════════════════
   HELPERS UI
══════════════════════════════════════════════════ */
function mostrarAviso(idTabla, mensaje) {
    const tabla = document.getElementById(idTabla);
    const tbody = tabla?.querySelector('tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.textContent = mensaje;
    td.className = 'table-empty';
    tr.appendChild(td);
    tbody.appendChild(tr);
}

function formatFecha(date) {
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/* ══════════════════════════════════════════════════
   SISTEMA DE BORRADO — Máquina actual
   Llamado desde la sección #eliminar en report.php
══════════════════════════════════════════════════ */

/* ── Preview: cuántos registros se borrarían ── */
function previewDelete() {
    const desde = document.getElementById('del-desde').value;
    const hasta = document.getElementById('del-hasta').value;
    const btn   = document.getElementById('btn-preview-delete');
    const info  = document.getElementById('delete-preview-info');

    if (!desde || !hasta) {
        info.textContent = 'Seleccioná ambas fechas para ver la previsualización.';
        info.className   = 'delete-preview-msg delete-preview-warn';
        return;
    }
    if (desde > hasta) {
        info.textContent = '"Desde" no puede ser posterior a "Hasta".';
        info.className   = 'delete-preview-msg delete-preview-warn';
        return;
    }

    btn.disabled     = true;
    btn.textContent  = 'Consultando…';
    info.textContent = '';

    fetch(`get_report.php?device_id=${encodeURIComponent(deviceId)}&fechaInicio=${desde}&fechaFin=${hasta}`)
        .then(r => r.json())
        .then(data => {
            const n = (data.reports || []).length;
            if (n === 0) {
                info.textContent = 'No hay registros en ese rango de fechas.';
                info.className   = 'delete-preview-msg delete-preview-warn';
            } else {
                info.innerHTML = `⚠ Se eliminarán <strong>${n}</strong> registro${n > 1 ? 's' : ''} de <strong>${deviceId}</strong> entre <strong>${desde}</strong> y <strong>${hasta}</strong>.`;
                info.className = 'delete-preview-msg delete-preview-danger';
            }
            document.getElementById('btn-confirm-delete').disabled = (n === 0);
        })
        .catch(err => {
            info.textContent = 'Error al consultar: ' + err.message;
            info.className   = 'delete-preview-msg delete-preview-warn';
        })
        .finally(() => {
            btn.disabled    = false;
            btn.textContent = 'Ver previsualización';
        });
}

/* ── Ejecutar borrado por rango ── */
function ejecutarBorradoRango() {
    const desde = document.getElementById('del-desde').value;
    const hasta = document.getElementById('del-hasta').value;
    const btn   = document.getElementById('btn-confirm-delete');
    const info  = document.getElementById('delete-preview-info');

    if (!desde || !hasta || !deviceId) return;

    const confirmed = confirm(
        `¿Confirmar eliminación de todos los registros de "${deviceId}"\nentre ${desde} y ${hasta}?\n\nEsta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    btn.disabled    = true;
    btn.textContent = 'Eliminando…';

    fetch('delete_reports.php', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ mode: 'range', device_id: deviceId, fecha_desde: desde, fecha_hasta: hasta })
    })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                info.innerHTML = `✓ ${data.message}`;
                info.className = 'delete-preview-msg delete-preview-ok';
                // Resetear cache para refrescar datos
                datosCargados.reportes = false;
                datosCargados.diarios  = false;
                allReports  = [];
                datosDiarios = [];
                document.getElementById('del-desde').value = '';
                document.getElementById('del-hasta').value = '';
                btn.disabled = true;
            } else {
                info.textContent = 'Error: ' + (data.error || 'desconocido');
                info.className   = 'delete-preview-msg delete-preview-warn';
                btn.disabled     = false;
            }
        })
        .catch(err => {
            info.textContent = 'Error de red: ' + err.message;
            info.className   = 'delete-preview-msg delete-preview-warn';
            btn.disabled     = false;
        })
        .finally(() => {
            if (!btn.disabled) btn.textContent = 'Confirmar eliminación';
            else               btn.textContent = 'Confirmar eliminación';
        });
}

/* ── Borrar reporte individual por ID ── */
function borrarReportePorId() {
    const input = document.getElementById('del-id');
    const info  = document.getElementById('delete-id-info');
    const id    = parseInt(input?.value);

    if (!id || id <= 0) {
        info.textContent = 'Ingresá un ID de reporte válido.';
        info.className   = 'delete-preview-msg delete-preview-warn';
        return;
    }

    const confirmed = confirm(
        `¿Eliminar el reporte con ID #${id} de "${deviceId}"?\n\nEsta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    info.textContent = 'Eliminando…';
    info.className   = 'delete-preview-msg';

    fetch('delete_reports.php', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ mode: 'single', device_id: deviceId, report_id: id })
    })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                info.innerHTML = `✓ ${data.message}`;
                info.className = 'delete-preview-msg delete-preview-ok';
                input.value    = '';
                // Refrescar tabla de registros
                datosCargados.reportes = false;
                allReports = [];
                cargarReportes();
            } else {
                info.textContent = 'Error: ' + (data.error || 'desconocido');
                info.className   = 'delete-preview-msg delete-preview-warn';
            }
        })
        .catch(err => {
            info.textContent = 'Error de red: ' + err.message;
            info.className   = 'delete-preview-msg delete-preview-warn';
        });
}