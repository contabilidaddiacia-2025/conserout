/**
 * CONSEROUT - Consumable Change Service Module
 * Service for changing consumables with compatibility filtering
 */

// Extend App class with consumable change module
App.prototype.loadCambioConsumiblesModule = function (container) {
  container.innerHTML = `
    <div class="module-container">
      <div class="module-header">
        <h2 class="module-title">Cambio de Consumibles</h2>
        <div class="module-actions">
          <button class="btn btn-secondary" onclick="app.exportCambiosCSV()">
            <span>📄</span>
            <span>Exportar CSV</span>
          </button>
          <button class="btn btn-primary" onclick="app.showCambioConsumibleForm()">
            <span>+</span>
            <span>Registrar Cambio</span>
          </button>
        </div>
      </div>

      <div class="filters-container">
        <div class="filters-grid">
          <div class="form-group m-0">
            <label class="form-label">Desde</label>
            <input type="date" class="form-input" id="filterFechaDesdeCambio">
          </div>
          <div class="form-group m-0">
            <label class="form-label">Hasta</label>
            <input type="date" class="form-input" id="filterFechaHastaCambio" value="${getCurrentDate()}">
          </div>
          <div class="form-group m-0">
            <label class="form-label">Contrato</label>
            <select class="form-select" id="filterContratoCambio">
              <option value="">Todos los contratos</option>
            </select>
          </div>
          <div class="form-group m-0">
            <label class="form-label">Técnico</label>
            <select class="form-select" id="filterTecnicoCambio">
              <option value="">Todos los técnicos</option>
            </select>
          </div>
          <div class="form-group m-0">
            <label class="form-label">Buscar</label>
            <input type="text" class="form-input" id="searchCambios" placeholder="Serie, Marca, Modelo...">
          </div>
        </div>
      </div>

      <div class="card">
        <div class="table-container">
          <table class="table" id="cambiosTable">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Contrato</th>
                <th>Equipo</th>
                <th>Marca</th>
                <th>N° Serie</th>
                <th>Suministro</th>
                <th>Cantidad</th>
                <th>Técnico</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="cambiosTableBody">
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  this.renderCambiosTable();
  this.setupCambiosFilters();
};

App.prototype.setupCambiosFilters = function () {
  const filters = ['filterFechaDesdeCambio', 'filterFechaHastaCambio', 'filterTecnicoCambio', 'filterContratoCambio'];
  filters.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', () => this.renderCambiosTable());
    }
  });

  const searchInput = document.getElementById('searchCambios');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => this.renderCambiosTable(), 300));
  }
};

App.prototype.renderCambiosTable = function () {
  const cambios = db.getData('cambios_consumibles') || [];
  const equipos = db.getData('equipos');
  const contratos = db.getData('contratos');
  const modelos = db.getData('modelos');
  const marcas = db.getData('marcas');
  const suministros = db.getData('suministros');
  const usuarios = db.getData('usuarios');
  const tbody = document.getElementById('cambiosTableBody');

  if (!tbody) return;

  const currUser = auth.getCurrentUser();
  const isTechnician = currUser && currUser.perfil_id === 3;
  const canCorrect = currUser && (currUser.perfil_id === 1 || currUser.perfil_id === 2 || currUser.perfil.permisos.includes('all')); // Admin or Gestor

  let assignedContratosIds = [];
  if (isTechnician) {
    const asignaciones = db.getData('tecnicos_contrato').filter(tc => tc.tecnico_id === currUser.id);
    assignedContratosIds = asignaciones.map(a => a.contrato_id);
  }

  tbody.innerHTML = '';

  // Populate filters
  const filterTecnico = document.getElementById('filterTecnicoCambio');
  if (filterTecnico && filterTecnico.options.length === 1) {
    usuarios.filter(u => u.perfil_id === 3).forEach(tecnico => {
      const option = document.createElement('option');
      option.value = tecnico.id;
      option.textContent = tecnico.nombre;
      filterTecnico.appendChild(option);
    });
  }

  const filterContrato = document.getElementById('filterContratoCambio');
  if (filterContrato && filterContrato.options.length === 1) {
    contratos.filter(c => c.estado === 'vigente').forEach(contrato => {
      // If technician, only show assigned contracts
      if (isTechnician && !assignedContratosIds.includes(contrato.id)) return;
      const option = document.createElement('option');
      option.value = contrato.id;
      option.textContent = contrato.numero_contrato;
      filterContrato.appendChild(option);
    });
  }

  // Get filter values
  const desde = document.getElementById('filterFechaDesdeCambio')?.value;
  const hasta = document.getElementById('filterFechaHastaCambio')?.value;
  const tecnicoId = document.getElementById('filterTecnicoCambio')?.value;
  const contratoId = document.getElementById('filterContratoCambio')?.value;
  const searchTerm = document.getElementById('searchCambios')?.value.toLowerCase();

  const filteredCambios = cambios.filter(cambio => {
    const equipo = equipos.find(e => e.id === cambio.equipo_id);
    const modelo = equipo ? modelos.find(m => m.id === equipo.modelo_id) : null;
    const marca = modelo ? marcas.find(m => m.id === modelo.marca_id) : null;

    // Technician security filter
    if (isTechnician) {
      if (!equipo || !equipo.contrato_id || !assignedContratosIds.includes(equipo.contrato_id)) return false;
    }

    if (desde && cambio.fecha < desde) return false;
    if (hasta && cambio.fecha > hasta) return false;
    if (tecnicoId && cambio.tecnico_id != tecnicoId) return false;
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

  // Sort by date descending
  filteredCambios.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  filteredCambios.forEach(cambio => {
    const equipo = equipos.find(e => e.id === cambio.equipo_id);
    const modelo = equipo ? modelos.find(m => m.id === equipo.modelo_id) : null;
    const contrato = equipo ? contratos.find(c => c.id === equipo.contrato_id) : null;
    const suministro = suministros.find(s => s.id === cambio.suministro_id);
    const tecnico = usuarios.find(u => u.id === cambio.tecnico_id);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDate(cambio.fecha)}</td>
      <td>${contrato ? contrato.numero_contrato : '-'}</td>
      <td>${modelo ? modelo.nombre : 'N/A'}</td>
      <td><code>${equipo ? equipo.numero_serie : '-'}</code></td>
      <td>${suministro ? suministro.nombre : 'N/A'}</td>
      <td><strong>${cambio.cantidad}</strong></td>
      <td>${tecnico ? tecnico.nombre : '-'}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-sm btn-ghost" onclick="app.viewCambioConsumible(${cambio.id})" title="Ver Detalles">
            👁️
          </button>
          ${canCorrect ? `
          <button class="btn btn-sm btn-ghost text-danger" onclick="app.corregirCambio(${cambio.id})" title="Deshacer Cambio">
            ↩️
          </button>
          ` : ''}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (filteredCambios.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          <div class="empty-state-icon">🎨</div>
          <div class="empty-state-title">No hay cambios de consumibles registrados</div>
        </td>
      </tr>
    `;
  }
};

