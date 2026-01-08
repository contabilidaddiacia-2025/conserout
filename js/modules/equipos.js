/**
 * CONSEROUT - Equipment Management Module
 * Complete equipment management with assignment to contracts
 */

// Extend App class with equipment module
App.prototype.loadEquiposModule = function (container) {
  container.innerHTML = `
    <div class="module-container">
      <div class="module-header">
        <h2 class="module-title">Gestión de Equipos</h2>
        <div class="module-actions">
          <button class="btn btn-primary" onclick="app.showEquipoForm()">
            <span>+</span>
            <span>Nuevo Equipo</span>
          </button>
        </div>
      </div>

      <div class="filters-container">
        <div class="filters-grid">
          <div class="search-bar">
            <input type="text" class="form-input" placeholder="Buscar equipo..." id="searchEquipo">
          </div>
          <div class="form-group m-0">
            <label class="form-label">Asignación</label>
            <select class="form-select" id="filterPoolEquipo">
              <option value="pool">Disponibles (Pool)</option>
              <option value="assigned">Asignados a Contrato</option>
              <option value="baja">Equipos de Baja</option>
              <option value="all">Todos los Equipos</option>
            </select>
          </div>
          <div class="form-group m-0" id="filterContratoGroup" style="display: none;">
            <label class="form-label">Contrato</label>
            <select class="form-select" id="filterContratoEquipo">
              <option value="">Todos los contratos</option>
            </select>
          </div>
          <div class="form-group m-0">
            <label class="form-label">Estado</label>
            <select class="form-select" id="filterEstadoEquipo">
              <option value="">Todos</option>
              <option value="instalado">Instalado</option>
              <option value="sin_instalar">Sin Instalar</option>
              <option value="bodega">Bodega</option>
              <option value="baja">De Baja</option>
            </select>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="table-container">
          <table class="table" id="equiposTable">
            <thead>
              <tr>
                <th>Equipo</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Impresión</th>
                <th>N° Serie</th>
                <th>Contrato</th>
                <th>Ubicación</th>
                <th>Estado</th>
                <th>Fecha Instalación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="equiposTableBody">
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  this.renderEquiposTable();
  this.setupEquiposFilters();
};

App.prototype.renderEquiposTable = function () {
  const equipos = db.getData('equipos');
  const modelos = db.getData('modelos');
  const marcas = db.getData('marcas');
  const contratos = db.getData('contratos');
  const tbody = document.getElementById('equiposTableBody');

  if (!tbody) return;

  tbody.innerHTML = '';

  // Populate filters
  const filterContrato = document.getElementById('filterContratoEquipo');
  const filterPool = document.getElementById('filterPoolEquipo');
  const filterPoolGroup = filterPool?.closest('.form-group');
  const filterContratoGroup = document.getElementById('filterContratoGroup');

  const currUser = auth.getCurrentUser();
  const isTechnician = currUser && currUser.perfil_id === 3;
  let assignedContratosIds = [];

  if (isTechnician) {
    const asignaciones = db.getData('tecnicos_contrato').filter(tc => tc.tecnico_id === currUser.id);
    assignedContratosIds = asignaciones.map(a => a.contrato_id);

    // Hide Pool filter for technicians
    if (filterPoolGroup) filterPoolGroup.style.display = 'none';
  }

  if (filterContrato && filterContrato.options.length === 1) {
    contratos.forEach(contrato => {
      if (isTechnician && !assignedContratosIds.includes(contrato.id)) return;

      const option = document.createElement('option');
      option.value = contrato.id;
      option.textContent = contrato.numero_contrato;
      filterContrato.appendChild(option);
    });
  }

  // Get current filter values
  const search = document.getElementById('searchEquipo')?.value.toLowerCase() || '';
  const poolFilter = filterPool?.value || 'pool'; // Default to pool
  const contratoId = filterContrato?.value;
  const estadoFilter = document.getElementById('filterEstadoEquipo')?.value;

  // Show/Hide contract filter based on pool filter
  if (filterContratoGroup) {
    filterContratoGroup.style.display = poolFilter === 'assigned' ? 'block' : 'none';
  }

  const filteredEquipos = equipos.filter(equipo => {
    // Search
    const modelo = modelos.find(m => m.id === equipo.modelo_id);
    const marca = modelo ? marcas.find(m => m.id === modelo.marca_id) : null;
    const text = `${equipo.numero_serie} ${modelo?.nombre} ${marca?.nombre}`.toLowerCase();
    if (search && !text.includes(search)) return false;

    // Restriction for technicians: Only their assigned contracts
    if (isTechnician) {
      if (!equipo.contrato_id || !assignedContratosIds.includes(equipo.contrato_id)) return false;
    } else {
      // Assignment filter (Pool vs Assigned vs Baja) for admins/others
      if (poolFilter === 'pool') {
        if (equipo.contrato_id !== null || equipo.estado === 'baja') return false;
      }
      if (poolFilter === 'assigned' && equipo.contrato_id === null) return false;
      if (poolFilter === 'baja' && equipo.estado !== 'baja') return false;
      // 'all' shows everything
    }

    // Contract filter
    if ((!isTechnician && poolFilter === 'assigned') || isTechnician) {
      if (contratoId && equipo.contrato_id != contratoId) return false;
    }

    // Status filter
    if (estadoFilter && equipo.estado !== estadoFilter) return false;

    return true;
  });

  filteredEquipos.forEach(equipo => {
    const modelo = modelos.find(m => m.id === equipo.modelo_id);
    const marca = modelo ? marcas.find(m => m.id === modelo.marca_id) : null;
    const contrato = contratos.find(c => c.id === equipo.contrato_id);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
          <span style="font-size: var(--font-size-xl);">🖨️</span>
          <strong>${modelo ? modelo.nombre : 'N/A'}</strong>
        </div>
      </td>
      <td>${marca ? marca.nombre : '-'}</td>
      <td>${modelo ? modelo.nombre : '-'}</td>
      <td>
        <span class="badge ${modelo?.tipo_impresion === 'color' ? 'badge-secondary' : 'badge-ghost'}">
          ${modelo?.tipo_impresion === 'color' ? '🎨 Color' : '⚫ B/N'}
        </span>
      </td>
      <td><code style="font-size: var(--font-size-xs);">${equipo.numero_serie}</code></td>
      <td>${contrato ? contrato.numero_contrato : '<span class="text-tertiary">Disponible</span>'}</td>
      <td>${equipo.ubicacion || '-'}</td>
      <td>${getStatusBadge(equipo.estado)}</td>
      <td>${formatDate(equipo.fecha_instalacion)}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-sm btn-ghost" onclick="app.viewEquipo(${equipo.id})" title="Ver Detalle">
            👁️
          </button>
          <button class="btn btn-sm btn-ghost" onclick="app.viewHistorialEquipo(${equipo.id})" title="Hoja de Vida">
            📜
          </button>
          <button class="btn btn-sm btn-ghost" onclick="app.editEquipo(${equipo.id})" title="Editar">
            ✏️
          </button>
          ${equipo.estado === 'baja' ? `
            <button class="btn btn-sm btn-ghost text-success" onclick="app.reactivarEquipo(${equipo.id})" title="Reactivar Equipo">
              ⚡
            </button>
          ` : `
            ${equipo.estado !== 'instalado' ? `
              <button class="btn btn-sm btn-ghost text-warning" onclick="app.darDeBajaEquipo(${equipo.id})" title="Dar de Baja">
                📉
              </button>
            ` : ''}
          `}
          <button class="btn btn-sm btn-ghost text-danger" onclick="app.deleteEquipo(${equipo.id})" title="Eliminar Permanente">
            🗑️
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (filteredEquipos.length === 0) {
    const message = poolFilter === 'pool' ? 'No hay equipos libres en el almacén' : 'No hay equipos que coincidan';
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">
          <div class="empty-state-icon">🖨️</div>
          <div class="empty-state-title">${message}</div>
        </td>
      </tr>
    `;
  }
};

