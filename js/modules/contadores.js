/**
 * CONSEROUT - Counter Tracking Module
 * Critical module for monthly equipment counter registration and consumption tracking
 */

// Extend App class with counter module
App.prototype.loadContadoresModule = function (container) {
  container.innerHTML = `
    <div class="module-container">
      <div class="module-header">
        <h2 class="module-title">Registro de Contadores</h2>
        <div class="module-actions">
          <button class="btn btn-primary" onclick="app.showRegistroContadoresForm()">
            <span>+</span>
            <span>Registrar Contadores</span>
          </button>
        </div>
      </div>

      <div class="info-box">
        <div class="info-box-icon">ℹ️</div>
        <div class="info-box-content">
          <div class="info-box-title">Sistema de Contadores</div>
          <p style="margin: 0;">Registre los contadores mensuales de los equipos. El sistema calculará automáticamente el consumo (contador actual - contador anterior).</p>
        </div>
      </div>

      <div class="filters-container">
        <div class="filters-grid">
          <div class="form-group m-0">
            <label class="form-label">Contrato</label>
            <select class="form-select" id="filterContratoContadores">
              <option value="">Todos los contratos</option>
            </select>
          </div>
          <div class="form-group m-0">
            <label class="form-label">Mes/Año</label>
            <input type="month" class="form-input" id="filterMesContadores" value="${this.getCurrentYearMonth()}">
          </div>
          <div class="form-group m-0">
            <label class="form-label">Estado Equipo</label>
            <select class="form-select" id="filterEstadoEquipo">
              <option value="">Todos</option>
              <option value="instalado" selected>Instalados</option>
              <option value="sin_instalar">Sin Instalar</option>
            </select>
          </div>
          <div class="form-group m-0">
            <label class="form-label">Buscar Serie</label>
            <input type="text" class="form-input" id="searchSerieContadores" placeholder="Ingrese serie...">
          </div>
          <div style="display: flex; align-items: end;">
            <button class="btn btn-secondary w-full" onclick="app.renderContadoresTable()">
              <span>🔍</span>
              <span>Filtrar</span>
            </button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Equipos y Contadores</h3>
          <div style="display: flex; gap: var(--spacing-sm);">
            <button class="btn btn-sm btn-secondary" onclick="app.exportContadores()">
              <span>📊</span>
              <span>Exportar</span>
            </button>
          </div>
        </div>
        <div class="table-container">
          <table class="table" id="contadoresTable">
            <thead>
              <tr>
                <th>Equipo</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>N° Serie</th>
                <th>Contrato</th>
                <th>Ubicación</th>
                <th>Contador Anterior</th>
                <th>Contador Actual</th>
                <th>Consumo</th>
                <th>Última Lectura</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="contadoresTableBody">
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  this.renderContadoresTable();
  this.setupContadoresFilters();
};

App.prototype.renderContadoresTable = function () {
  const equipos = db.getData('equipos');
  const modelos = db.getData('modelos');
  const marcas = db.getData('marcas');
  const contratos = db.getData('contratos');
  const contadores = db.getData('contadores_equipos');

  const tbody = document.getElementById('contadoresTableBody');
  if (!tbody) return;

  const currUser = auth.getCurrentUser();
  const isTechnician = currUser && currUser.perfil_id === 3;
  let assignedContratosIds = [];

  if (isTechnician) {
    const asignaciones = db.getData('tecnicos_contrato').filter(tc => tc.tecnico_id === currUser.id);
    assignedContratosIds = asignaciones.map(a => a.contrato_id);
  }

  tbody.innerHTML = '';

  // Populate contract filter
  const filterContrato = document.getElementById('filterContratoContadores');
  if (filterContrato && filterContrato.options.length === 1) {
    contratos.filter(c => c.estado === 'vigente').forEach(contrato => {
      if (isTechnician && !assignedContratosIds.includes(contrato.id)) return;

      const option = document.createElement('option');
      option.value = contrato.id;
      option.textContent = contrato.numero_contrato;
      filterContrato.appendChild(option);
    });
  }

  // Get filter values
  const contratoFilter = document.getElementById('filterContratoContadores')?.value || '';
  const estadoFilter = document.getElementById('filterEstadoEquipo')?.value || '';
  const searchSerie = document.getElementById('searchSerieContadores')?.value.toLowerCase() || '';

  // Filter equipos
  let filteredEquipos = equipos;
  if (isTechnician) {
    filteredEquipos = filteredEquipos.filter(e => e.contrato_id && assignedContratosIds.includes(e.contrato_id));
  }

  if (contratoFilter) {
    filteredEquipos = filteredEquipos.filter(e => e.contrato_id === parseInt(contratoFilter));
  }
  if (estadoFilter) {
    filteredEquipos = filteredEquipos.filter(e => e.estado === estadoFilter);
  }
  if (searchSerie) {
    filteredEquipos = filteredEquipos.filter(e => e.numero_serie.toLowerCase().includes(searchSerie));
  }

  filteredEquipos.forEach(equipo => {
    const modelo = modelos.find(m => m.id === equipo.modelo_id);
    const marca = modelo ? marcas.find(m => m.id === modelo.marca_id) : null;
    const contrato = contratos.find(c => c.id === equipo.contrato_id);

    // Get latest/previous counters
    const equipoContadores = contadores.filter(c => c.equipo_id === equipo.id)
      .sort((a, b) => new Date(b.fecha_lectura) - new Date(a.fecha_lectura));

    const ultimoContador = equipoContadores[0];
    const contadorAnterior = equipoContadores[1] || null;

    const bnActual = ultimoContador ? (ultimoContador.contador_bn ?? ultimoContador.contador_actual ?? 0) : 0;
    const colorActual = ultimoContador ? (ultimoContador.contador_color ?? 0) : 0;

    // Si no hay lectura anterior del historial (pero si una actual), bnPrev se saca de ultimoContador.ant_bn
    const bnPrev = ultimoContador ? (ultimoContador.ant_bn ?? 0) : 0;
    const colorPrev = ultimoContador ? (ultimoContador.ant_color ?? 0) : 0;

    const consumoBN = ultimoContador ? (ultimoContador.consumo_bn ?? ultimoContador.consumo ?? 0) : 0;
    const consumoColor = ultimoContador ? (ultimoContador.consumo_color ?? 0) : 0;
    const ultimaLectura = ultimoContador ? ultimoContador.fecha_lectura : '-';
    const isColor = modelo?.tipo_impresion === 'color';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
          <span style="font-size: var(--font-size-xl);">🖨️</span>
          <div>
            <strong>${modelo ? modelo.nombre : 'N/A'}</strong>
          </div>
        </div>
      </td>
      <td>${marca ? marca.nombre : '-'}</td>
      <td>${modelo ? modelo.nombre : '-'}</td>
      <td><code style="font-size: var(--font-size-xs);">${equipo.numero_serie}</code></td>
      <td>${contrato ? contrato.numero_contrato : '-'}</td>
      <td>${equipo.ubicacion || '-'}</td>
      <td>
        <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary);">
          <div>B/N: <strong>${formatNumber(bnPrev)}</strong></div>
          ${isColor ? `<div style="color: var(--color-secondary);">Color: <strong>${formatNumber(colorPrev)}</strong></div>` : ''}
        </div>
      </td>
      <td>
        <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary);">
          <div>B/N: <strong>${formatNumber(bnActual)}</strong></div>
          ${isColor ? `<div style="color: var(--color-secondary);">Color: <strong>${formatNumber(colorActual)}</strong></div>` : ''}
        </div>
      </td>
      <td>
        <div class="font-bold">
          <div>${formatNumber(consumoBN)}</div>
          ${isColor ? `<div style="color: var(--color-secondary);">${formatNumber(consumoColor)}</div>` : ''}
        </div>
      </td>
      <td>${ultimaLectura !== '-' ? formatDate(ultimaLectura) : '-'}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-sm btn-ghost" onclick="app.registrarContador(${equipo.id})" title="Registrar lectura">📝</button>
          <button class="btn btn-sm btn-ghost" onclick="app.viewHistorialContadores(${equipo.id})" title="Ver historial">📊</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (filteredEquipos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="11" class="empty-state">
          <div class="empty-state-icon">📊</div>
          <div class="empty-state-title">No hay equipos que coincidan</div>
        </td>
      </tr>
    `;
  }
};

