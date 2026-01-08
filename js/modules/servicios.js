/**
 * CONSEROUT - Services Module
 * Installations, maintenance, and consumable changes
 */

// Extend App class with installations module
App.prototype.loadInstalacionesModule = function (container) {
  container.innerHTML = `
    <div class="module-container">
      <div class="module-header">
        <div style="display: flex; flex-direction: column; gap: var(--spacing-xs);">
          <h2 class="module-title" style="margin: 0;">Instalaciones de Equipos</h2>
          <div id="pendingInstallationsBadge" style="display: flex; align-items: center; gap: var(--spacing-sm); color: var(--color-text-secondary); font-size: var(--font-size-sm);">
            <span class="status-dot status-warning"></span>
            <span id="pendingInstallCountText">Calculando equipos por instalar...</span>
          </div>
        </div>
        <div class="module-actions">
          <button class="btn btn-secondary" onclick="app.exportInstalacionesCSV()">
            <span>📄</span>
            <span>Exportar CSV</span>
          </button>
          <button class="btn btn-primary" onclick="app.showInstalacionForm()">
            <span>+</span>
            <span>Nueva Instalación</span>
          </button>
        </div>
      </div>

      <div class="filters-container">
        <div class="filters-grid">
          <div class="form-group m-0">
            <label class="form-label">Desde</label>
            <input type="date" class="form-input" id="filterFechaDesdeInst">
          </div>
          <div class="form-group m-0">
            <label class="form-label">Hasta</label>
            <input type="date" class="form-input" id="filterFechaHastaInst" value="${getCurrentDate()}">
          </div>
          <div class="form-group m-0">
            <label class="form-label">Contrato</label>
            <select class="form-select" id="filterContratoInst">
              <option value="">Todos los contratos</option>
            </select>
          </div>
          <div class="form-group m-0">
            <label class="form-label">Técnico</label>
            <select class="form-select" id="filterTecnicoInst">
              <option value="">Todos los técnicos</option>
            </select>
          </div>
          <div class="form-group m-0">
            <label class="form-label">Buscar</label>
            <input type="text" class="form-input" id="searchInstalaciones" placeholder="Serie, Marca, Modelo...">
          </div>
        </div>
      </div>

      <div class="card">
        <div class="table-container">
          <table class="table" id="instalacionesTable">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Contrato</th>
                <th>Equipo</th>
                <th>Marca</th>
                <th>N° Serie</th>
                <th>Ubicación</th>
                <th>Lecturas Iniciales</th>
                <th>Técnico</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="instalacionesTableBody">
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  this.renderInstalacionesTable();
  this.setupInstalacionesFilters();
  this.updatePendingInstallationsIndicator();
};

App.prototype.setupInstalacionesFilters = function () {
  const filters = ['filterFechaDesdeInst', 'filterFechaHastaInst', 'filterTecnicoInst', 'filterContratoInst'];
  filters.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', () => this.renderInstalacionesTable());
    }
  });

  const searchInput = document.getElementById('searchInstalaciones');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => this.renderInstalacionesTable(), 300));
  }
};

App.prototype.updatePendingInstallationsIndicator = function () {
  const currUser = auth.getCurrentUser();
  const isTechnician = currUser && currUser.perfil_id === 3;
  let equipos = db.getData('equipos').filter(e => e.estado === 'sin_instalar');

  if (isTechnician) {
    const asignaciones = db.getData('tecnicos_contrato').filter(tc => tc.tecnico_id === currUser.id);
    const assignedContratosIds = asignaciones.map(a => a.contrato_id);
    equipos = equipos.filter(e => e.contrato_id && assignedContratosIds.includes(e.contrato_id));
  }

  const count = equipos.length;
  const badgeText = document.getElementById('pendingInstallCountText');
  if (badgeText) {
    badgeText.innerHTML = `<strong>${count}</strong> equipo(s) pendientes por instalar`;
    badgeText.style.color = count > 0 ? 'var(--color-warning)' : 'var(--color-text-tertiary)';
  }
};

App.prototype.renderInstalacionesTable = function () {
  const instalaciones = db.getData('instalaciones');
  const servicios = db.getData('servicios');
  const equipos = db.getData('equipos');
  const contratos = db.getData('contratos');
  const modelos = db.getData('modelos');
  const marcas = db.getData('marcas');
  const usuarios = db.getData('usuarios');
  const tbody = document.getElementById('instalacionesTableBody');

  if (!tbody) return;

  const currUser = auth.getCurrentUser();
  const isTechnician = currUser && currUser.perfil_id === 3;
  const canDelete = currUser && (currUser.perfil_id === 1 || currUser.perfil_id === 2 || currUser.perfil.permisos.includes('all'));

  let assignedContratosIds = [];

  if (isTechnician) {
    const asignaciones = db.getData('tecnicos_contrato').filter(tc => tc.tecnico_id === currUser.id);
    assignedContratosIds = asignaciones.map(a => a.contrato_id);
  }

  tbody.innerHTML = '';

  // Populate filter options
  const filterTecnico = document.getElementById('filterTecnicoInst');
  if (filterTecnico && filterTecnico.options.length === 1) {
    usuarios.filter(u => u.perfil_id === 3).forEach(tecnico => {
      const option = document.createElement('option');
      option.value = tecnico.id;
      option.textContent = tecnico.nombre;
      filterTecnico.appendChild(option);
    });
  }

  const filterContrato = document.getElementById('filterContratoInst');
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
  const desde = document.getElementById('filterFechaDesdeInst')?.value;
  const hasta = document.getElementById('filterFechaHastaInst')?.value;
  const tecnicoId = document.getElementById('filterTecnicoInst')?.value;
  const contratoId = document.getElementById('filterContratoInst')?.value;
  const searchTerm = document.getElementById('searchInstalaciones')?.value.toLowerCase();

  const filteredInstalaciones = instalaciones.filter(instalacion => {
    const servicio = servicios.find(s => s.id === instalacion.servicio_id);
    if (!servicio) return false;

    const equipo = equipos.find(e => e.id === instalacion.equipo_id);
    const modelo = equipo ? modelos.find(m => m.id === equipo.modelo_id) : null;
    const marca = modelo ? marcas.find(m => m.id === modelo.marca_id) : null;

    // Tech filter
    if (isTechnician) {
      if (!equipo || !equipo.contrato_id || !assignedContratosIds.includes(equipo.contrato_id)) return false;
    }

    if (desde && servicio.fecha < desde) return false;
    if (hasta && servicio.fecha > hasta) return false;
    if (tecnicoId && servicio.tecnico_id != tecnicoId) return false;
    if (contratoId && equipo && equipo.contrato_id != contratoId) return false;

    // Advanced Search
    if (searchTerm) {
      const serieMatch = equipo && equipo.numero_serie.toLowerCase().includes(searchTerm);
      const modeloMatch = modelo && modelo.nombre.toLowerCase().includes(searchTerm);
      const marcaMatch = marca && marca.nombre.toLowerCase().includes(searchTerm);
      if (!serieMatch && !modeloMatch && !marcaMatch) return false;
    }

    return true;
  });

  // Sort by date (newest first)
  filteredInstalaciones.sort((a, b) => {
    const sA = servicios.find(s => s.id === a.servicio_id);
    const sB = servicios.find(s => s.id === b.servicio_id);
    return new Date(sB.fecha) - new Date(sA.fecha);
  });

  filteredInstalaciones.forEach(instalacion => {
    const servicio = servicios.find(s => s.id === instalacion.servicio_id);
    const equipo = equipos.find(e => e.id === instalacion.equipo_id);
    const modelo = equipo ? modelos.find(m => m.id === equipo.modelo_id) : null;
    const marca = modelo ? marcas.find(m => m.id === modelo.marca_id) : null;
    const tecnico = servicio ? usuarios.find(u => u.id === servicio.tecnico_id) : null;
    const contrato = equipo ? contratos.find(c => c.id === equipo.contrato_id) : null;

    // Get initial counters from the reading history
    const contadores = db.getData('contadores_equipos').filter(c => c.equipo_id === instalacion.equipo_id);
    const initRecord = contadores.find(c => c.es_inicial);
    const isColor = modelo?.tipo_impresion === 'color';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${servicio ? formatDate(servicio.fecha) : '-'}</td>
      <td><strong>${contrato ? contrato.numero_contrato : 'N/A'}</strong></td>
      <td>${modelo ? modelo.nombre : 'N/A'}</td>
      <td>${marca ? marca.nombre : '-'}</td>
      <td><code>${equipo ? equipo.numero_serie : '-'}</code></td>
      <td>${instalacion.ubicacion || '-'}</td>
      <td>
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <span class="badge badge-primary" style="font-size: 0.7rem; justify-content: flex-start;">B/N: ${formatNumber(initRecord ? initRecord.contador_bn : 0)}</span>
          ${isColor ? `<span class="badge badge-secondary" style="font-size: 0.7rem; justify-content: flex-start;">Color: ${formatNumber(initRecord ? initRecord.contador_color : 0)}</span>` : ''}
        </div>
      </td>
      <td>${tecnico ? tecnico.nombre : '-'}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-sm btn-ghost" onclick="app.viewInstalacion(${instalacion.id})" title="Ver">
            👁️
          </button>
          ${canDelete ? `
          <button class="btn btn-sm btn-ghost text-danger" onclick="app.deleteInstalacion(${instalacion.id})" title="Eliminar Instalación">
            🗑️
          </button>
          ` : ''}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (filteredInstalaciones.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          <div class="empty-state-icon">🔧</div>
          <div class="empty-state-title">No hay instalaciones registradas</div>
        </td>
      </tr>
    `;
  }
};