App.prototype.corregirCambio = function (id) {
  const cambio = db.getById('cambios_consumibles', id);
  if (!cambio) return;

  const suministro = db.getById('suministros', cambio.suministro_id);
  const equipo = db.getById('equipos', cambio.equipo_id);

  showConfirm(
    'Deshacer Cambio',
    `¿Estás seguro que deseas deshacer este cambio y devolver <b>${cambio.cantidad} ${suministro.nombre}</b> a bodega? esta acción no se puede revertir.`,
    () => {
      // 1. Restore stock to bodega
      // We create a new entry for simplicity and traceability
      db.insert('bodega', {
        suministro_id: cambio.suministro_id,
        cantidad: cambio.cantidad,
        fecha_ingreso: getCurrentDate(),
        numero_factura: 'DEVOLUCION-CORRECCION',
        costo_unitario: 0, // Should strictly get from avg cost, but 0 prevents skewing value for now
        proveedor_id: null
      });

      // 2. Register movement validation
      db.insert('movimientos_bodega', {
        suministro_id: cambio.suministro_id,
        tipo_movimiento: 'entrada',
        cantidad: cambio.cantidad,
        fecha: getCurrentDate(),
        usuario_id: auth.getCurrentUser().id,
        referencia: `Corrección cambio en ${equipo.numero_serie}`,
        observaciones: `Devolución por corrección de cambio ID: ${id}`,
        tipo_salida: 'ajuste',
      });

      // 3. Delete the original change record
      db.delete('cambios_consumibles', id);

      showToast('Cambio deshecho y stock restaurado correctamente', 'success');
      this.renderCambiosTable();
    }
  );
};