App.prototype.setupContadoresFilters = function () {
  const filterContrato = document.getElementById('filterContratoContadores');
  const filterEstado = document.getElementById('filterEstadoEquipo');
  const searchSerie = document.getElementById('searchSerieContadores');

  filterContrato?.addEventListener('change', () => this.renderContadoresTable());
  filterEstado?.addEventListener('change', () => this.renderContadoresTable());
  searchSerie?.addEventListener('input', debounce(() => this.renderContadoresTable(), 300));
};

App.prototype.registrarContador = function (equipoId, editId = null, parentModal = null) {
  const equipo = db.getById('equipos', equipoId);
  const modelo = db.getById('modelos', equipo.modelo_id);
  const contadores = db.getData('contadores_equipos');
  const isColor = modelo?.tipo_impresion === 'color';

  let recordToEdit = null;
  if (editId) {
    recordToEdit = db.getById('contadores_equipos', editId);
    if (recordToEdit && recordToEdit.aprobado) {
      showToast('Esta lectura está aprobada y bloqueada. Debe ser desaprobada para poder editarla.', 'warning');
      return;
    }
  }

  // Get chronological ordered counters to find previous
  const sortedContadores = contadores.filter(c => c.equipo_id === equipoId)
    .sort((a, b) => new Date(a.fecha_lectura) - new Date(b.fecha_lectura));

  let antBN = 0;
  let antColor = 0;

  if (editId) {
    const idx = sortedContadores.findIndex(c => c.id === editId);
    const anterior = sortedContadores[idx - 1];
    antBN = anterior ? (anterior.contador_bn ?? anterior.contador_actual ?? 0) : 0;
    antColor = anterior ? (anterior.contador_color ?? 0) : 0;
  } else {
    const ultimoContador = sortedContadores[sortedContadores.length - 1];
    antBN = ultimoContador ? (ultimoContador.contador_bn ?? ultimoContador.contador_actual ?? 0) : 0;
    antColor = ultimoContador ? (ultimoContador.contador_color ?? 0) : 0;
  }

  const valBN = recordToEdit ? recordToEdit.contador_bn : antBN;
  const valColor = recordToEdit ? recordToEdit.contador_color : antColor;
  const valFecha = recordToEdit ? recordToEdit.fecha_lectura : getCurrentDate();

  const formHTML = `
    <form id="contadorForm">
      <div class="info-box" style="margin-bottom: var(--spacing-lg);">
        <div class="info-box-icon">🖨️</div>
        <div class="info-box-content">
          <div class="info-box-title">${modelo.nombre}</div>
          <p style="margin: 0; font-size: var(--font-size-sm);">
            <strong>N° Serie:</strong> ${equipo.numero_serie}<br>
            <strong>Tipo:</strong> ${isColor ? 'Color / B&N' : 'Solo B&N'}<br>
            <strong>Ubicación:</strong> ${equipo.ubicacion || 'N/A'}
          </p>
        </div>
      </div>
      
      <!-- Contador B/N -->
      <div class="form-section-title">Lectura Blanco y Negro</div>
      <div class="counter-input-group" style="display: flex; justify-content: center; gap: var(--spacing-md); margin-bottom: var(--spacing-md);">
        <div class="counter-display" style="padding: var(--spacing-sm); border: 1px solid var(--color-border); border-radius: var(--radius-md); text-align: center; min-width: 120px;">
          <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary);">Anterior</div>
          <div style="font-size: var(--font-size-lg); font-weight: bold;">${formatNumber(antBN)}</div>
        </div>
        <div style="font-size: var(--font-size-2xl); color: var(--color-text-tertiary); display: flex; align-items: center;">→</div>
        <div class="counter-display" style="padding: var(--spacing-sm); border: 2px solid var(--color-primary); border-radius: var(--radius-md); text-align: center; min-width: 120px;">
          <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary);">Actual</div>
          <div style="font-size: var(--font-size-lg); font-weight: bold;" id="bnActualDisplay">${formatNumber(valBN)}</div>
        </div>
      </div>
      
      <div class="form-group">
        <label class="form-label required">Contador B/N Actual</label>
        <input 
          type="number" 
          class="form-input" 
          name="contador_bn" 
          min="${antBN}"
          value="${valBN}"
          required
          style="font-size: var(--font-size-xl); font-weight: bold; text-align: center;"
          oninput="document.getElementById('bnActualDisplay').textContent = formatNumber(this.value); document.getElementById('bnConsDisplay').textContent = formatNumber(Math.max(0, this.value - ${antBN}));"
        >
      </div>

      ${isColor ? `
      <!-- Contador Color -->
      <div class="form-section-title" style="margin-top: var(--spacing-lg);">Lectura Color</div>
      <div class="counter-input-group" style="display: flex; justify-content: center; gap: var(--spacing-md); margin-bottom: var(--spacing-md);">
        <div class="counter-display" style="padding: var(--spacing-sm); border: 1px solid var(--color-border); border-radius: var(--radius-md); text-align: center; min-width: 120px;">
          <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary);">Anterior</div>
          <div style="font-size: var(--font-size-lg); font-weight: bold;">${formatNumber(antColor)}</div>
        </div>
        <div style="font-size: var(--font-size-2xl); color: var(--color-text-tertiary); display: flex; align-items: center;">→</div>
        <div class="counter-display" style="padding: var(--spacing-sm); border: 2px solid var(--color-secondary); border-radius: var(--radius-md); text-align: center; min-width: 120px;">
          <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary);">Actual</div>
          <div style="font-size: var(--font-size-lg); font-weight: bold;" id="colorActualDisplay">${formatNumber(valColor)}</div>
        </div>
      </div>
      
      <div class="form-group">
        <label class="form-label required">Contador Color Actual</label>
        <input 
          type="number" 
          class="form-input" 
          name="contador_color" 
          min="${antColor}"
          value="${valColor}"
          required
          style="font-size: var(--font-size-xl); font-weight: bold; text-align: center;"
          oninput="document.getElementById('colorActualDisplay').textContent = formatNumber(this.value); document.getElementById('colorConsDisplay').textContent = formatNumber(Math.max(0, this.value - ${antColor}));"
        >
      </div>
      ` : ''}
      
      <div class="form-group" style="margin-top: var(--spacing-lg);">
        <label class="form-label required">Fecha de Lectura</label>
        <input type="date" class="form-input" name="fecha_lectura" value="${valFecha}" required>
      </div>
      
      <div class="alert alert-info" style="display: flex; gap: var(--spacing-sm); align-items: center; background: var(--color-bg-tertiary); padding: var(--spacing-md); border-radius: var(--radius-md);">
        <span style="font-size: 1.5rem;">📊</span>
        <div style="flex: 1;">
          <div><strong>Consumo B/N:</strong> <span id="bnConsDisplay">${formatNumber(Math.max(0, valBN - antBN))}</span> págs.</div>
          ${isColor ? `<div><strong>Consumo Color:</strong> <span id="colorConsDisplay">${formatNumber(Math.max(0, valColor - antColor))}</span> págs.</div>` : ''}
        </div>
      </div>
      
      <input type="hidden" name="equipo_id" value="${equipoId}">
      <input type="hidden" name="edit_id" value="${editId || ''}">
      <input type="hidden" name="parent_modal_id" value="${parentModal ? parentModal.id : ''}">
      <input type="hidden" name="ant_bn" value="${antBN}">
      <input type="hidden" name="ant_color" value="${antColor}">
    </form>
  `;

  const modal = createModal(
    editId ? 'Editar Contador' : 'Registrar Contador',
    formHTML,
    [
      {
        text: 'Cancelar',
        class: 'btn-secondary',
        onClick: () => closeModal(modal)
      },
      {
        text: editId ? 'Actualizar' : 'Registrar',
        class: 'btn-primary',
        onClick: () => this.saveContador(modal)
      }
    ],
    'md'
  );

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('active'), 10);
};