App.prototype.deleteInstalacion = function (id) {
  const instalacion = db.getById('instalaciones', id);
  if (!instalacion) return;

  showConfirm(
    'Eliminar Instalación',
    '¿Estás seguro de eliminar esta instalación? Esto <b>revertirá el equipo a estado "Sin Instalar"</b> y borrará los contadores iniciales asociados. Esta acción no se puede deshacer.',
    () => {
      const servicioId = instalacion.servicio_id;
      const equipoId = instalacion.equipo_id;

      // 1. Revert Equipment Status
      db.update('equipos', equipoId, {
        estado: 'sin_instalar',
        ubicacion: null,
        fecha_instalacion: null
      });

      // 2. Delete Initial Counters (if any linked to this date/installation)
      const contadores = db.getData('contadores_equipos');
      const initRecord = contadores.find(c => c.equipo_id === equipoId && c.es_inicial);
      if (initRecord) {
        db.delete('contadores_equipos', initRecord.id);
      }

      // 3. Delete Installation Record
      db.delete('instalaciones', id);

      // 4. Delete Service Record
      db.delete('servicios', servicioId);

      showToast('Instalación eliminada y equipo revertido correctamente', 'success');
      this.renderInstalacionesTable();
      this.updatePendingInstallationsIndicator();
    }
  );
};

