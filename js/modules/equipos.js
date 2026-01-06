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
            </select>
          </div>
          <div class="form-group m-0">
            <label class="form-label">Marca</label>
            <select class="form-select" id="filterMarcaEquipo">
              <option value="">Todas las marcas</option>
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
  const filterMarca = document.getElementById('filterMarcaEquipo');

  if (filterContrato && filterContrato.options.length === 1) {
    contratos.forEach(contrato => {
      const option = document.createElement('option');
      option.value = contrato.id;
      option.textContent = contrato.numero_contrato;
      filterContrato.appendChild(option);
    });
  }

  if (filterMarca && filterMarca.options.length === 1) {
    marcas.forEach(marca => {
      const option = document.createElement('option');
      option.value = marca.id;
      option.textContent = marca.nombre;
      filterMarca.appendChild(option);
    });
  }

  equipos.forEach(equipo => {
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
      <td><code style="font-size: var(--font-size-xs);">${equipo.numero_serie}</code></td>
      <td>${contrato ? contrato.numero_contrato : '-'}</td>
      <td>${equipo.ubicacion || '-'}</td>
      <td>${getStatusBadge(equipo.estado)}</td>
      <td>${formatDate(equipo.fecha_instalacion)}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-sm btn-ghost" onclick="app.viewEquipo(${equipo.id})" title="Ver">
            👁️
          </button>
          <button class="btn btn-sm btn-ghost" onclick="app.viewHistorialEquipo(${equipo.id})" title="Historial Completo">
            📜
          </button>
          <button class="btn btn-sm btn-ghost" onclick="app.editEquipo(${equipo.id})" title="Editar">
            ✏️
          </button>
          <button class="btn btn-sm btn-ghost" onclick="app.deleteEquipo(${equipo.id})" title="Eliminar">
            🗑️
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (equipos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">
          <div class="empty-state-icon">🖨️</div>
          <div class="empty-state-title">No hay equipos registrados</div>
          <div class="empty-state-description">Comienza agregando equipos a los contratos</div>
        </td>
      </tr>
    `;
  }
};

App.prototype.setupEquiposFilters = function () {
  const searchInput = document.getElementById('searchEquipo');
  const filterContrato = document.getElementById('filterContratoEquipo');
  const filterEstado = document.getElementById('filterEstadoEquipo');
  const filterMarca = document.getElementById('filterMarcaEquipo');

  const applyFilters = () => {
    const search = searchInput?.value.toLowerCase() || '';
    const contrato = filterContrato?.value || '';
    const estado = filterEstado?.value || '';
    const marca = filterMarca?.value || '';

    const rows = document.querySelectorAll('#equiposTableBody tr');
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      const badge = row.querySelector('.badge');
      const rowEstado = badge?.textContent.toLowerCase() || '';

      const matchesSearch = text.includes(search);
      const matchesEstado = !estado || rowEstado.includes(estado);

      row.style.display = (matchesSearch && matchesEstado) ? '' : 'none';
    });
  };

  searchInput?.addEventListener('input', debounce(applyFilters, 300));
  filterContrato?.addEventListener('change', applyFilters);
  filterEstado?.addEventListener('change', applyFilters);
  filterMarca?.addEventListener('change', applyFilters);
};

App.prototype.showEquipoForm = function (equipoId = null) {
  const equipo = equipoId ? db.getById('equipos', equipoId) : null;
  const contratos = db.getData('contratos').filter(c => c.estado === 'vigente');
  const modelos = db.getData('modelos');
  const marcas = db.getData('marcas');

  const formHTML = `
    <form id="equipoForm">
      <div class="form-group">
        <label class="form-label required">Contrato</label>
        <select class="form-select" name="contrato_id" required>
          <option value="">Seleccione un contrato</option>
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
        <select class="form-select" name="modelo_id" id="modeloSelect" required>
          <option value="">Seleccione un modelo</option>
        </select>
      </div>
      
      <div class="form-group">
        <label class="form-label required">Número de Serie</label>
        <input type="text" class="form-input" name="numero_serie" 
               value="${equipo ? equipo.numero_serie : ''}" required>
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
    }
  }, 10);
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

  const formData = new FormData(form);
  const data = {
    contrato_id: parseInt(formData.get('contrato_id')),
    modelo_id: parseInt(formData.get('modelo_id')),
    numero_serie: formData.get('numero_serie'),
    ubicacion: formData.get('ubicacion'),
    estado: formData.get('estado'),
    fecha_instalacion: formData.get('fecha_instalacion') || null
  };

  if (equipoId) {
    db.update('equipos', equipoId, data);
    showToast('Equipo actualizado exitosamente', 'success');
  } else {
    db.insert('equipos', data);
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

  const consumoTotal = contadores.reduce((sum, c) => sum + c.consumo, 0);
  const ultimoContador = contadores.length > 0 ?
    contadores.sort((a, b) => new Date(b.fecha_lectura) - new Date(a.fecha_lectura))[0] : null;

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
            <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary);">Consumo Total</div>
            <div style="font-size: var(--font-size-2xl); font-weight: bold; color: var(--color-success);">${formatNumber(consumoTotal)}</div>
          </div>
          <div style="padding: var(--spacing-md); background: var(--color-bg-tertiary); border-radius: var(--radius-md);">
            <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary);">Último Contador</div>
            <div style="font-size: var(--font-size-2xl); font-weight: bold;">${ultimoContador ? formatNumber(ultimoContador.contador_actual) : '0'}</div>
          </div>
        </div>
      </div>
    </div>
  `;

  const modal = createModal('Detalles del Equipo', content, [
    {
      text: 'Cerrar',
      class: 'btn-secondary',
      onClick: () => closeModal(modal)
    },
    {
      text: 'Ver Historial',
      class: 'btn-primary',
      onClick: () => {
        closeModal(modal);
        this.verHistorialContadores(id);
      }
    }
  ]);

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('active'), 10);
};

App.prototype.editEquipo = function (id) {
  this.showEquipoForm(id);
};

App.prototype.deleteEquipo = function (id) {
  const equipo = db.getById('equipos', id);
  const contadores = db.getBy('contadores_equipos', 'equipo_id', id);

  if (contadores.length > 0) {
    showToast('No se puede eliminar un equipo con lecturas de contadores', 'danger');
    return;
  }

  showConfirm(
    'Eliminar Equipo',
    `¿Estás seguro que deseas eliminar el equipo ${equipo.numero_serie}?`,
    () => {
      db.delete('equipos', id);
      showToast('Equipo eliminado exitosamente', 'success');
      this.renderEquiposTable();
    }
  );
};