App.prototype.saveContador = function (modal) {
  const form = document.getElementById('contadorForm');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const formData = new FormData(form);
  const bnActual = parseInt(formData.get('contador_bn'));
  const bnAnterior = parseInt(formData.get('ant_bn'));
  const colorActual = parseInt(formData.get('contador_color')) || 0;
  const colorAnterior = parseInt(formData.get('ant_color')) || 0;
  const editId = formData.get('edit_id');
  const equipoId = parseInt(formData.get('equipo_id'));

  const consumoBN = Math.max(0, bnActual - bnAnterior);
  const consumoColor = Math.max(0, colorActual - colorAnterior);

  const data = {
    equipo_id: equipoId,
    fecha_lectura: formData.get('fecha_lectura'),
    contador_bn: bnActual,
    ant_bn: bnAnterior,
    consumo_bn: consumoBN,
    contador_color: colorActual,
    ant_color: colorAnterior,
    consumo_color: consumoColor,
    contador_actual: bnActual + colorActual,
    usuario_registro_id: auth.getCurrentUser().id,
    aprobado: false
  };

  if (editId) {
    db.update('contadores_equipos', parseInt(editId), data);
  } else {
    db.insert('contadores_equipos', data);
  }

  this.recalculateConsumos(equipoId);

  showToast(editId ? 'Lectura actualizada exitosamente' : 'Lectura registrada exitosamente', 'success');

  closeModal(modal);

  // Close the parent modal (history) if it exists
  const parentModalId = formData.get('parent_modal_id');
  if (parentModalId) {
    const parentModal = document.getElementById(parentModalId);
    if (parentModal) closeModal(parentModal);
  }

  this.viewHistorialContadores(equipoId);
  this.renderContadoresTable();
};