App.prototype.exportInstalacionesCSV = function () {
  const instalaciones = db.getData('instalaciones');
  const servicios = db.getData('servicios');
  const equipos = db.getData('equipos');
  const contratos = db.getData('contratos');
  const modelos = db.getData('modelos');
  const usuarios = db.getData('usuarios');

  // Apply inputs/filters
  const desde = document.getElementById('filterFechaDesdeInst')?.value;
  const hasta = document.getElementById('filterFechaHastaInst')?.value;
  const tecnicoId = document.getElementById('filterTecnicoInst')?.value;
  const contratoId = document.getElementById('filterContratoInst')?.value;

  const filtered = instalaciones.filter(inst => {
    const srv = servicios.find(s => s.id === inst.servicio_id);
    const eq = equipos.find(e => e.id === inst.equipo_id);
    if (!srv) return false;

    if (desde && srv.fecha < desde) return false;
    if (hasta && srv.fecha > hasta) return false;
    if (tecnicoId && srv.tecnico_id != tecnicoId) return false;
    if (contratoId && eq && eq.contrato_id != contratoId) return false;
    return true;
  });

  let csv = [];
  csv.push('"REPORTE DE INSTALACIONES"');
  csv.push(`"Fecha Reporte:","${getCurrentDate()}"`);
  csv.push("");
  csv.push('"Fecha","Contrato","Equipo","Serie","Ubicacion","Tecnico","Contador Inicial BN","Contador Inicial Color"');

  filtered.forEach(inst => {
    const srv = servicios.find(s => s.id === inst.servicio_id);
    const eq = equipos.find(e => e.id === inst.equipo_id);
    const mod = eq ? modelos.find(m => m.id === eq.modelo_id) : null;
    const con = eq ? contratos.find(c => c.id === eq.contrato_id) : null;
    const tec = srv ? usuarios.find(u => u.id === srv.tecnico_id) : null;

    // Counters
    const counters = db.getData('contadores_equipos').filter(c => c.equipo_id === inst.equipo_id);
    const init = counters.find(c => c.es_inicial);

    const row = [
      srv ? srv.fecha : '',
      con ? con.numero_contrato : 'N/A',
      mod ? mod.nombre : 'N/A',
      eq ? eq.numero_serie : 'N/A',
      inst.ubicacion,
      tec ? tec.nombre : 'N/A',
      init ? (init.contador_bn || 0) : 0,
      init ? (init.contador_color || 0) : 0
    ];
    csv.push(row.map(v => `"${v}"`).join(','));
  });

  downloadFile(csv.join("\n"), `Instalaciones_${getCurrentDate()}.csv`, 'text/csv;charset=utf-8');
  showToast('Reporte de instalaciones generado', 'success');
};

