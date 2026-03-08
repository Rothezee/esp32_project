<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="css/style.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
  <title>Reporte — Panel de Control</title>
</head>
<body>

<!-- ════════════════════════════════════════ NAVBAR -->
<header>
  <nav class="navbar">
    <div class="navbar-brand">
      <img src="img/ChatGPT Image 1 abr 2025, 21_59_11-Photoroom.png" alt="Logo" id="logo">
      <span class="brand-name">Panel de Control <span class="brand-sub">Reportes</span></span>
    </div>
    <button class="navbar-toggler" id="navbar-toggler">
      <span></span><span></span><span></span>
    </button>
    <div class="navbar-menu" id="open-navbar1">
      <ul class="navbar-nav">
        <li><a href="dashboard.php">← Dashboard</a></li>
        <li><a href="#reportes">Reportes</a></li>
        <li><a href="#diarios">Diarios</a></li>
        <li><a href="#semanales">Semanales</a></li>
        <li><a href="#mensuales">Mensuales</a></li>
        <li><a href="#graficas">Gráficas</a></li>
      </ul>
    </div>
  </nav>
</header>

<!-- ════════════════════════════════════════ PAGE HERO -->
<div class="page-hero">
  <div class="report-hero-inner">
    <div class="report-hero-title-row">
      <h1 class="page-title" id="machine_name">Cargando…</h1>
      <div class="report-hero-badges" id="report-hero-badges" style="display:none">
        <span class="report-badge" id="badge-local"></span>
        <span class="report-badge" id="badge-group"></span>
        <span class="report-badge report-badge--mono" id="badge-device-id"></span>
      </div>
    </div>

    <!-- Description block — shown only when there is one -->
    <div class="report-description" id="machine-description-block" style="display:none">
      <span class="report-description-icon">📋</span>
      <span id="machine-description-text"></span>
    </div>
  </div>
</div>

<!-- ════════════════════════════════════════ TAB NAV -->
<div class="tab-nav">
  <button class="tab-link active"  onclick="mostrarSeccion('reportes')">Registros</button>
  <button class="tab-link"         onclick="mostrarSeccion('diarios')">Cierres Diarios</button>
  <button class="tab-link"         onclick="mostrarSeccion('semanales')">Cierres Semanales</button>
  <button class="tab-link"         onclick="mostrarSeccion('mensuales')">Cierres Mensuales</button>
  <button class="tab-link"         onclick="mostrarSeccion('graficas')">Gráficas</button>
  <button class="tab-link tab-link--danger" onclick="mostrarSeccion('eliminar')">Eliminar datos</button>
</div>