App.prototype.recalculateConsumos = function (equipoId) {
  const allLecturas = db.getData('contadores_equipos')
    .filter(c => c.equipo_id === equipoId)
    .sort((a, b) => new Date(a.fecha_lectura) - new Date(b.fecha_lectura));

  for (let i = 1; i < allLecturas.length; i++) {
    const actual = allLecturas[i];
    const anterior = allLecturas[i - 1];

    const antBN = anterior.contador_bn ?? anterior.contador_actual ?? 0;
    const antColor = anterior.contador_color ?? 0;

    db.update('contadores_equipos', actual.id, {
      ant_bn: antBN,
      ant_color: antColor,
      consumo_bn: Math.max(0, (actual.contador_bn ?? actual.contador_actual) - antBN),
      consumo_color: Math.max(0, actual.contador_color - antColor)
    });
  }
};

App.prototype.viewHistorialContadores = function (equipoId) {
  const equipo = db.getById('equipos', equipoId);
  if (!equipo) return;
  const modelo = db.getById('modelos', equipo.modelo_id);
  const marca = db.getById('marcas', modelo.marca_id);
  const currUser = auth.getCurrentUser();
  const isTechnician = currUser && currUser.perfil_id === 3;
  const contadores = db.getData('contadores_equipos')
    .filter(c => c.equipo_id === equipoId)
    .sort((a, b) => new Date(b.fecha_lectura) - new Date(a.fecha_lectura));

  const totalBN = contadores.reduce((sum, c) => sum + (c.consumo_bn || 0), 0);
  const totalColor = contadores.reduce((sum, c) => sum + (c.consumo_color || 0), 0);
  const isColor = modelo?.tipo_impresion === 'color';

  const content = `
    <div style="display: grid; gap: var(--spacing-lg);">
      <div class="detail-section">
        <h4 class="detail-section-title">Información del Equipo</h4>
        <div class="detail-row">
          <div class="detail-label">Marca/Modelo:</div>
          <div class="detail-value">${marca?.nombre || ''} ${modelo?.nombre || ''}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">N° Serie:</div>
          <div class="detail-value">${equipo.numero_serie}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Consumo Total B/N:</div>
          <div class="detail-value"><strong>${formatNumber(totalBN)}</strong> páginas</div>
        </div>
        ${isColor ? `
        <div class="detail-row">
          <div class="detail-label">Consumo Total Color:</div>
          <div class="detail-value" style="color: var(--color-secondary);"><strong>${formatNumber(totalColor)}</strong> páginas</div>
        </div>
        ` : ''}
      </div>

      <div class="detail-section">
        <h4 class="detail-section-title">Historial de Lecturas</h4>
        <div class="timeline" style="display: grid; gap: var(--spacing-md);">
          ${contadores.sort((a, b) => new Date(a.fecha_lectura) - new Date(b.fecha_lectura))
      .map((c, index) => ({ ...c, n_reading: index + 1 }))
      .reverse()
      .map(contador => {
        const cBN = contador.consumo_bn || 0;
        const cColor = contador.consumo_color || 0;
        return `
              <div class="card" style="padding: var(--spacing-md);">
                <div style="display: flex; justify-content: space-between; margin-bottom: var(--spacing-sm);">
                  <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                    <span class="badge badge-primary" style="background: var(--color-primary); color: white;">#${contador.n_reading}</span>
                    <span class="badge badge-secondary">${formatDate(contador.fecha_lectura)}</span>
                  </div>
                </div>
                <div style="display: grid; grid-template-columns: ${isColor ? '1fr 1fr' : '1fr'}; gap: var(--spacing-md);">
                  <div style="background: var(--color-bg-tertiary); padding: var(--spacing-sm); border-radius: var(--radius-sm); border-left: 4px solid var(--color-primary);">
                    <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary);">Blanco y Negro</div>
                    <div style="font-size: var(--font-size-lg); font-weight: bold;">+${formatNumber(cBN)} <span style="font-weight: normal; font-size: var(--font-size-xs); color: var(--color-text-tertiary);">(${formatNumber(contador.contador_bn ?? contador.contador_actual ?? 0)})</span></div>
                  </div>
                  ${isColor ? `
                  <div style="background: var(--color-bg-tertiary); padding: var(--spacing-sm); border-radius: var(--radius-sm); border-left: 4px solid var(--color-secondary);">
                    <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary);">Color</div>
                    <div style="font-size: var(--font-size-lg); font-weight: bold; color: var(--color-secondary);">+${formatNumber(cColor)} <span style="font-weight: normal; font-size: var(--font-size-xs); color: var(--color-text-tertiary);">(${formatNumber(contador.contador_color ?? 0)})</span></div>
                  </div>
                  ` : ''}
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: var(--spacing-md); padding-top: var(--spacing-sm); border-top: 1px solid var(--color-border);">
                  <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                    ${contador.aprobado ?
            '<span class="badge badge-success">✅ Completado / Aprobado</span>' :
            '<span class="badge badge-warning">⏳ Pendiente de Aprobación</span>'
          }
                  </div>
                  <div class="table-actions">
                    ${!contador.aprobado ? `
                      <button class="btn btn-sm btn-ghost text-primary" onclick="app.registrarContador(${equipoId}, ${contador.id}, this.closest('.modal'))" title="Editar esta lectura">
                        📝
                      </button>
                      <button class="btn btn-sm btn-ghost text-danger" onclick="app.deleteContadorLectura(${contador.id}, ${equipoId}, this.closest('.modal'))" title="Eliminar este registro">
                        🗑️
                      </button>
                    ` : ''}
                    ${(!contador.aprobado && !isTechnician) ? `
                      <button class="btn btn-sm btn-ghost text-success" onclick="app.aprobarContadorLectura(${contador.id}, ${equipoId}, this.closest('.modal'))" title="Aprobar esta lectura">
                        ✔️
                      </button>
                    ` : ''}
                    ${(contador.aprobado && !isTechnician) ? `
                      <button class="btn btn-sm btn-ghost text-warning" onclick="app.desaprobarContadorLectura(${contador.id}, ${equipoId}, this.closest('.modal'))" title="Desaprobar/Abrir lectura">
                        🔓
                      </button>
                    ` : ''}
                  </div>
                </div>
              </div>
            `;
      }).join('')}
          ${contadores.length === 0 ? '<p class="text-tertiary text-center">No hay lecturas registradas</p>' : ''}
        </div>
      </div>
    </div>
  `;

  const modal = createModal('Historial de Contadores', content, [
    {
      text: 'Cerrar',
      class: 'btn-secondary',
      onClick: () => closeModal(modal)
    },
    {
      text: 'Nuevo Registro',
      class: 'btn-primary',
      onClick: () => {
        closeModal(modal);
        this.registrarContador(equipoId);
      }
    }
  ], 'lg');

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('active'), 10);
};