App.prototype.showInstalacionForm = function () {
  const currUser = auth.getCurrentUser();
  const isTechnician = currUser && currUser.perfil_id === 3;
  let equipos = db.getData('equipos').filter(e => e.estado === 'sin_instalar');

  if (isTechnician) {
    const asignaciones = db.getData('tecnicos_contrato').filter(tc => tc.tecnico_id === currUser.id);
    const assignedContratosIds = asignaciones.map(a => a.contrato_id);
    equipos = equipos.filter(e => e.contrato_id && assignedContratosIds.includes(e.contrato_id));
  }

  const tecnicos = db.getData('usuarios').filter(u => u.perfil_id === 3);
  const modelos = db.getData('modelos');

  const formHTML = `
    <form id="instalacionForm">
      <div class="form-group">
        <label class="form-label required">Equipo</label>
        <select class="form-select" name="equipo_id" required onchange="app.updateInstalacionCounterFields(this.value)">
          <option value="">Seleccione un equipo</option>
          ${equipos.map(e => {
    const modelo = modelos.find(m => m.id === e.modelo_id);
    return `<option value="${e.id}">${modelo ? modelo.nombre : 'N/A'} - ${e.numero_serie}</option>`;
  }).join('')}
        </select>
      </div>
      
      <div id="instalacionCounterFields">
        <!-- Dinamicamente cargado -->
      </div>
      
      <div class="form-group">
        <label class="form-label required">Técnico</label>
        <select class="form-select" name="tecnico_id" required>
          <option value="">Seleccione un técnico</option>
          ${tecnicos.map(t => `<option value="${t.id}">${t.nombre}</option>`).join('')}
        </select>
      </div>
      
      <div class="form-group">
        <label class="form-label required">Fecha</label>
        <input type="date" class="form-input" name="fecha" value="${getCurrentDate()}" required>
      </div>
      
      <div class="form-group">
        <label class="form-label">Observaciones</label>
        <textarea class="form-textarea" name="descripcion" placeholder="Detalles de la instalación..."></textarea>
      </div>
    </form>
  `;
  const modal = createModal(
    'Nueva Instalación',
    formHTML,
    [
      {
        text: 'Cancelar',
        class: 'btn-secondary',
        onClick: () => closeModal(modal)
      },
      {
        text: 'Registrar',
        class: 'btn-primary',
        onClick: () => {
          const form = document.getElementById('instalacionForm');
          if (!form.checkValidity()) {
            form.reportValidity();
            return;
          }

          const formData = new FormData(form);
          const equipoId = parseInt(formData.get('equipo_id'));
          const bnInic = parseInt(formData.get('contador_bn_inicial')) || 0;
          const colorInic = parseInt(formData.get('contador_color_inicial')) || 0;

          // Create service
          const newServicio = db.insert('servicios', {
            equipo_id: equipoId,
            tecnico_id: parseInt(formData.get('tecnico_id')),
            tipo_servicio: 'instalacion',
            fecha: formData.get('fecha'),
            descripcion: formData.get('descripcion'),
            estado: 'completado'
          });

          // Create installation record
          db.insert('instalaciones', {
            servicio_id: newServicio.id,
            equipo_id: equipoId,
            ubicacion: formData.get('ubicacion'),
            contador_inicial: bnInic + colorInic // Combined for legacy compatibility
          });

          // Update equipment
          db.update('equipos', equipoId, {
            estado: 'instalado',
            ubicacion: formData.get('ubicacion'),
            fecha_instalacion: formData.get('fecha')
          });

          // Create or update initial counter (baseline)
          const contadores = db.getData('contadores_equipos').filter(c => c.equipo_id === equipoId);
          const existingInit = contadores.find(c => c.es_inicial);

          const counterData = {
            equipo_id: equipoId,
            fecha_lectura: formData.get('fecha'),
            contador_bn: bnInic,
            ant_bn: bnInic,
            consumo_bn: 0,
            contador_color: colorInic,
            ant_color: colorInic,
            consumo_color: 0,
            contador_actual: bnInic + colorInic,
            es_inicial: true,
            usuario_registro_id: auth.getCurrentUser().id
          };

          if (existingInit) {
            db.update('contadores_equipos', existingInit.id, counterData);
          } else {
            db.insert('contadores_equipos', counterData);
          }

          showToast('Instalación registrada exitosamente', 'success');
          closeModal(modal);
          this.renderInstalacionesTable();
          this.updatePendingInstallationsIndicator();
        }
      }
    ]
  );

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('active'), 10);
};

App.prototype.updateInstalacionCounterFields = function (equipoId) {
  const container = document.getElementById('instalacionCounterFields');
  if (!container || !equipoId) {
    container.innerHTML = '';
    return;
  }

  const equipo = db.getById('equipos', parseInt(equipoId));
  const modelo = db.getById('modelos', equipo.modelo_id);
  const isColor = modelo?.tipo_impresion === 'color';

  // Buscar si ya tiene un contador inicial (de cuando se registró como usado)
  const contadores = db.getData('contadores_equipos').filter(c => c.equipo_id === equipo.id);
  const initRecord = contadores.find(c => c.es_inicial);
  const initBN = initRecord ? (initRecord.contador_bn || 0) : 0;
  const initColor = initRecord ? (initRecord.contador_color || 0) : 0;

  container.innerHTML = `
    <div class="form-group">
      <label class="form-label required">Ubicación de Instalación</label>
      <input type="text" class="form-input" name="ubicacion" value="${equipo.ubicacion || ''}" placeholder="Ej: Piso 3 - Administración" required>
    </div>
    
    <div class="form-section-title">Lecturas Iniciales</div>
    <div style="display: grid; grid-template-columns: ${isColor ? '1fr 1fr' : '1fr'}; gap: var(--spacing-md); background: var(--color-bg-tertiary); padding: var(--spacing-md); border-radius: var(--radius-md); margin-bottom: var(--spacing-lg);">
      <div class="form-group mb-0">
        <label class="form-label required">BN Inicial</label>
        <input type="number" class="form-input" name="contador_bn_inicial" value="${initBN}" min="0" required>
      </div>
      ${isColor ? `
      <div class="form-group mb-0">
        <label class="form-label required">Color Inicial</label>
        <input type="number" class="form-input" name="contador_color_inicial" value="${initColor}" min="0" required>
      </div>
      ` : ''}
    </div>
  `;
};