App.prototype.setupEquiposFilters = function () {
  const filters = ['searchEquipo', 'filterPoolEquipo', 'filterContratoEquipo', 'filterEstadoEquipo'];
  filters.forEach(id => {
    const el = document.getElementById(id);
    if (id === 'searchEquipo') {
      el?.addEventListener('input', debounce(() => this.renderEquiposTable(), 300));
    } else {
      el?.addEventListener('change', () => this.renderEquiposTable());
    }
  });
};

App.prototype.showEquipoForm = function (equipoId = null) {
  const equipo = equipoId ? db.getById('equipos', equipoId) : null;
  const contratos = db.getData('contratos').filter(c => c.estado === 'vigente');
  const modelos = db.getData('modelos');
  const marcas = db.getData('marcas');

  const formHTML = `
    <form id="equipoForm">
      <div class="form-group">
        <label class="form-label">Contrato (Opcional)</label>
        <select class="form-select" name="contrato_id">
          <option value="">Sin asignar (Al Pool)</option>
          ${contratos.map(c => `
            <option value="${c.id}" ${equipo && equipo.contrato_id === c.id ? 'selected' : ''}>
              ${c.numero_contrato}
            </option>
          `).join('')}
        </select>
      </div>
      
      <div class="form-group">
        <label class="form-label required">Marca</label>
        <select class="form-select" name="marca_id" id="marcaSelect" required onchange="app.loadModelosByMarca(this.value)">
          <option value="">Seleccione una marca</option>
          ${marcas.map(m => {
    const selected = equipo && modelos.find(mod => mod.id === equipo.modelo_id && mod.marca_id === m.id);
    return `<option value="${m.id}" ${selected ? 'selected' : ''}>${m.nombre}</option>`;
  }).join('')}
        </select>
      </div>
      
      <div class="form-group">
        <label class="form-label required">Modelo</label>
        <select class="form-select" name="modelo_id" id="modeloSelect" required onchange="app.updateInitialCounterFields(${equipoId})">
          <option value="">Seleccione un modelo</option>
        </select>
      </div>
      
      <div class="form-group">
        <label class="form-label required">Número de Serie</label>
        <input type="text" class="form-input" name="numero_serie" 
               value="${equipo ? equipo.numero_serie : ''}" required>
      </div>

      <div class="form-group">
        <label class="form-label required">Condición</label>
        <select class="form-select" name="condicion" id="condicionSelect" required onchange="app.updateInitialCounterFields(${equipoId})">
          <option value="nuevo" ${equipo && equipo.condicion === 'nuevo' ? 'selected' : ''}>Nuevo (0 km)</option>
          <option value="usado" ${equipo && equipo.condicion === 'usado' ? 'selected' : ''}>Usado / Re-acondicionado</option>
        </select>
      </div>

      <div id="initialCounterFields" style="display: none; padding: var(--spacing-md); background: var(--color-bg-tertiary); border-radius: var(--radius-md); margin-bottom: var(--spacing-lg);">
        <!-- Dinamicamente cargado -->
      </div>

      <div class="form-group">
        <label class="form-label">Ubicación</label>
        <input type="text" class="form-input" name="ubicacion" 
               value="${equipo ? equipo.ubicacion || '' : ''}" 
               placeholder="Ej: Piso 3 - Administración">
      </div>
      
      <div class="form-group">
        <label class="form-label required">Estado</label>
        <select class="form-select" name="estado" required>
          <option value="sin_instalar" ${equipo && equipo.estado === 'sin_instalar' ? 'selected' : ''}>Sin Instalar</option>
          <option value="instalado" ${equipo && equipo.estado === 'instalado' ? 'selected' : ''}>Instalado</option>
          <option value="bodega" ${equipo && equipo.estado === 'bodega' ? 'selected' : ''}>Bodega</option>
          <option value="baja" ${equipo && equipo.estado === 'baja' ? 'selected' : ''}>Retirado (Baja)</option>
        </select>
      </div>
      
      <div class="form-group">
        <label class="form-label">Fecha de Instalación</label>
        <input type="date" class="form-input" name="fecha_instalacion" 
               value="${equipo && equipo.fecha_instalacion ? formatDateInput(equipo.fecha_instalacion) : ''}">
      </div>
    </form>
  `;

  const modal = createModal(
    equipoId ? 'Editar Equipo' : 'Nuevo Equipo',
    formHTML,
    [
      {
        text: 'Cancelar',
        class: 'btn-secondary',
        onClick: () => closeModal(modal)
      },
      {
        text: equipoId ? 'Actualizar' : 'Crear',
        class: 'btn-primary',
        onClick: () => this.saveEquipo(equipoId, modal)
      }
    ]
  );

  document.body.appendChild(modal);
  setTimeout(() => {
    modal.classList.add('active');
    // Load models if editing
    if (equipo) {
      const modelo = modelos.find(m => m.id === equipo.modelo_id);
      if (modelo) {
        this.loadModelosByMarca(modelo.marca_id, equipo.modelo_id);
      }
      this.updateInitialCounterFields(equipoId);
    }
  }, 10);
};