<!-- ════════════════════════════════════════ SECTIONS -->
<main style="padding:0;">

  <section id="reportes" class="seccion active">
    <h2>Registros de datos</h2>
    <div class="table-container">
      <table id="report_table">
        <thead><tr>
          <th>ID</th><th>Fecha y Hora</th><th>Pesos</th><th>Coin</th><th>Premios</th><th>Banco</th>
        </tr></thead>
        <tbody></tbody>
      </table>
    </div>
  </section>

  <section id="diarios" class="seccion">
    <h2>Cierres Diarios</h2>
    <div class="table-container reportsContainer">
      <table id="tabla-diarios">
        <thead><tr>
          <th>Fecha</th><th>Pesos</th><th>Coin</th><th>Premios</th><th>Banco</th>
        </tr></thead>
        <tbody></tbody>
      </table>
    </div>
    <div class="table-legend">
      <span class="legend-dot legend-dot--high"></span> Por encima del promedio &nbsp;&nbsp;
      <span class="legend-dot legend-dot--low"></span> Por debajo del promedio
    </div>
  </section>

  <section id="semanales" class="seccion">
    <h2>Cierres Semanales</h2>
    <div style="margin-bottom:1.25rem;">
      <label for="selector-inicio-semana">Día de inicio de semana</label>
      <input type="text" id="selector-inicio-semana" placeholder="Seleccionar fecha" readonly>
    </div>
    <div class="table-container">
      <table id="tabla-semanales">
        <thead><tr>
          <th>Semana</th><th>Pesos</th><th>Coin</th><th>Premios</th><th>Banco</th>
        </tr></thead>
        <tbody></tbody>
      </table>
    </div>
    <div class="table-legend">
      <span class="legend-dot legend-dot--high"></span> Por encima del promedio &nbsp;&nbsp;
      <span class="legend-dot legend-dot--low"></span> Por debajo del promedio
    </div>
  </section>

  <section id="mensuales" class="seccion">
    <h2>Cierres Mensuales</h2>
    <div style="margin-bottom:1.25rem;">
      <label for="selector-inicio-mes">Mes</label>
      <input type="month" id="selector-inicio-mes">
    </div>
    <div class="table-container">
      <table id="tabla-mensuales">
        <thead><tr>
          <th>Mes</th><th>Pesos</th><th>Coin</th><th>Premios</th><th>Banco</th>
        </tr></thead>
        <tbody></tbody>
      </table>
    </div>
    <div class="table-legend">
      <span class="legend-dot legend-dot--high"></span> Por encima del promedio &nbsp;&nbsp;
      <span class="legend-dot legend-dot--low"></span> Por debajo del promedio
    </div>
  </section>

  <section id="graficas" class="seccion">
    <h2>Gráficas comparativas</h2>
    <div class="chart-section">
      <div class="chart-label">Ganancias Diarias</div>
      <canvas id="grafica-ganancias-diarias" height="180"></canvas>
    </div>
    <div class="chart-section">
      <div class="chart-label">Ganancias Semanales</div>
      <canvas id="grafica-ganancias-semanales" height="180"></canvas>
    </div>
    <div class="chart-section">
      <div class="chart-label">Ganancias Mensuales</div>
      <canvas id="grafica-ganancias-mensuales" height="180"></canvas>
    </div>
    <div class="chart-section">
      <div class="chart-label">Comparativa General</div>
      <canvas id="grafica-comparativa" height="180"></canvas>
    </div>
  </section>

  <!-- ════ ELIMINAR DATOS ════ -->
  <section id="eliminar" class="seccion">
    <h2>Eliminar registros</h2>

    <div class="delete-grid">

      <!-- Panel 1: Borrar por rango de fechas -->
      <div class="delete-panel">
        <div class="delete-panel-header">
          <span class="delete-panel-icon">📅</span>
          <div>
            <div class="delete-panel-title">Borrar por rango de fechas</div>
            <div class="delete-panel-sub">Elimina todos los registros de esta máquina entre dos fechas</div>
          </div>
        </div>

        <div class="delete-form">
          <div class="delete-form-row">
            <div class="form-group">
              <label for="del-desde">Desde</label>
              <input type="date" id="del-desde" onchange="document.getElementById('btn-confirm-delete').disabled=true">
            </div>
            <div class="form-group">
              <label for="del-hasta">Hasta</label>
              <input type="date" id="del-hasta" onchange="document.getElementById('btn-confirm-delete').disabled=true">
            </div>
          </div>

          <div id="delete-preview-info" class="delete-preview-msg"></div>

          <div class="delete-actions">
            <button id="btn-preview-delete" class="btn-secondary" onclick="previewDelete()">Ver previsualización</button>
            <button id="btn-confirm-delete" class="btn-danger" onclick="ejecutarBorradoRango()" disabled>Confirmar eliminación</button>
          </div>
        </div>
      </div>

      <!-- Panel 2: Borrar por ID de reporte -->
      <div class="delete-panel">
        <div class="delete-panel-header">
          <span class="delete-panel-icon">🔍</span>
          <div>
            <div class="delete-panel-title">Borrar reporte individual</div>
            <div class="delete-panel-sub">Usá el ID que aparece en la tabla de Registros</div>
          </div>
        </div>

        <div class="delete-form">
          <div class="form-group">
            <label for="del-id">ID del reporte</label>
            <input type="number" id="del-id" placeholder="Ej: 1042" min="1" style="min-width:unset;width:100%">
          </div>

          <div id="delete-id-info" class="delete-preview-msg"></div>

          <div class="delete-actions">
            <button class="btn-danger" onclick="borrarReportePorId()">Eliminar este reporte</button>
          </div>
        </div>
      </div>

    </div>
  </section>


</main>

<!-- ════════════════════════════════════════ SCRIPTS -->
<!-- flatpickr (sin plugins) -->
<script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
<!-- flatpickr locale ES (carga automáticamente el locale 'es') -->
<script src="https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/es.js"></script>
<!-- Chart.js -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script>
<!-- Lógica de reportes -->
<script src="script/report.js"></script>

<script>
/* ── Navbar mobile ── */
document.getElementById('navbar-toggler').addEventListener('click', () => {
  document.getElementById('open-navbar1').classList.toggle('active');
});

/* ── Load machine info from localStorage and populate hero ── */
(function populateMachineInfo() {
  const params   = new URLSearchParams(window.location.search);
  const deviceId = params.get('device_id');
  if (!deviceId) return;

  let cfg = {};
  try { cfg = JSON.parse(localStorage.getItem('machine_config') || '{}'); } catch {}

  const info = cfg[deviceId];

  // Title — use config name or fall back to raw device ID
  const nameEl = document.getElementById('machine_name');
  if (nameEl) nameEl.textContent = (info && info.displayName) ? info.displayName : deviceId;

  if (!info) return;

  // Badges row
  const badgesEl = document.getElementById('report-hero-badges');
  if (badgesEl && (info.localName || info.groupName)) {
    if (info.localName) document.getElementById('badge-local').textContent  = '📍 ' + info.localName;
    if (info.groupName) document.getElementById('badge-group').textContent  = info.groupName;
    document.getElementById('badge-device-id').textContent = deviceId;
    badgesEl.style.display = 'flex';
  }

  // Description block
  if (info.description) {
    const descBlock = document.getElementById('machine-description-block');
    const descText  = document.getElementById('machine-description-text');
    if (descBlock && descText) {
      descText.textContent    = info.description;
      descBlock.style.display = 'flex';
    }
  }
})();
</script>
</body>
</html>