App.prototype.viewInstalacion = function (id) {
  const instalacion = db.getById('instalaciones', id);
  const servicio = db.getById('servicios', instalacion.servicio_id);
  const equipo = db.getById('equipos', instalacion.equipo_id);
  const modelo = db.getById('modelos', equipo.modelo_id);
  const tecnico = db.getById('usuarios', servicio.tecnico_id);
  const contrato = db.getById('contratos', equipo.contrato_id);

  // Get initial counters
  const contadores = db.getData('contadores_equipos').filter(c => c.equipo_id === equipo.id);
  const initRecord = contadores.find(c => c.es_inicial);
  const isColor = modelo?.tipo_impresion === 'color';

  const content = `
    <div style="display: grid; gap: var(--spacing-lg);">
      <div class="detail-section">
        <h4 class="detail-section-title">Detalles de la Instalación</h4>
        <div class="detail-row">
          <div class="detail-label">Fecha:</div>
          <div class="detail-value">${formatDate(servicio.fecha)}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Contrato:</div>
          <div class="detail-value"><strong>${contrato ? contrato.numero_contrato : 'N/A'}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Equipo:</div>
          <div class="detail-value">${modelo.nombre}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">N° Serie:</div>
          <div class="detail-value"><code>${equipo.numero_serie}</code></div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Ubicación:</div>
          <div class="detail-value">${instalacion.ubicacion}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Lecturas Iniciales:</div>
          <div class="detail-value">
            <div style="display: grid; gap: 4px;">
              <span><strong>B/N:</strong> ${formatNumber(initRecord ? initRecord.contador_bn : 0)}</span>
              ${isColor ? `<span><strong>Color:</strong> ${formatNumber(initRecord ? initRecord.contador_color : 0)}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Técnico:</div>
          <div class="detail-value">${tecnico ? tecnico.nombre : 'N/A'}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Estado:</div>
          <div class="detail-value">${getStatusBadge(servicio.estado)}</div>
        </div>
      </div>
      
      ${servicio.descripcion ? `
        <div class="detail-section">
          <h4 class="detail-section-title">Observaciones</h4>
          <p>${servicio.descripcion}</p>
        </div>
      ` : ''}
    </div>
  `;

  const modal = createModal('Detalles de Instalación', content, [
    {
      text: 'Cerrar',
      class: 'btn-secondary',
      onClick: () => closeModal(modal)
    }
  ]);

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('active'), 10);
};

// Extend App class with maintenance module
App.prototype.loadMantenimientosModule = function (container) {
  container.innerHTML = `
    <div class="module-container">
      <div class="module-header">
        <h2 class="module-title">Mantenimientos</h2>
        <div class="module-actions">
          <button class="btn btn-secondary" onclick="app.exportMantenimientosCSV()">
            <span>📄</span>
            <span>Exportar CSV</span>
          </button>
          <button class="btn btn-primary" onclick="app.showMantenimientoForm()">
            <span>+</span>
            <span>Nuevo Mantenimiento</span>
          </button>
        </div>
      </div>

      <div class="filters-container">
        <div class="filters-grid">
          <div class="form-group m-0">
            <label class="form-label">Tipo</label>
            <select class="form-select" id="filterTipoMant">
              <option value="">Todos</option>
              <option value="1">Preventivo</option>
              <option value="2">Correctivo</option>
            </select>
          </div>
          <div class="form-group m-0">
            <label class="form-label">Contrato</label>
            <select class="form-select" id="filterContratoMant">
              <option value="">Todos los contratos</option>
            </select>
          </div>
          <div class="form-group m-0">
            <label class="form-label">Desde</label>
            <input type="date" class="form-input" id="filterFechaDesdeMant">
          </div>
          <div class="form-group m-0">
            <label class="form-label">Hasta</label>
            <input type="date" class="form-input" id="filterFechaHastaMant" value="${getCurrentDate()}">
          </div>
          <div class="form-group m-0">
            <label class="form-label">Buscar</label>
            <input type="text" class="form-input" id="searchMantenimientos" placeholder="Serie, Marca, Modelo...">
          </div>
        </div>
      </div>

      <div class="card">
        <div class="table-container">
          <table class="table" id="mantenimientosTable">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Contrato</th>
                <th>Equipo</th>
                <th>Marca</th>
                <th>N° Serie</th>
                <th>Técnico</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="mantenimientosTableBody">
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  this.renderMantenimientosTable();
  this.setupMantenimientosFilters();
};

App.prototype.setupMantenimientosFilters = function () {
  const filters = ['filterTipoMant', 'filterFechaDesdeMant', 'filterFechaHastaMant', 'filterContratoMant'];
  filters.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', () => this.renderMantenimientosTable());
    }
  });

  const searchInput = document.getElementById('searchMantenimientos');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => this.renderMantenimientosTable(), 300));
  }
};