App.prototype.updateInitialCounterFields = function (equipoId = null) {
  const modeloId = document.getElementById('modeloSelect')?.value;
  const condicion = document.getElementById('condicionSelect')?.value;
  const container = document.getElementById('initialCounterFields');

  if (!container) return;

  if (condicion !== 'usado' || !modeloId) {
    container.style.display = 'none';
    container.innerHTML = '';
    return;
  }

  const modelo = db.getById('modelos', parseInt(modeloId));
  const isColor = modelo.tipo_impresion === 'color';

  // Fetch existing values if editing
  let valBN = 0;
  let valColor = 0;

  if (equipoId) {
    const contadores = db.getData('contadores_equipos').filter(c => c.equipo_id === parseInt(equipoId));
    const initRecord = contadores.find(c => c.es_inicial);
    if (initRecord) {
      valBN = initRecord.contador_bn ?? initRecord.contador_actual ?? 0;
      valColor = initRecord.contador_color ?? 0;
    }
  }

  container.style.display = 'block';
  container.innerHTML = `
    <h5 style="margin-top: 0; margin-bottom: var(--spacing-sm);">Contadores Iniciales</h5>
    <div style="display: grid; grid-template-columns: ${isColor ? '1fr 1fr' : '1fr'}; gap: var(--spacing-md);">
      <div class="form-group mb-0">
        <label class="form-label required">BN Inicial</label>
        <input type="number" class="form-input" name="contador_bn_inicial" value="${valBN}" min="0" required>
      </div>
      ${isColor ? `
      <div class="form-group mb-0">
        <label class="form-label required">Color Inicial</label>
        <input type="number" class="form-input" name="contador_color_inicial" value="${valColor}" min="0" required>
      </div>
      ` : ''}
    </div>
    <span class="form-help">Estos valores se usarán como punto de partida para futuras lecturas.</span>
  `;
};