App.prototype.exportCambiosCSV = function () {
  const cambios = db.getData('cambios_consumibles');
  const equipos = db.getData('equipos');
  const contratos = db.getData('contratos');
  const modelos = db.getData('modelos');
  const suministros = db.getData('suministros');
  const usuarios = db.getData('usuarios');

  // Filter based on current view/filters
  const desde = document.getElementById('filterFechaDesdeCambio')?.value;
  const hasta = document.getElementById('filterFechaHastaCambio')?.value;
  const tecnicoId = document.getElementById('filterTecnicoCambio')?.value;
  const contratoId = document.getElementById('filterContratoCambio')?.value;

  const filtered = cambios.filter(c => {
    const equipo = equipos.find(e => e.id === c.equipo_id);
    if (desde && c.fecha < desde) return false;
    if (hasta && c.fecha > hasta) return false;
    if (tecnicoId && c.tecnico_id != tecnicoId) return false;
    if (contratoId && equipo && equipo.contrato_id != contratoId) return false;
    return true;
  });

  let csv = [];
  csv.push('"REPORTE DE CAMBIOS DE SUMINISTROS"');
  csv.push(`"Fecha Reporte:","${getCurrentDate()}"`);
  csv.push("");
  csv.push('"Fecha","Contrato","Equipo","Serie","Ubicacion","Suministro","Cantidad","Tecnico","Contador BN","Contador Color"');

  filtered.forEach(c => {
    const eq = equipos.find(e => e.id === c.equipo_id);
    const mod = eq ? modelos.find(m => m.id === eq.modelo_id) : null;
    const con = eq ? contratos.find(ct => ct.id === eq.contrato_id) : null;
    const sum = suministros.find(s => s.id === c.suministro_id);
    const tec = usuarios.find(u => u.id === c.tecnico_id);

    const row = [
      c.fecha,
      con ? con.numero_contrato : 'N/A',
      mod ? mod.nombre : 'N/A',
      eq ? eq.numero_serie : 'N/A',
      eq ? eq.ubicacion : 'N/A',
      sum ? sum.nombre : 'N/A',
      c.cantidad,
      tec ? tec.nombre : 'N/A',
      c.contador_bn || 0,
      c.contador_color || 0
    ];
    csv.push(row.map(val => `"${val}"`).join(','));
  });

  downloadFile(csv.join("\n"), `Cambios_Consumibles_${getCurrentDate()}.csv`, 'text/csv;charset=utf-8');
  showToast('Reporte generado exitosamente', 'success');
};