App.prototype.renderMantenimientosTable = function () {
  const mantenimientos = db.getData('mantenimientos');
  const servicios = db.getData('servicios');
  const equipos = db.getData('equipos');
  const contratos = db.getData('contratos');
  const modelos = db.getData('modelos');
  const marcas = db.getData('marcas');
  const usuarios = db.getData('usuarios');
  const tiposMant = db.getData('tipos_mantenimiento');
  const tbody = document.getElementById('mantenimientosTableBody');

  if (!tbody) return;

  const currUser = auth.getCurrentUser();
  const isTechnician = currUser && currUser.perfil_id === 3;
  const canDelete = currUser && (currUser.perfil_id === 1 || currUser.perfil_id === 2 || currUser.perfil.permisos.includes('all'));

  let assignedContratosIds = [];

  if (isTechnician) {
    const asignaciones = db.getData('tecnicos_contrato').filter(tc => tc.tecnico_id === currUser.id);
    assignedContratosIds = asignaciones.map(a => a.contrato_id);
  }

  tbody.innerHTML = '';

  // Populate contract filter
  const filterContrato = document.getElementById('filterContratoMant');
  if (filterContrato && filterContrato.options.length === 1) {
    contratos.filter(c => c.estado === 'vigente').forEach(contrato => {
      // Tech filter
      if (isTechnician && !assignedContratosIds.includes(contrato.id)) return;
      const option = document.createElement('option');
      option.value = contrato.id;
      option.textContent = contrato.numero_contrato;
      filterContrato.appendChild(option);
    });
  }

  // Get Filters
  const tipoFilter = document.getElementById('filterTipoMant')?.value;
  const desde = document.getElementById('filterFechaDesdeMant')?.value;
  const hasta = document.getElementById('filterFechaHastaMant')?.value;
  const contratoId = document.getElementById('filterContratoMant')?.value;
  const searchTerm = document.getElementById('searchMantenimientos')?.value.toLowerCase();

  const filteredMantenimientos = mantenimientos.filter(mant => {
    const servicio = servicios.find(s => s.id === mant.servicio_id);
    if (!servicio) return false;

    const equipo = equipos.find(e => e.id === servicio.equipo_id);
    const modelo = equipo ? modelos.find(m => m.id === equipo.modelo_id) : null;
    const marca = modelo ? marcas.find(m => m.id === modelo.marca_id) : null;

    // Tech filter
    if (isTechnician) {
      if (!equipo || !equipo.contrato_id || !assignedContratosIds.includes(equipo.contrato_id)) return false;
    }

    if (tipoFilter && mant.tipo_mantenimiento_id != tipoFilter) return false;
    if (desde && servicio.fecha < desde) return false;
    if (hasta && servicio.fecha > hasta) return false;
    if (contratoId && equipo && equipo.contrato_id != contratoId) return false;

    // Advanced Search
    if (searchTerm) {
      const serieMatch = equipo && equipo.numero_serie.toLowerCase().includes(searchTerm);
      const modeloMatch = modelo && modelo.nombre.toLowerCase().includes(searchTerm);
      const marcaMatch = marca && marca.nombre.toLowerCase().includes(searchTerm);
      if (!serieMatch && !modeloMatch && !marcaMatch) return false;
    }

    return true;
  });

  // Sort by date desc
  filteredMantenimientos.sort((a, b) => {
    const sA = servicios.find(s => s.id === a.servicio_id);
    const sB = servicios.find(s => s.id === b.servicio_id);
    return new Date(sB.fecha) - new Date(sA.fecha);
  });

  filteredMantenimientos.forEach(mant => {
    const servicio = servicios.find(s => s.id === mant.servicio_id);
    const equipo = servicio ? equipos.find(e => e.id === servicio.equipo_id) : null;
    const modelo = equipo ? modelos.find(m => m.id === equipo.modelo_id) : null;
    const marca = modelo ? marcas.find(m => m.id === modelo.marca_id) : null;
    const tecnico = servicio ? usuarios.find(u => u.id === servicio.tecnico_id) : null;
    const tipo = tiposMant.find(t => t.id === mant.tipo_mantenimiento_id);
    const contrato = equipo ? contratos.find(c => c.id === equipo.contrato_id) : null;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${servicio ? formatDate(servicio.fecha) : '-'}</td>
      <td>
        <span class="badge ${tipo && tipo.id === 1 ? 'badge-info' : 'badge-warning'}">
          ${tipo ? tipo.nombre : 'N/A'}
        </span>
      </td>
      <td><strong>${contrato ? contrato.numero_contrato : 'N/A'}</strong></td>
      <td>${modelo ? modelo.nombre : 'N/A'}</td>
      <td>${marca ? marca.nombre : '-'}</td>
      <td><code>${equipo ? equipo.numero_serie : '-'}</code></td>
      <td>${tecnico ? tecnico.nombre : '-'}</td>
      <td>${mant.descripcion ? mant.descripcion.substring(0, 50) + '...' : '-'}</td>
      <td>${servicio ? getStatusBadge(servicio.estado) : '-'}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-sm btn-ghost" onclick="app.viewMantenimiento(${mant.id})" title="Ver">
            👁️
          </button>
          ${canDelete ? `
          <button class="btn btn-sm btn-ghost text-danger" onclick="app.deleteMantenimiento(${mant.id})" title="Eliminar Mantenimiento">
             🗑️
          </button>
          ` : ''}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (filteredMantenimientos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          <div class="empty-state-icon">🛠️</div>
          <div class="empty-state-title">No hay mantenimientos registrados</div>
        </td>
      </tr>
    `;
  }
};

App.prototype.deleteMantenimiento = function (id) {
  const mant = db.getById('mantenimientos', id);
  if (!mant) return;

  showConfirm(
    'Eliminar Mantenimiento',
    '¿Estás seguro de eliminar este registro de mantenimiento? Esta accion no se puede deshacer.',
    () => {
      const servicioId = mant.servicio_id;

      // 1. Delete Mantenimiento Record
      db.delete('mantenimientos', id);

      // 2. Delete Service Record
      db.delete('servicios', servicioId);

      showToast('Mantenimiento eliminado correctamente', 'success');
      this.renderMantenimientosTable();
    }
  );
};

App.prototype.exportMantenimientosCSV = function () {
  const mantenimientos = db.getData('mantenimientos');
  const servicios = db.getData('servicios');
  const equipos = db.getData('equipos');
  const contratos = db.getData('contratos');
  const modelos = db.getData('modelos');
  const usuarios = db.getData('usuarios');
  const tiposMant = db.getData('tipos_mantenimiento');

  // Apply inputs/filters
  const tipoFilter = document.getElementById('filterTipoMant')?.value;
  const desde = document.getElementById('filterFechaDesdeMant')?.value;
  const hasta = document.getElementById('filterFechaHastaMant')?.value;
  const contratoId = document.getElementById('filterContratoMant')?.value;

  const filtered = mantenimientos.filter(mant => {
    const srv = servicios.find(s => s.id === mant.servicio_id);
    const eq = equipos.find(e => e.id === srv.equipo_id);
    if (!srv) return false;

    if (tipoFilter && mant.tipo_mantenimiento_id != tipoFilter) return false;
    if (desde && srv.fecha < desde) return false;
    if (hasta && srv.fecha > hasta) return false;
    if (contratoId && eq && eq.contrato_id != contratoId) return false;
    return true;
  });

  let csv = [];
  csv.push('"REPORTE DE MANTENIMIENTOS"');
  csv.push(`"Fecha Reporte:","${getCurrentDate()}"`);
  csv.push("");
  csv.push('"Fecha","Tipo","Contrato","Equipo","Serie","Tecnico","Descripcion","Materiales"');

  filtered.forEach(mant => {
    const srv = servicios.find(s => s.id === mant.servicio_id);
    const eq = equipos.find(e => e.id === srv.equipo_id);
    const mod = eq ? modelos.find(m => m.id === eq.modelo_id) : null;
    const con = eq ? contratos.find(c => c.id === eq.contrato_id) : null;
    const tec = srv ? usuarios.find(u => u.id === srv.tecnico_id) : null;
    const tipo = types = tiposMant.find(t => t.id === mant.tipo_mantenimiento_id);

    const row = [
      srv ? srv.fecha : '',
      tipo ? tipo.nombre : 'N/A',
      con ? con.numero_contrato : 'N/A',
      mod ? mod.nombre : 'N/A',
      eq ? eq.numero_serie : 'N/A',
      tec ? tec.nombre : 'N/A',
      mant.descripcion || '',
      mant.materiales_usados || ''
    ];
    csv.push(row.map(v => `"${v}"`).join(','));
  });

  downloadFile(csv.join("\n"), `Mantenimientos_${getCurrentDate()}.csv`, 'text/csv;charset=utf-8');
  showToast('Reporte de mantenimientos generado', 'success');
};

App.prototype.showMantenimientoForm = function () {
  const currUser = auth.getCurrentUser();
  const isTechnician = currUser && currUser.perfil_id === 3;
  let equipos = db.getData('equipos').filter(e => e.estado === 'instalado');

  if (isTechnician) {
    const asignaciones = db.getData('tecnicos_contrato').filter(tc => tc.tecnico_id === currUser.id);
    const assignedContratosIds = asignaciones.map(a => a.contrato_id);
    equipos = equipos.filter(e => e.contrato_id && assignedContratosIds.includes(e.contrato_id));
  }

  const tecnicos = db.getData('usuarios').filter(u => u.perfil_id === 3);
  const tiposMant = db.getData('tipos_mantenimiento');
  const modelos = db.getData('modelos');

  const formHTML = `
    <form id="mantenimientoForm">
      <div class="form-group">
        <label class="form-label required">Tipo de Mantenimiento</label>
        <select class="form-select" name="tipo_mantenimiento_id" required>
          ${tiposMant.map(t => `<option value="${t.id}">${t.nombre}</option>`).join('')}
        </select>
      </div>
      
      <div class="form-group">
        <label class="form-label required">Equipo</label>
        <select class="form-select" name="equipo_id" required>
          <option value="">Seleccione un equipo</option>
          ${equipos.map(e => {
    const modelo = modelos.find(m => m.id === e.modelo_id);
    return `<option value="${e.id}">${modelo ? modelo.nombre : 'N/A'} - ${e.numero_serie} (${e.ubicacion})</option>`;
  }).join('')}
        </select>
      </div>
      
      <div class="form-group">
        <label class="form-label required">Técnico</label>
        <select class="form-select" name="tecnico_id" required>
          <option value="">Seleccione un técnico</option>
          ${tecnicos.map(t => `<option value="${t.id}">${t.nombre}</option>`).join('')}
        </select>
      </div>
      
      <div class="form-group">
        <label class="form-label required">Fecha</label>
        <input type="date" class="form-input" name="fecha" value="${getCurrentDate()}" required>
      </div>
      
      <div class="form-group">
        <label class="form-label required">Descripción</label>
        <textarea class="form-textarea" name="descripcion" placeholder="Detalle del mantenimiento realizado..." required></textarea>
      </div>
      
      <div class="form-group">
        <label class="form-label">Materiales Usados</label>
        <textarea class="form-textarea" name="materiales_usados" placeholder="Lista de materiales utilizados..."></textarea>
      </div>
    </form>
  `;

  const modal = createModal(
    'Nuevo Mantenimiento',
    formHTML,
    [
      {
        text: 'Cancelar',
        class: 'btn-secondary',
        onClick: () => closeModal(modal)
      },
      {
        text: 'Registrar',
        class: 'btn-primary',
        onClick: () => {
          const form = document.getElementById('mantenimientoForm');
          if (!form.checkValidity()) {
            form.reportValidity();
            return;
          }

          const formData = new FormData(form);

          // Create service
          const servicioId = db.insert('servicios', {
            equipo_id: parseInt(formData.get('equipo_id')),
            tecnico_id: parseInt(formData.get('tecnico_id')),
            tipo_servicio: 'mantenimiento',
            fecha: formData.get('fecha'),
            descripcion: formData.get('descripcion'),
            estado: 'completado'
          }).id;

          // Create maintenance
          db.insert('mantenimientos', {
            servicio_id: servicioId,
            tipo_mantenimiento_id: parseInt(formData.get('tipo_mantenimiento_id')),
            descripcion: formData.get('descripcion'),
            materiales_usados: formData.get('materiales_usados')
          });

          showToast('Mantenimiento registrado exitosamente', 'success');
          closeModal(modal);
          this.renderMantenimientosTable();
        }
      }
    ]
  );

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('active'), 10);
};

App.prototype.viewMantenimiento = function (id) {
  const mant = db.getById('mantenimientos', id);
  const servicio = db.getById('servicios', mant.servicio_id);
  const equipo = db.getById('equipos', servicio.equipo_id);
  const modelo = db.getById('modelos', equipo.modelo_id);
  const tecnico = db.getById('usuarios', servicio.tecnico_id);
  const tipo = db.getById('tipos_mantenimiento', mant.tipo_mantenimiento_id);

  const content = `
    <div style="display: grid; gap: var(--spacing-lg);">
      <div class="detail-section">
        <h4 class="detail-section-title">Detalles del Mantenimiento</h4>
        <div class="detail-row">
          <div class="detail-label">Tipo:</div>
          <div class="detail-value">
            <span class="badge ${tipo.id === 1 ? 'badge-info' : 'badge-warning'}">
              ${tipo.nombre}
            </span>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Fecha:</div>
          <div class="detail-value">${formatDate(servicio.fecha)}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Equipo:</div>
          <div class="detail-value">${modelo.nombre}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">N° Serie:</div>
          <div class="detail-value"><code>${equipo.numero_serie}</code></div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Ubicación:</div>
          <div class="detail-value">${equipo.ubicacion}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Técnico:</div>
          <div class="detail-value">${tecnico.nombre}</div>
        </div>
      </div>
      
      <div class="detail-section">
        <h4 class="detail-section-title">Descripción</h4>
        <p>${mant.descripcion}</p>
      </div>
      
      ${mant.materiales_usados ? `
        <div class="detail-section">
          <h4 class="detail-section-title">Materiales Utilizados</h4>
          <p>${mant.materiales_usados}</p>
        </div>
      ` : ''}
    </div>
  `;

  const modal = createModal('Detalles de Mantenimiento', content, [
    {
      text: 'Cerrar',
      class: 'btn-secondary',
      onClick: () => closeModal(modal)
    }
  ]);

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('active'), 10);
};