App.prototype.aprobarContadorLectura = function (id, equipoId, historyModal = null) {
  showConfirm(
    'Aprobar Lectura',
    '¿Estás seguro que deseas aprobar esta lectura? Una vez aprobada, los técnicos no podrán eliminarla.',
    () => {
      db.update('contadores_equipos', id, { aprobado: true });
      showToast('Lectura aprobada exitosamente', 'success');

      if (historyModal) closeModal(historyModal);
      this.viewHistorialContadores(equipoId);
      this.renderContadoresTable();
    }
  );
};

App.prototype.desaprobarContadorLectura = function (id, equipoId, historyModal = null) {
  showConfirm(
    'Desaprobar Lectura',
    '¿Deseas desaprobar esta lectura? Volverá a estar en estado pendiente y podrá ser eliminada si es necesario.',
    () => {
      db.update('contadores_equipos', id, { aprobado: false });
      showToast('Lectura desaprobada exitosamente', 'warning');

      if (historyModal) closeModal(historyModal);
      this.viewHistorialContadores(equipoId);
      this.renderContadoresTable();
    }
  );
};

App.prototype.deleteContadorLectura = function (id, equipoId, historyModal = null) {
  showConfirm(
    'Eliminar Lectura',
    '¿Estás seguro que deseas eliminar esta lectura? Se recalcularán los consumos de las lecturas posteriores si existen.',
    () => {
      const lecturaAEliminar = db.getById('contadores_equipos', id);
      const allLecturas = db.getData('contadores_equipos')
        .filter(c => c.equipo_id === equipoId)
        .sort((a, b) => new Date(a.fecha_lectura) - new Date(b.fecha_lectura));

      const idx = allLecturas.findIndex(c => c.id === id);
      const siguienteLectura = allLecturas[idx + 1];

      if (siguienteLectura) {
        // Update the next record to reference the previous of the deleted one
        const anteriorALaEliminada = allLecturas[idx - 1];
        const antBN = anteriorALaEliminada ? (anteriorALaEliminada.contador_bn ?? anteriorALaEliminada.contador_actual ?? 0) : 0;
        const antColor = anteriorALaEliminada ? (anteriorALaEliminada.contador_color ?? 0) : 0;

        db.update('contadores_equipos', siguienteLectura.id, {
          ant_bn: antBN,
          ant_color: antColor,
          consumo_bn: Math.max(0, (siguienteLectura.contador_bn ?? siguienteLectura.contador_actual) - antBN),
          consumo_color: Math.max(0, siguienteLectura.contador_color - antColor)
        });
      }

      db.delete('contadores_equipos', id);
      showToast('Lectura eliminada y consumos recalculados', 'success');

      if (historyModal) closeModal(historyModal);
      this.viewHistorialContadores(equipoId);
      this.renderContadoresTable();
    }
  );
};