App.prototype.showCambioConsumibleForm = function (preSelectedEquipoId = null) {
  const currUser = auth.getCurrentUser();
  const isTechnician = currUser && currUser.perfil_id === 3;
  let equipos = db.getData('equipos').filter(e => e.estado === 'instalado');

  if (isTechnician) {
    const asignaciones = db.getData('tecnicos_contrato').filter(tc => tc.tecnico_id === currUser.id);
    const assignedContratosIds = asignaciones.map(a => a.contrato_id);
    equipos = equipos.filter(e => e.contrato_id && assignedContratosIds.includes(e.contrato_id));
  }

  const suministros = db.getData('suministros');
  const tecnicos = db.getData('usuarios').filter(u => u.perfil_id === 3);
  const modelos = db.getData('modelos');

  const formHTML = `
    <form id="cambioConsumibleForm">
      <div class="form-group">
        <label class="form-label required">Equipo</label>
        <select class="form-select" name="equipo_id" id="equipoSelectCambio" required onchange="app.updateConsumableCounterFields(this.value); app.loadSuministrosCompatibles()">
          <option value="">Seleccione un equipo</option>
          ${equipos.map(e => {
    const modelo = modelos.find(m => m.id === e.modelo_id);
    const selected = preSelectedEquipoId && e.id === preSelectedEquipoId ? 'selected' : '';
    return `<option value="${e.id}" data-modelo-id="${e.modelo_id}" ${selected}>${modelo ? modelo.nombre : 'N/A'} - ${e.numero_serie} (${e.ubicacion})</option>`;
  }).join('')}
        </select>
      </div>

      <div id="consumableCounterFields" style="display: none; padding: var(--spacing-md); background: var(--color-bg-tertiary); border-radius: var(--radius-md); margin-bottom: var(--spacing-md);">
        <!-- Dinamicamente cargado -->
      </div>
      
      <div class="form-group" id="suministroGroup" style="display: none;">
        <label class="form-label required">Suministro Compatible</label>
        <select class="form-select" name="suministro_id" id="suministroSelectCambio" required>
          <option value="">Primero seleccione un equipo</option>
        </select>
        <span class="form-help" id="suministroHelp">Solo se muestran suministros compatibles con este equipo</span>
      </div>
      
      <div class="form-group">
        <label class="form-label required">Cantidad</label>
        <input type="number" class="form-input" name="cantidad" min="1" value="1" required>
      </div>
      
      <div class="form-group" ${isTechnician ? 'style="display: none;"' : ''}>
        <label class="form-label required">Técnico</label>
        <select class="form-select" name="tecnico_id" required>
          <option value="">Seleccione un técnico</option>
          ${tecnicos.map(t => {
    const isSelected = currUser.id === t.id;
    return `<option value="${t.id}" ${isSelected ? 'selected' : ''}>${t.nombre}</option>`;
  }).join('')}
        </select>
      </div>
      
      <div class="form-group">
        <label class="form-label required">Fecha</label>
        <input type="date" class="form-input" name="fecha" value="${getCurrentDate()}" required>
      </div>
      
      <div class="form-group">
        <label class="form-label">Observaciones</label>
        <textarea class="form-textarea" name="observaciones" placeholder="Detalles del cambio..."></textarea>
      </div>
    </form>
  `;

  const modal = createModal(
    'Registrar Cambio de Consumible',
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
          const form = document.getElementById('cambioConsumibleForm');
          if (!form.checkValidity()) {
            form.reportValidity();
            return;
          }

          const formData = new FormData(form);
          const equipoId = parseInt(formData.get('equipo_id'));
          const suministroId = parseInt(formData.get('suministro_id'));
          const cantidad = parseInt(formData.get('cantidad'));

          // Check stock availability
          const bodega = db.getData('bodega').filter(b => b.suministro_id === suministroId);
          const stockTotal = bodega.reduce((sum, b) => sum + b.cantidad, 0);

          if (stockTotal < cantidad) {
            showToast(`Stock insuficiente. Disponible: ${stockTotal} unidades`, 'danger');
            return;
          }

          // Register cambio
          const cambioId = db.insert('cambios_consumibles', {
            equipo_id: equipoId,
            suministro_id: suministroId,
            cantidad: cantidad,
            tecnico_id: parseInt(formData.get('tecnico_id')),
            fecha: formData.get('fecha'),
            contador_bn: parseInt(formData.get('contador_bn')) || 0,
            contador_color: parseInt(formData.get('contador_color')) || 0,
            observaciones: formData.get('observaciones')
          }).id;

          // Reduce stock (FIFO)
          let cantidadRestante = cantidad;
          bodega.sort((a, b) => new Date(a.fecha_ingreso) - new Date(b.fecha_ingreso));

          bodega.forEach(item => {
            if (cantidadRestante > 0) {
              if (item.cantidad >= cantidadRestante) {
                db.update('bodega', item.id, { cantidad: item.cantidad - cantidadRestante });
                cantidadRestante = 0;
              } else {
                cantidadRestante -= item.cantidad;
                db.delete('bodega', item.id);
              }
            }
          });

          // Register movement
          const equipo = db.getById('equipos', equipoId);
          db.insert('movimientos_bodega', {
            suministro_id: suministroId,
            tipo_movimiento: 'salida',
            cantidad: cantidad,
            fecha: formData.get('fecha'),
            usuario_id: auth.getCurrentUser().id,
            referencia: `Cambio en equipo ${equipo.numero_serie}`,
            observaciones: formData.get('observaciones'),
            tipo_salida: 'equipo',
            equipo_id: equipoId,
            contrato_id: equipo.contrato_id
          });

          // Also register as a general service for dashboard metrics
          db.insert('servicios', {
            equipo_id: equipoId,
            contrato_id: equipo.contrato_id,
            tecnico_id: parseInt(formData.get('tecnico_id')),
            fecha: formData.get('fecha'),
            tipo: 'Cambio Consumible',
            estado: 'completado',
            observaciones: formData.get('observaciones')
          });

          showToast('Cambio de consumible registrado exitosamente', 'success');
          closeModal(modal);
          this.renderCambiosTable();
        }
      }
    ]
  );

  document.body.appendChild(modal);
  setTimeout(() => {
    modal.classList.add('active');
    if (preSelectedEquipoId) {
      this.updateConsumableCounterFields(preSelectedEquipoId);
      this.loadSuministrosCompatibles();
    }
  }, 10);
};

