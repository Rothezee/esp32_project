<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="css/style.css">
  <title>Panel de Control</title>
</head>
<body>

<!-- ════════════════════════════════════════ NAVBAR -->
<header>
  <nav class="navbar">
    <div class="navbar-brand">
      <img src="img/ChatGPT Image 1 abr 2025, 21_59_11-Photoroom.png" alt="Logo" id="logo">
      <span class="brand-name">Panel de Control <span class="brand-sub">Gestión de Máquinas</span></span>
    </div>
    <div style="display:flex;align-items:center;gap:0.5rem;">
      <button class="btn-danger-outline" id="btn-borrado-global" title="Eliminar registros de todas las máquinas">
        🗑 Limpiar datos
      </button>
      <button class="navbar-toggler" id="navbar-toggler">
        <span></span><span></span><span></span>
      </button>
    </div>
    <div class="navbar-menu" id="open-navbar1">
      <ul class="navbar-nav">
        <li class="active"><a href="dashboard.php">Dashboard</a></li>
      </ul>
    </div>
  </nav>
</header>

<!-- ════════════════════════════════════════ MAIN -->
<main id="dashboard-root">
  <!-- Cards generadas dinámicamente por main.js -->
</main>

<!-- ════════════════════════════════════════ MODAL BORRADO GLOBAL -->
<div id="global-delete-modal" class="modal-overlay" style="display:none">
  <div class="modal-box" style="max-width:480px">
    <div class="modal-header">
      <h2 class="modal-title" style="color:var(--red)">🗑 Limpiar datos globalmente</h2>
      <button class="modal-close" id="global-delete-close">✕</button>
    </div>
    <div class="modal-body">

      <p style="font-size:.82rem;color:var(--text-secondary);line-height:1.6;margin-bottom:1rem">
        Elimina los registros de <strong style="color:var(--text-primary)">todas las máquinas</strong>
        hasta la fecha que indiques. Útil para hacer limpieza periódica de datos antiguos.
      </p>

      <div class="form-group">
        <label for="global-del-hasta">Eliminar todos los registros hasta (inclusive)</label>
        <input type="date" id="global-del-hasta" style="width:100%;min-width:unset">
      </div>

      <div id="global-delete-preview" class="delete-preview-msg" style="margin-top:.5rem"></div>

    </div>
    <div class="modal-footer">
      <button class="btn-modal-cancel" id="global-delete-cancel">Cancelar</button>
      <button id="btn-global-preview"  class="btn-secondary">Ver previsualización</button>
      <button id="btn-global-confirm"  class="btn-danger" disabled>Eliminar todo</button>
    </div>
  </div>
</div>

<script src="script/main.js"></script>
<script>
  /* ── Navbar mobile ── */
  document.getElementById('navbar-toggler').addEventListener('click', () => {
    document.getElementById('open-navbar1').classList.toggle('active');
  });

  /* ── Modal borrado global ── */
  const globalModal   = document.getElementById('global-delete-modal');
  const globalClose   = () => {
    globalModal.style.display = 'none';
    document.getElementById('global-del-hasta').value = '';
    document.getElementById('global-delete-preview').textContent = '';
    document.getElementById('btn-global-confirm').disabled = true;
  };

  document.getElementById('btn-borrado-global') .addEventListener('click', () => { globalModal.style.display = 'flex'; });
  document.getElementById('global-delete-close').addEventListener('click', globalClose);
  document.getElementById('global-delete-cancel').addEventListener('click', globalClose);
  globalModal.addEventListener('click', e => { if (e.target === globalModal) globalClose(); });

  document.getElementById('global-del-hasta').addEventListener('change', () => {
    document.getElementById('btn-global-confirm').disabled = true;
    document.getElementById('global-delete-preview').textContent = '';
  });

  /* Preview: contar cuántos registros hay hasta esa fecha */
  document.getElementById('btn-global-preview').addEventListener('click', function () {
    const hasta = document.getElementById('global-del-hasta').value;
    const info  = document.getElementById('global-delete-preview');
    if (!hasta) {
      info.textContent = 'Seleccioná una fecha primero.';
      info.className   = 'delete-preview-msg delete-preview-warn';
      return;
    }
    this.disabled    = true;
    this.textContent = 'Consultando…';
    info.textContent = '';

    // Contar registros de cada máquina hasta esa fecha
    fetch(`get_all_devices.php`)
      .then(r => r.json())
      .then(async devData => {
        if (!devData.devices) throw new Error('Sin datos');
        // Fetch count for each device
        let total = 0;
        const proms = devData.devices.map(d =>
          fetch(`get_report.php?device_id=${encodeURIComponent(d.device_id)}&fechaFin=${hasta}`)
            .then(r => r.json())
            .then(data => { total += (data.reports || []).length; })
            .catch(() => {})
        );
        await Promise.all(proms);
        if (total === 0) {
          info.textContent = 'No hay registros hasta esa fecha.';
          info.className   = 'delete-preview-msg delete-preview-warn';
          document.getElementById('btn-global-confirm').disabled = true;
        } else {
          info.innerHTML = `⚠ Se eliminarán <strong>${total}</strong> registro${total > 1 ? 's' : ''} de todas las máquinas hasta <strong>${hasta}</strong>.`;
          info.className = 'delete-preview-msg delete-preview-danger';
          document.getElementById('btn-global-confirm').disabled = false;
        }
      })
      .catch(err => {
        info.textContent = 'Error: ' + err.message;
        info.className   = 'delete-preview-msg delete-preview-warn';
      })
      .finally(() => {
        this.disabled    = false;
        this.textContent = 'Ver previsualización';
      });
  });

  /* Confirmar borrado global */
  document.getElementById('btn-global-confirm').addEventListener('click', function () {
    const hasta = document.getElementById('global-del-hasta').value;
    const info  = document.getElementById('global-delete-preview');
    if (!hasta) return;

    const ok = confirm(
      `¿Eliminar TODOS los registros de TODAS las máquinas hasta ${hasta}?\n\nEsta acción no se puede deshacer.`
    );
    if (!ok) return;

    this.disabled    = true;
    this.textContent = 'Eliminando…';

    fetch('delete_reports.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ mode: 'global', fecha_hasta: hasta })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          info.innerHTML = `✓ ${data.message}`;
          info.className = 'delete-preview-msg delete-preview-ok';
          this.textContent = 'Eliminar todo';
        } else {
          info.textContent = 'Error: ' + (data.error || 'desconocido');
          info.className   = 'delete-preview-msg delete-preview-warn';
          this.disabled    = false;
          this.textContent = 'Eliminar todo';
        }
      })
      .catch(err => {
        info.textContent = 'Error de red: ' + err.message;
        info.className   = 'delete-preview-msg delete-preview-warn';
        this.disabled    = false;
        this.textContent = 'Eliminar todo';
      });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') globalClose();
  });
</script>
</body>
</html>