App.prototype.loadModelosByMarca = function (marcaId, selectedModeloId = null) {
  const modeloSelect = document.getElementById('modeloSelect');
  if (!modeloSelect) return;

  const modelos = db.getData('modelos').filter(m => m.marca_id === parseInt(marcaId));

  modeloSelect.innerHTML = '<option value="">Seleccione un modelo</option>';
  modelos.forEach(modelo => {
    const option = document.createElement('option');
    option.value = modelo.id;
    option.textContent = modelo.nombre;
    if (selectedModeloId && modelo.id === selectedModeloId) {
      option.selected = true;
    }
    modeloSelect.appendChild(option);
  });
};

App.prototype.saveEquipo = function (equipoId, modal) {
  const form = document.getElementById('equipoForm');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const formData = new FormData(modal.querySelector('form'));
  const modelo = db.getById('modelos', parseInt(formData.get('modelo_id')));

  const equipoData = {
    contrato_id: formData.get('contrato_id') ? parseInt(formData.get('contrato_id')) : null,
    modelo_id: parseInt(formData.get('modelo_id')),
    numero_serie: formData.get('numero_serie'),
    condicion: formData.get('condicion'),
    ubicacion: formData.get('ubicacion'),
    estado: formData.get('estado') || 'bodega',
    fecha_instalacion: formData.get('fecha_instalacion') || null
  };

  if (equipoId) {
    db.update('equipos', equipoId, equipoData);

    // Permitir actualizar o crear contador inicial en edición si se cambia a usado
    if (equipoData.condicion === 'usado') {
      const bnInic = parseInt(formData.get('contador_bn_inicial')) || 0;
      const colorInic = parseInt(formData.get('contador_color_inicial')) || 0;

      const contadores = db.getData('contadores_equipos').filter(c => c.equipo_id === parseInt(equipoId));
      const existingInit = contadores.find(c => c.es_inicial);

      const counterData = {
        equipo_id: parseInt(equipoId),
        fecha_lectura: getCurrentDate(),
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
    }
    showToast('Equipo actualizado exitosamente', 'success');
  } else {
    const newEquipo = db.insert('equipos', equipoData);

    // Si es usado, registrar el contador inicial
    if (equipoData.condicion === 'usado') {
      const bnInic = parseInt(formData.get('contador_bn_inicial')) || 0;
      const colorInic = parseInt(formData.get('contador_color_inicial')) || 0;

      const initialCounter = {
        equipo_id: newEquipo.id,
        fecha_lectura: getCurrentDate(),
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
      db.insert('contadores_equipos', initialCounter);
    }

    showToast('Equipo creado exitosamente', 'success');
  }

  closeModal(modal);
  this.renderEquiposTable();
};

App.prototype.viewEquipo = function (id) {
  const equipo = db.getById('equipos', id);
  const modelo = db.getById('modelos', equipo.modelo_id);
  const marca = modelo ? db.getById('marcas', modelo.marca_id) : null;
  const contrato = db.getById('contratos', equipo.contrato_id);
  const cliente = contrato ? db.getById('clientes', contrato.cliente_id) : null;
  const contadores = db.getBy('contadores_equipos', 'equipo_id', id);

  const consumoBN = contadores.reduce((sum, c) => sum + (c.consumo_bn || c.consumo || 0), 0);
  const consumoColor = contadores.reduce((sum, c) => sum + (c.consumo_color || 0), 0);
  const ultimoContador = contadores.length > 0 ?
    contadores.sort((a, b) => new Date(b.fecha_lectura) - new Date(a.fecha_lectura))[0] : null;
  const isColor = modelo?.tipo_impresion === 'color';

  const content = `
    <div style="display: grid; gap: var(--spacing-lg);">
      <div class="detail-section">
        <h4 class="detail-section-title">Información del Equipo</h4>
        <div class="detail-row">
          <div class="detail-label">Marca:</div>
          <div class="detail-value">${marca ? marca.nombre : '-'}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Modelo:</div>
          <div class="detail-value">${modelo ? modelo.nombre : '-'}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">N° Serie:</div>
          <div class="detail-value"><code>${equipo.numero_serie}</code></div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Tipo Impresión:</div>
          <div class="detail-value">
            <span class="badge ${modelo?.tipo_impresion === 'color' ? 'badge-secondary' : 'badge-ghost'}">
              ${modelo?.tipo_impresion === 'color' ? '🎨 Color' : '⚫ B/N'}
            </span>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Condición:</div>
          <div class="detail-value" style="text-transform: capitalize;">${equipo.condicion || 'Nuevo'}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Estado:</div>
          <div class="detail-value">${getStatusBadge(equipo.estado)}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Ubicación:</div>
          <div class="detail-value">${equipo.ubicacion || 'No especificada'}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Fecha Instalación:</div>
          <div class="detail-value">${formatDate(equipo.fecha_instalacion)}</div>
        </div>
      </div>
      
      <div class="detail-section">
        <h4 class="detail-section-title">Contrato Asociado</h4>
        <div class="detail-row">
          <div class="detail-label">Cliente:</div>
          <div class="detail-value">${cliente ? cliente.nombre : '-'}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">N° Contrato:</div>
          <div class="detail-value">${contrato ? contrato.numero_contrato : '-'}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Estado Contrato:</div>
          <div class="detail-value">${contrato ? getStatusBadge(contrato.estado) : '-'}</div>
        </div>
      </div>
      
      <div class="detail-section">
        <h4 class="detail-section-title">Estadísticas de Uso</h4>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-md); text-align: center;">
          <div style="padding: var(--spacing-md); background: var(--color-bg-tertiary); border-radius: var(--radius-md);">
            <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary);">Lecturas</div>
            <div style="font-size: var(--font-size-2xl); font-weight: bold; color: var(--color-primary);">${contadores.length}</div>
          </div>
          <div style="padding: var(--spacing-md); background: var(--color-bg-tertiary); border-radius: var(--radius-md);">
            <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary);">Consumo B/N</div>
            <div style="font-size: var(--font-size-xl); font-weight: bold; color: var(--color-success);">${formatNumber(consumoBN)}</div>
          </div>
          ${isColor ? `
          <div style="padding: var(--spacing-md); background: var(--color-bg-tertiary); border-radius: var(--radius-md);">
            <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary);">Consumo Color</div>
            <div style="font-size: var(--font-size-xl); font-weight: bold; color: var(--color-secondary);">${formatNumber(consumoColor)}</div>
          </div>
          ` : `
          <div style="padding: var(--spacing-md); background: var(--color-bg-tertiary); border-radius: var(--radius-md);">
            <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary);">Último Contador</div>
            <div style="font-size: var(--font-size-xl); font-weight: bold;">${ultimoContador ? formatNumber(ultimoContador.contador_bn || ultimoContador.contador_actual) : '0'}</div>
          </div>
          `}
        </div>
        ${isColor ? `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md); text-align: center; margin-top: var(--spacing-sm);">
          <div style="padding: var(--spacing-md); background: var(--color-bg-tertiary); border-radius: var(--radius-md);">
            <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary);">Ult. BN</div>
            <div style="font-size: var(--font-size-lg); font-weight: bold;">${ultimoContador ? formatNumber(ultimoContador.contador_bn ?? ultimoContador.contador_actual ?? 0) : '0'}</div>
          </div>
          <div style="padding: var(--spacing-md); background: var(--color-bg-tertiary); border-radius: var(--radius-md);">
            <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary);">Ult. Color</div>
            <div style="font-size: var(--font-size-lg); font-weight: bold; color: var(--color-secondary);">${ultimoContador ? formatNumber(ultimoContador.contador_color ?? 0) : '0'}</div>
          </div>
        </div>
        ` : ''}
      </div>
    </div>
  `;

  const modal = createModal('Detalles del Equipo', content, [
    {
      text: 'Registrar Cambio',
      class: 'btn-secondary',
      onClick: () => {
        closeModal(modal);
        this.loadModule('cambio-consumibles');
        this.showCambioConsumibleForm(id);
      }
    },
    {
      text: 'Ver Historial Completo',
      class: 'btn-primary',
      onClick: () => {
        closeModal(modal);
        this.viewHistorialEquipo(id);
      }
    }
  ]);

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('active'), 10);
};