App.prototype.updateConsumableCounterFields = function (equipoId) {
  const container = document.getElementById('consumableCounterFields');
  if (!container || !equipoId) {
    if (container) container.style.display = 'none';
    return;
  }

  const equipo = db.getById('equipos', parseInt(equipoId));
  const modelo = db.getById('modelos', equipo.modelo_id);
  const isColor = modelo.tipo_impresion === 'color';

  container.style.display = 'block';
  container.innerHTML = `
    <h5 style="margin-top: 0; margin-bottom: var(--spacing-sm);">Contadores al momento del cambio</h5>
    <div style="display: grid; grid-template-columns: ${isColor ? '1fr 1fr' : '1fr'}; gap: var(--spacing-md);">
      <div class="form-group mb-0">
        <label class="form-label required">BN Actual</label>
        <input type="number" class="form-input" name="contador_bn" min="0" required placeholder="Lectura BN">
      </div>
      ${isColor ? `
      <div class="form-group mb-0">
        <label class="form-label required">Color Actual</label>
        <input type="number" class="form-input" name="contador_color" min="0" required placeholder="Lectura Color">
      </div>
      ` : ''}
    </div>
    <span class="form-help">Esta lectura es informativa para mantenimiento.</span>
  `;
};

App.prototype.loadSuministrosCompatibles = function () {
  const equipoSelect = document.getElementById('equipoSelectCambio');
  const suministroSelect = document.getElementById('suministroSelectCambio');
  const suministroGroup = document.getElementById('suministroGroup');
  const suministroHelp = document.getElementById('suministroHelp');

  if (!equipoSelect || !suministroSelect || !suministroGroup) return;

  const equipoId = parseInt(equipoSelect.value);

  if (!equipoId) {
    suministroGroup.style.display = 'none';
    return;
  }

  const equipo = db.getById('equipos', equipoId);
  const modelo = equipo ? db.getById('modelos', equipo.modelo_id) : null;
  const suministros = db.getData('suministros');
  const bodega = db.getData('bodega');

  // Filter compatible supplies
  const suministrosCompatibles = suministros.filter(s => {
    // If supply has no compatibility list, it's universal (like paper)
    if (!s.modelos_compatibles || s.modelos_compatibles.length === 0) {
      return false; // Don't show universal supplies in consumable changes
    }
    // Check if this supply is compatible with the equipment model
    return s.modelos_compatibles.includes(equipo.modelo_id);
  });

  suministroSelect.innerHTML = '<option value="">Seleccione un suministro</option>';

  if (suministrosCompatibles.length === 0) {
    suministroSelect.innerHTML = '<option value="">No hay suministros compatibles registrados</option>';
    suministroHelp.textContent = `No se encontraron suministros compatibles con ${modelo ? modelo.nombre : 'este equipo'}`;
    suministroHelp.style.color = 'var(--color-danger)';
  } else {
    suministrosCompatibles.forEach(suministro => {
      const stock = bodega.filter(b => b.suministro_id === suministro.id)
        .reduce((sum, b) => sum + b.cantidad, 0);

      const option = document.createElement('option');
      option.value = suministro.id;
      option.textContent = `${suministro.nombre} (Stock: ${stock})`;
      if (stock === 0) {
        option.disabled = true;
        option.textContent += ' - SIN STOCK';
      }
      suministroSelect.appendChild(option);
    });

    suministroHelp.textContent = `${suministrosCompatibles.length} suministro(s) compatible(s) con ${modelo ? modelo.nombre : 'este equipo'}`;
    suministroHelp.style.color = 'var(--color-success)';
  }

  suministroGroup.style.display = 'block';
};