App.prototype.showRegistroContadoresForm = function () {
  const currUser = auth.getCurrentUser();
  const isTechnician = currUser && currUser.perfil_id === 3;
  const contratos = db.getData('contratos').filter(c => c.estado === 'vigente');
  let filteredContratos = contratos;

  if (isTechnician) {
    const asignaciones = db.getData('tecnicos_contrato').filter(tc => tc.tecnico_id === currUser.id);
    const asignadosIds = asignaciones.map(a => a.contrato_id);
    filteredContratos = contratos.filter(c => asignadosIds.includes(c.id));
  }

  const formHTML = `
    < form id = "registroMasivoForm" >
      <div class="info-box" style="margin-bottom: var(--spacing-lg);">
        <div class="info-box-icon">ℹ️</div>
        <div class="info-box-content">
          <div class="info-box-title">Registro Masivo</div>
          <p style="margin: 0;">Seleccione un contrato para registrar contadores de múltiples equipos a la vez.</p>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label required">Contrato</label>
        <select class="form-select" name="contrato_id" required onchange="app.loadEquiposForMasivo(this.value)">
          <option value="">Seleccione un contrato</option>
          ${filteredContratos.map(c => `<option value="${c.id}">${c.numero_contrato}</option>`).join('')}
        </select>
      </div>

      <div id="equiposListContainer" style="display: none;">
        <div class="form-group">
          <label class="form-label required">Fecha de Lectura</label>
          <input type="date" class="form-input" name="fecha_lectura" value="${getCurrentDate()}" required>
        </div>

        <div class="form-group">
          <label class="form-label">Equipos del Contrato (Muestra los instalados)</label>
          <div id="equiposList" style="max-height: 400px; overflow-y: auto; display: grid; gap: var(--spacing-md);">
            <!-- Equipos loaded dynamically -->
          </div>
        </div>
      </div>
    </form >
    `;

  const modal = createModal(
    'Registro Masivo de Contadores',
    formHTML,
    [
      {
        text: 'Cancelar',
        class: 'btn-secondary',
        onClick: () => closeModal(modal)
      },
      {
        text: 'Registrar Todo',
        class: 'btn-primary',
        onClick: () => {
          showToast('Registro masivo en desarrollo. Use el registro individual por ahora.', 'info');
        }
      }
    ],
    'lg'
  );

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('active'), 10);
};