App.prototype.viewHistorialEquipo = function (equipoId) {
  const equipo = db.getById('equipos', equipoId);
  const modelo = db.getById('modelos', equipo.modelo_id);
  const contadores = db.getBy('contadores_equipos', 'equipo_id', equipoId);
  const cambios = db.getBy('cambios_consumibles', 'equipo_id', equipoId);
  const suministros = db.getData('suministros');
  const usuarios = db.getData('usuarios');

  // Combine all events into a single timeline
  const events = [];

  // 1. Installation
  if (equipo.fecha_instalacion) {
    events.push({
      date: equipo.fecha_instalacion,
      type: 'instalacion',
      title: 'Instalación de Equipo',
      description: `Equipo instalado en: ${equipo.ubicacion}`,
      icon: '⚙️',
      color: 'info'
    });
  }

  // 2. Counter Readings
  contadores.forEach(c => {
    events.push({
      date: c.fecha_lectura,
      itemDate: c.fecha_lectura, // for sorting
      type: 'contador',
      title: 'Lectura de Contador',
      description: `Lectura: <strong>${formatNumber(c.valor)}</strong> | Consumo: +${formatNumber(c.consumo)}`,
      icon: '🔢',
      color: 'success'
    });
  });

  // 3. Consumable Changes
  cambios.forEach(c => {
    const sum = suministros.find(s => s.id === c.suministro_id);
    const tec = usuarios.find(u => u.id === c.tecnico_id);
    events.push({
      date: c.fecha,
      itemDate: c.fecha,
      type: 'consumible',
      title: 'Cambio de Consumible',
      description: `<strong>${sum ? sum.nombre : 'N/A'}</strong> (Cant: ${c.cantidad})<br><small>Técnico: ${tec ? tec.nombre : '-'}</small>`,
      icon: '🎨',
      color: 'primary'
    });
  });

  // Sort by date desc
  events.sort((a, b) => new Date(b.date) - new Date(a.date));

  const content = `
    <div class="timeline">
      ${events.map(ev => `
        <div class="timeline-item">
          <div class="timeline-date">${formatDate(ev.date)}</div>
          <div class="timeline-content">
            <div style="display: flex; gap: var(--spacing-md); align-items: start;">
              <div style="font-size: 1.5rem;">${ev.icon}</div>
              <div>
                <strong class="text-${ev.color}">${ev.title}</strong>
                <div style="margin-top: var(--spacing-xs);">${ev.description}</div>
              </div>
            </div>
          </div>
        </div>
      `).join('')}
      
      ${events.length === 0 ? '<div class="empty-state">No hay eventos registrados para este equipo</div>' : ''}
    </div>
  `;

  const modal = createModal(`Historial: ${modelo.nombre} (${equipo.numero_serie})`, content, [
    { text: 'Cerrar', class: 'btn-secondary', onClick: () => closeModal(modal) },
    { text: '🖨️ Imprimir Hoja de Vida', class: 'btn-ghost', onClick: () => window.print() }
  ], 'lg');

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('active'), 10);
};