App.prototype.viewCambioConsumible = function (id) {
  const cambio = db.getById('cambios_consumibles', id);
  const equipo = db.getById('equipos', cambio.equipo_id);
  const modelo = db.getById('modelos', equipo.modelo_id);
  const suministro = db.getById('suministros', cambio.suministro_id);
  const tecnico = db.getById('usuarios', cambio.tecnico_id);

  const content = `
    <div style="display: grid; gap: var(--spacing-lg);">
      <div class="detail-section">
        <h4 class="detail-section-title">Detalles del Cambio</h4>
        <div class="detail-row">
          <div class="detail-label">Fecha:</div>
          <div class="detail-value">${formatDate(cambio.fecha)}</div>
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
          <div class="detail-label">Suministro:</div>
          <div class="detail-value">${suministro.nombre}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Cantidad:</div>
          <div class="detail-value"><strong>${cambio.cantidad}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Técnico:</div>
          <div class="detail-value">${tecnico.nombre}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Contador BN:</div>
          <div class="detail-value"><strong>${formatNumber(cambio.contador_bn || 0)}</strong></div>
        </div>
        ${modelo.tipo_impresion === 'color' ? `
        <div class="detail-row">
          <div class="detail-label">Contador Color:</div>
          <div class="detail-value" style="color: var(--color-secondary);"><strong>${formatNumber(cambio.contador_color || 0)}</strong></div>
        </div>
        ` : ''}
      </div>
      
      ${cambio.observaciones ? `
        <div class="detail-section">
          <h4 class="detail-section-title">Observaciones</h4>
          <p>${cambio.observaciones}</p>
        </div>
      ` : ''}
    </div>
  `;

  const modal = createModal('Detalles del Cambio de Consumible', content, [
    {
      text: 'Cerrar',
      class: 'btn-secondary',
      onClick: () => closeModal(modal)
    }
  ]);

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('active'), 10);
};