App.prototype.loadEquiposForMasivo = function (contratoId) {
  if (!contratoId) {
    document.getElementById('equiposListContainer').style.display = 'none';
    return;
  }

  const equipos = db.getBy('equipos', 'contrato_id', parseInt(contratoId))
    .filter(e => e.estado === 'instalado');
  const modelos = db.getData('modelos');
  const marcas = db.getData('marcas');

  const container = document.getElementById('equiposList');
  container.innerHTML = '';

  if (equipos.length === 0) {
    container.innerHTML = '<p class="text-tertiary">No hay equipos instalados en este contrato.</p>';
  } else {
    equipos.forEach(equipo => {
      const modelo = modelos.find(m => m.id === equipo.modelo_id);
      const marca = modelo ? marcas.find(m => m.id === modelo.marca_id) : null;
      const isColor = modelo?.tipo_impresion === 'color';

      const div = document.createElement('div');
      div.className = 'card';
      div.style.padding = 'var(--spacing-md)';
      div.innerHTML = `
    < div style = "display: flex; justify-content: space-between; margin-bottom: var(--spacing-sm);" >
          <strong>${modelo ? modelo.nombre : 'N/A'}</strong>
          <code>${equipo.numero_serie}</code>
        </div >
    <div style="display: grid; grid-template-columns: ${isColor ? '1fr 1fr' : '1fr'}; gap: var(--spacing-md);">
      <div class="form-group mb-0">
        <label class="form-label">B/N Actual</label>
        <input type="number" class="form-input" data-equipo-id="${equipo.id}" data-type="bn" placeholder="Lectura BN">
      </div>
      ${isColor ? `
          <div class="form-group mb-0">
            <label class="form-label">Color Actual</label>
            <input type="number" class="form-input" data-equipo-id="${equipo.id}" data-type="color" placeholder="Lectura Color">
          </div>
          ` : ''}
    </div>
  `;
      container.appendChild(div);
    });
  }

  document.getElementById('equiposListContainer').style.display = 'block';
};

App.prototype.exportContadores = function () {
  showToast('Exportación de contadores en desarrollo', 'info');
};

App.prototype.getCurrentYearMonth = function () {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year} -${month} `;
};