App.prototype.editEquipo = function (id) {
  this.showEquipoForm(id);
};

App.prototype.darDeBajaEquipo = function (id) {
  const equipo = db.getById('equipos', id);

  showConfirm(
    'Dar de Baja Equipo',
    `¿Estás seguro que deseas <strong>dar de baja</strong> el equipo ${equipo.numero_serie}? <br><br><small>El equipo se retirará de operación pero se conservará toda su historia.</small>`,
    () => {
      db.update('equipos', id, {
        estado: 'baja',
        contrato_id: null,
        ubicacion: 'Retirado / Baja'
      });
      showToast('Equipo retirado de operación', 'success');
      this.renderEquiposTable();
    }
  );
};

App.prototype.reactivarEquipo = function (id) {
  const equipo = db.getById('equipos', id);

  showConfirm(
    'Reactivar Equipo',
    `¿Deseas reactivar el equipo ${equipo.numero_serie} y devolverlo a la bodega?`,
    () => {
      db.update('equipos', id, {
        estado: 'bodega',
        ubicacion: 'Bodega Central'
      });
      showToast('Equipo reactivado exitosamente', 'success');
      this.renderEquiposTable();
    }
  );
};

App.prototype.deleteEquipo = function (id) {
  const equipo = db.getById('equipos', id);
  const contadores = db.getBy('contadores_equipos', 'equipo_id', id);
  const servicios = db.getBy('servicios', 'equipo_id', id);

  if (contadores.length > 0 || servicios.length > 0) {
    showToast('No se puede eliminar permanentemente un equipo con historial. Use "Dar de Baja" en su lugar.', 'warning');
    return;
  }

  showConfirm(
    'Eliminar Permanente',
    `¿Estás seguro que deseas eliminar <strong>permanentemente</strong> el equipo ${equipo.numero_serie}? <br><br><small>Esta acción no se puede deshacer y solo se recomienda para registros creados por error.</small>`,
    () => {
      db.delete('equipos', id);
      showToast('Equipo eliminado permanentemente', 'success');
      this.renderEquiposTable();
    }
  );
};
