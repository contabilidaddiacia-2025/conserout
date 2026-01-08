/**
 * CONSEROUT - Warehouse/Inventory Module
 * Complete inventory management for supplies and materials
 */

// Extend App class with warehouse module
App.prototype.loadBodegaModule = function (container) {
  container.innerHTML = `
    <div class="module-container">
      <div class="module-header">
        <h2 class="module-title">Gestión de Bodega</h2>
        <div class="module-actions">
          <button class="btn btn-primary" onclick="app.showIngresoSuministroForm()">
            <span>+</span>
            <span>Ingreso de Suministros</span>
          </button>
          <button class="btn btn-secondary" onclick="app.showNuevoSuministroForm()">
            <span>📦</span>
            <span>Nuevo Suministro</span>
          </button>
        </div>
      </div>

      <div class="filters-container">
        <div class="filters-grid">
          <div class="search-bar">
            <input type="text" class="form-input" placeholder="Buscar suministro..." id="searchSuministro">
          </div>
          <div class="form-group m-0">
            <label class="form-label">Tipo</label>
            <select class="form-select" id="filterTipoSuministro">
              <option value="">Todos los tipos</option>
            </select>
          </div>
          <div class="form-group m-0">
            <label class="form-label">Stock</label>
            <select class="form-select" id="filterStock">
              <option value="">Todos</option>
              <option value="bajo">Stock Bajo</option>
              <option value="normal">Stock Normal</option>
            </select>
          </div>
        </div>
      </div>

      <div class="data-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--spacing-lg);" id="bodegaGrid">
      </div>
    </div>
  `;

  this.renderBodegaGrid();
  this.setupBodegaFilters();
};

App.prototype.renderBodegaGrid = function () {
  const suministros = db.getData('suministros');
  const tiposSuministro = db.getData('tipos_suministro');
  const bodega = db.getData('bodega');
  const grid = document.getElementById('bodegaGrid');

  if (!grid) return;

  grid.innerHTML = '';

  // Populate tipo filter
  const filterTipo = document.getElementById('filterTipoSuministro');
  if (filterTipo && filterTipo.options.length === 1) {
    tiposSuministro.forEach(tipo => {
      const option = document.createElement('option');
      option.value = tipo.id;
      option.textContent = tipo.nombre;
      filterTipo.appendChild(option);
    });
  }

  suministros.forEach(suministro => {
    const tipo = tiposSuministro.find(t => t.id === suministro.tipo_suministro_id);
    const inventario = bodega.filter(b => b.suministro_id === suministro.id);
    const stockTotal = inventario.reduce((sum, b) => sum + b.cantidad, 0);
    const stockBajo = stockTotal < suministro.stock_minimo;

    const card = document.createElement('div');
    card.className = 'card hover-lift';
    card.style.borderLeft = stockBajo ? '4px solid var(--color-danger)' : '4px solid var(--color-success)';

    card.innerHTML = `
      <div class="card-header">
        <div style="display: flex; align-items: start; justify-content: space-between;">
          <div style="flex: 1;">
            <h3 class="card-title" style="margin: 0 0 var(--spacing-xs) 0;">${suministro.nombre}</h3>
            <p style="margin: 0; font-size: var(--font-size-sm); color: var(--color-text-secondary);">
              ${tipo ? tipo.nombre : 'N/A'} • Código: ${suministro.codigo}
            </p>
          </div>
          <div style="font-size: var(--font-size-3xl);">
            ${tipo && tipo.nombre === 'Toner' ? '🖨️' :
        tipo && tipo.nombre === 'Tinta' ? '🎨' :
          tipo && tipo.nombre === 'Papel' ? '📄' : '📦'}
          </div>
        </div>
      </div>
      <div class="card-body">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md); margin-bottom: var(--spacing-md);">
          <div style="text-align: center; padding: var(--spacing-md); background: ${stockBajo ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)'}; border-radius: var(--radius-md);">
            <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary);">Stock Actual</div>
            <div style="font-size: var(--font-size-2xl); font-weight: bold; color: ${stockBajo ? 'var(--color-danger)' : 'var(--color-success)'};">
              ${stockTotal}
            </div>
          </div>
          <div style="text-align: center; padding: var(--spacing-md); background: var(--color-bg-tertiary); border-radius: var(--radius-md);">
            <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary);">Stock Mínimo</div>
            <div style="font-size: var(--font-size-2xl); font-weight: bold;">
              ${suministro.stock_minimo}
            </div>
          </div>
        </div>
        ${stockBajo ? `
          <div class="alert alert-danger" style="margin: 0;">
            <span>⚠️</span>
            <span><strong>Stock Bajo:</strong> Requiere reposición</span>
          </div>
        ` : ''}
      </div>
      <div class="card-footer">
        <button class="btn btn-sm btn-primary" onclick="app.showIngresoSuministroForm(${suministro.id})">
          <span>+</span>
          <span>Ingreso</span>
        </button>
        <button class="btn btn-sm btn-secondary" onclick="app.showSalidaSuministroForm(${suministro.id})">
          <span>-</span>
          <span>Salida</span>
        </button>
        <button class="btn btn-sm btn-ghost" onclick="app.viewMovimientosSuministro(${suministro.id})" title="Historial">
          <span>📊</span>
        </button>
        <button class="btn btn-sm btn-ghost" onclick="app.editSuministro(${suministro.id})" title="Editar Suministro">
          <span>✏️</span>
        </button>
        <button class="btn btn-sm btn-ghost" onclick="app.deleteSuministro(${suministro.id})" title="Eliminar Suministro">
          <span>🗑️</span>
        </button>
      </div>
    `;
    grid.appendChild(card);
  });

  if (suministros.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">📦</div>
        <div class="empty-state-title">No hay suministros registrados</div>
        <div class="empty-state-description">Comienza agregando suministros al catálogo</div>
      </div>
    `;
  }
};

App.prototype.setupBodegaFilters = function () {
  const searchInput = document.getElementById('searchSuministro');
  const filterTipo = document.getElementById('filterTipoSuministro');
  const filterStock = document.getElementById('filterStock');

  const applyFilters = () => {
    const search = searchInput?.value.toLowerCase() || '';
    const tipo = filterTipo?.value || '';
    const stock = filterStock?.value || '';

    const cards = document.querySelectorAll('#bodegaGrid .card');
    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      const hasAlert = card.querySelector('.alert-danger');

      const matchesSearch = text.includes(search);
      const matchesStock = !stock ||
        (stock === 'bajo' && hasAlert) ||
        (stock === 'normal' && !hasAlert);

      card.style.display = (matchesSearch && matchesStock) ? '' : 'none';
    });
  };

  searchInput?.addEventListener('input', debounce(applyFilters, 300));
  filterTipo?.addEventListener('change', applyFilters);
  filterStock?.addEventListener('change', applyFilters);
};

App.prototype.showNuevoSuministroForm = function (suministroId = null) {
  const isEditing = suministroId !== null;
  const suministro = isEditing ? db.getById('suministros', suministroId) : null;
  const tiposSuministro = db.getData('tipos_suministro');
  const modelos = db.getData('modelos');
  const marcas = db.getData('marcas');

  const formHTML = `
    <form id="suministroForm">
      <div class="form-group">
        <label class="form-label required">Tipo de Suministro</label>
        <select class="form-select" name="tipo_suministro_id" id="tipoSuministroSelect" required onchange="app.toggleModelosCompatibles()">
          <option value="">Seleccione un tipo</option>
          ${tiposSuministro.map(t => `<option value="${t.id}" ${suministro && suministro.tipo_suministro_id === t.id ? 'selected' : ''}>${t.nombre}</option>`).join('')}
        </select>
      </div>
      
      <div class="form-group">
        <label class="form-label required">Nombre</label>
        <input type="text" class="form-input" name="nombre" value="${suministro ? suministro.nombre : ''}" required>
      </div>
      
      <div class="form-group">
        <label class="form-label required">Código</label>
        <input type="text" class="form-input" name="codigo" id="codigoSuministro" value="${suministro ? suministro.codigo : ''}" required>
        <span class="form-help">El código debe ser único en el sistema</span>
      </div>
      
      <div class="form-group">
        <label class="form-label required">Stock Mínimo</label>
        <input type="number" class="form-input" name="stock_minimo" min="0" value="${suministro ? suministro.stock_minimo : '5'}" required>
      </div>
      
      ${(() => {
      const tipo = tiposSuministro.find(t => t.id === (suministro ? suministro.tipo_suministro_id : null));
      const isTonerOrInk = tipo && (tipo.nombre === 'Toner' || tipo.nombre === 'Tinta');
      return `
          <div class="form-group" id="modelosCompatiblesGroup" style="display: ${isTonerOrInk ? 'block' : 'none'};">
            <label class="form-label">Modelos Compatibles</label>
            <div style="max-height: 200px; overflow-y: auto; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--spacing-sm);">
              ${modelos.map(modelo => {
        const marca = marcas.find(m => m.id === modelo.marca_id);
        const checked = suministro && suministro.modelos_compatibles && suministro.modelos_compatibles.includes(modelo.id) ? 'checked' : '';
        return `
                  <label style="display: block; padding: var(--spacing-xs); cursor: pointer; border-radius: var(--radius-sm);" 
                         onmouseover="this.style.background='var(--color-bg-tertiary)'" 
                         onmouseout="this.style.background='transparent'">
                    <input type="checkbox" name="modelos_compatibles" value="${modelo.id}" ${checked} style="margin-right: var(--spacing-xs);">
                    ${marca ? marca.nombre : 'N/A'} - ${modelo.nombre}
                  </label>
                `;
      }).join('')}
            </div>
            <span class="form-help">Selecciona los modelos de impresora compatibles con este suministro</span>
          </div>
        `;
    })()}
    </form>
  `;

  const modal = createModal(
    isEditing ? 'Editar Suministro' : 'Nuevo Suministro',
    formHTML,
    [
      {
        text: 'Cancelar',
        class: 'btn-secondary',
        onClick: () => closeModal(modal)
      },
      {
        text: isEditing ? 'Actualizar' : 'Crear',
        class: 'btn-primary',
        onClick: () => {
          const form = document.getElementById('suministroForm');
          if (!form.checkValidity()) {
            form.reportValidity();
            return;
          }

          const formData = new FormData(form);
          const codigo = formData.get('codigo').trim().toUpperCase();

          // Validate unique code (excluding current one if editing)
          const suministros = db.getData('suministros');
          const codigoExiste = suministros.some(s => s.codigo.toUpperCase() === codigo && (!isEditing || s.id !== suministroId));

          if (codigoExiste) {
            showToast(`El código "${codigo}" ya existe. Por favor use un código diferente.`, 'danger');
            document.getElementById('codigoSuministro').focus();
            return;
          }

          // Get selected compatible models
          const modelosCompatibles = [];
          const checkboxes = form.querySelectorAll('input[name="modelos_compatibles"]:checked');
          checkboxes.forEach(cb => {
            modelosCompatibles.push(parseInt(cb.value));
          });

          const data = {
            tipo_suministro_id: parseInt(formData.get('tipo_suministro_id')),
            nombre: formData.get('nombre'),
            codigo: codigo,
            stock_minimo: parseInt(formData.get('stock_minimo')),
            modelos_compatibles: modelosCompatibles
          };

          if (isEditing) {
            db.update('suministros', suministroId, data);
            showToast('Suministro actualizado exitosamente', 'success');
          } else {
            db.insert('suministros', data);
            showToast('Suministro creado exitosamente', 'success');
          }

          closeModal(modal);
          this.renderBodegaGrid();
        }
      }
    ]
  );

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('active'), 10);
};

App.prototype.editSuministro = function (id) {
  this.showNuevoSuministroForm(id);
};

App.prototype.toggleModelosCompatibles = function () {
  const tipoSelect = document.getElementById('tipoSuministroSelect');
  const modelosGroup = document.getElementById('modelosCompatiblesGroup');

  if (!tipoSelect || !modelosGroup) return;

  const tipoId = parseInt(tipoSelect.value);
  const tiposSuministro = db.getData('tipos_suministro');
  const tipo = tiposSuministro.find(t => t.id === tipoId);

  // Show compatibility selection only for Toner and Tinta
  if (tipo && (tipo.nombre === 'Toner' || tipo.nombre === 'Tinta')) {
    modelosGroup.style.display = 'block';
  } else {
    modelosGroup.style.display = 'none';
  }
};

App.prototype.showIngresoSuministroForm = function (suministroId = null) {
  const suministros = db.getData('suministros');
  const suministro = suministroId ? db.getById('suministros', suministroId) : null;

  const formHTML = `
    <form id="ingresoForm">
      <div class="form-group">
        <label class="form-label required">Suministro</label>
        <select class="form-select" name="suministro_id" required ${suministroId ? 'disabled' : ''}>
          ${suministros.map(s => `
            <option value="${s.id}" ${suministro && s.id === suministro.id ? 'selected' : ''}>
              ${s.nombre} (${s.codigo})
            </option>
          `).join('')}
        </select>
        ${suministroId ? `<input type="hidden" name="suministro_id" value="${suministroId}">` : ''}
      </div>
      
      <div class="form-group">
        <label class="form-label required">Cantidad</label>
        <input type="number" class="form-input" name="cantidad" min="1" required>
      </div>
      
      <div class="form-group">
        <label class="form-label required">Ubicación</label>
        <input type="text" class="form-input" name="ubicacion" placeholder="Ej: Estante A1" required>
      </div>
      
      <div class="form-group">
        <label class="form-label required">Fecha de Ingreso</label>
        <input type="date" class="form-input" name="fecha_ingreso" value="${getCurrentDate()}" required>
      </div>
    </form>
  `;

  const modal = createModal(
    'Ingreso de Suministros',
    formHTML,
    [
      {
        text: 'Cancelar',
        class: 'btn-secondary',
        onClick: () => closeModal(modal)
      },
      {
        text: 'Registrar Ingreso',
        class: 'btn-primary',
        onClick: () => {
          const form = document.getElementById('ingresoForm');
          if (!form.checkValidity()) {
            form.reportValidity();
            return;
          }

          const formData = new FormData(form);
          const suministroIdValue = parseInt(formData.get('suministro_id'));
          const cantidad = parseInt(formData.get('cantidad'));

          // Add to bodega
          db.insert('bodega', {
            suministro_id: suministroIdValue,
            cantidad: cantidad,
            ubicacion: formData.get('ubicacion'),
            fecha_ingreso: formData.get('fecha_ingreso')
          });

          // Register movement
          db.insert('movimientos_bodega', {
            suministro_id: suministroIdValue,
            tipo_movimiento: 'entrada',
            cantidad: cantidad,
            fecha: formData.get('fecha_ingreso'),
            usuario_id: auth.getCurrentUser().id,
            referencia: 'Ingreso manual'
          });

          showToast(`Ingreso registrado: ${cantidad} unidades`, 'success');
          closeModal(modal);
          this.renderBodegaGrid();
        }
      }
    ]
  );

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('active'), 10);
};

App.prototype.showSalidaSuministroForm = function (suministroId) {
  const suministro = db.getById('suministros', suministroId);
  const bodega = db.getData('bodega').filter(b => b.suministro_id === suministroId);
  const stockTotal = bodega.reduce((sum, b) => sum + b.cantidad, 0);
  const contratos = db.getData('contratos').filter(c => c.estado === 'vigente');
  const equipos = db.getData('equipos');

  const formHTML = `
    <form id="salidaForm">
      <div class="alert alert-info" style="margin-bottom: var(--spacing-lg);">
        <span>ℹ️</span>
        <div>
          <strong>${suministro.nombre}</strong><br>
          Stock disponible: <strong>${stockTotal}</strong> unidades
        </div>
      </div>
      
      <div class="form-group">
        <label class="form-label required">Tipo de Salida</label>
        <select class="form-select" name="tipo_salida" id="tipoSalida" required onchange="app.toggleContratoEquipo()">
          <option value="">Seleccione tipo</option>
          <option value="contrato">Asignación a Contrato</option>
          <option value="equipo">Instalación/Cambio en Equipo</option>
          <option value="otro">Otro Uso</option>
        </select>
      </div>
      
      <div class="form-group" id="contratoGroup" style="display: none;">
        <label class="form-label required">Contrato Destino</label>
        <select class="form-select" name="contrato_id" id="contratoSelect">
          <option value="">Seleccione un contrato</option>
          ${contratos.map(c => {
    const cliente = db.getById('clientes', c.cliente_id);
    return `<option value="${c.id}">${c.numero_contrato} - ${cliente ? cliente.nombre : 'N/A'}</option>`;
  }).join('')}
        </select>
      </div>
      
      <div class="form-group" id="equipoGroup" style="display: none;">
        <label class="form-label required">Equipo</label>
        <select class="form-select" name="equipo_id" id="equipoSelect">
          <option value="">Seleccione un equipo</option>
          ${equipos.filter(e => e.estado === 'instalado').map(e => {
    const modelo = db.getById('modelos', e.modelo_id);
    return `<option value="${e.id}">${modelo ? modelo.nombre : 'N/A'} - ${e.numero_serie} (${e.ubicacion})</option>`;
  }).join('')}
        </select>
      </div>
      
      <div class="form-group">
        <label class="form-label required">Cantidad</label>
        <input type="number" class="form-input" name="cantidad" min="1" max="${stockTotal}" required>
        <span class="form-help">Máximo disponible: ${stockTotal}</span>
      </div>
      
      <div class="form-group">
        <label class="form-label required">Referencia/Descripción</label>
        <input type="text" class="form-input" name="referencia" placeholder="Ej: Envío a contrato ABC-2024" required>
      </div>
      
      <div class="form-group">
        <label class="form-label">Observaciones</label>
        <textarea class="form-textarea" name="observaciones" placeholder="Detalles adicionales..."></textarea>
      </div>
      
      <input type="hidden" name="suministro_id" value="${suministroId}">
    </form>
  `;

  const modal = createModal(
    'Salida de Suministros',
    formHTML,
    [
      {
        text: 'Cancelar',
        class: 'btn-secondary',
        onClick: () => closeModal(modal)
      },
      {
        text: 'Registrar Salida',
        class: 'btn-danger',
        onClick: () => {
          const form = document.getElementById('salidaForm');
          if (!form.checkValidity()) {
            form.reportValidity();
            return;
          }

          const formData = new FormData(form);
          const cantidad = parseInt(formData.get('cantidad'));
          const tipoSalida = formData.get('tipo_salida');

          if (cantidad > stockTotal) {
            showToast('Cantidad excede el stock disponible', 'danger');
            return;
          }

          // Validate contract or equipment selection
          if (tipoSalida === 'contrato' && !formData.get('contrato_id')) {
            showToast('Debe seleccionar un contrato', 'warning');
            return;
          }
          if (tipoSalida === 'equipo' && !formData.get('equipo_id')) {
            showToast('Debe seleccionar un equipo', 'warning');
            return;
          }

          // Reduce from bodega (FIFO)
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

          // Register movement with contract/equipment info
          const movimientoData = {
            suministro_id: suministroId,
            tipo_movimiento: 'salida',
            cantidad: cantidad,
            fecha: getCurrentDate(),
            usuario_id: auth.getCurrentUser().id,
            referencia: formData.get('referencia'),
            observaciones: formData.get('observaciones'),
            tipo_salida: tipoSalida
          };

          if (tipoSalida === 'contrato') {
            movimientoData.contrato_id = parseInt(formData.get('contrato_id'));
          } else if (tipoSalida === 'equipo') {
            const equipoId = parseInt(formData.get('equipo_id'));
            movimientoData.equipo_id = equipoId;
            // Get contract from equipment
            const equipo = db.getById('equipos', equipoId);
            if (equipo) {
              movimientoData.contrato_id = equipo.contrato_id;
            }
          }

          db.insert('movimientos_bodega', movimientoData);

          showToast(`Salida registrada: ${cantidad} unidades`, 'success');
          closeModal(modal);
          this.renderBodegaGrid();
        }
      }
    ]
  );

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('active'), 10);
};

App.prototype.toggleContratoEquipo = function () {
  const tipoSalida = document.getElementById('tipoSalida')?.value;
  const contratoGroup = document.getElementById('contratoGroup');
  const equipoGroup = document.getElementById('equipoGroup');
  const contratoSelect = document.getElementById('contratoSelect');
  const equipoSelect = document.getElementById('equipoSelect');

  // Reset all first
  if (contratoGroup) contratoGroup.style.display = 'none';
  if (equipoGroup) equipoGroup.style.display = 'none';
  if (contratoSelect) contratoSelect.required = false;
  if (equipoSelect) equipoSelect.required = false;

  // Show appropriate field based on selection
  if (tipoSalida === 'contrato') {
    if (contratoGroup) contratoGroup.style.display = 'block';
    if (contratoSelect) contratoSelect.required = true;
  } else if (tipoSalida === 'equipo') {
    if (equipoGroup) equipoGroup.style.display = 'block';
    if (equipoSelect) equipoSelect.required = true;
  }
};

App.prototype.viewMovimientosSuministro = function (suministroId) {
  const suministro = db.getById('suministros', suministroId);
  const movimientos = db.getData('movimientos_bodega')
    .filter(m => m.suministro_id === suministroId)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  const contratos = db.getData('contratos');
  const equipos = db.getData('equipos');
  const modelos = db.getData('modelos');

  const content = `
    <div style="display: grid; gap: var(--spacing-lg);">
      <div class="detail-section">
        <h4 class="detail-section-title">Historial de Movimientos</h4>
        <div class="timeline">
          ${movimientos.map(mov => {
    let destinoInfo = '';
    if (mov.tipo_movimiento === 'salida') {
      if (mov.contrato_id) {
        const contrato = contratos.find(c => c.id === mov.contrato_id);
        const cliente = contrato ? db.getById('clientes', contrato.cliente_id) : null;
        destinoInfo = `<div style="font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-top: var(--spacing-xs);">
                  📄 Contrato: <strong>${contrato ? contrato.numero_contrato : 'N/A'}</strong>
                  ${cliente ? ` - ${cliente.nombre}` : ''}
                </div>`;
      }
      if (mov.equipo_id) {
        const equipo = equipos.find(e => e.id === mov.equipo_id);
        const modelo = equipo ? modelos.find(m => m.id === equipo.modelo_id) : null;
        destinoInfo += `<div style="font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-top: var(--spacing-xs);">
                  🖨️ Equipo: <strong>${modelo ? modelo.nombre : 'N/A'}</strong> - ${equipo ? equipo.numero_serie : 'N/A'}
                </div>`;
      }
      if (mov.tipo_salida) {
        const tipos = {
          'contrato': 'Asignación a Contrato',
          'equipo': 'Instalación/Cambio en Equipo',
          'otro': 'Otro Uso'
        };
        destinoInfo += `<div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary); margin-top: var(--spacing-xs);">
                  Tipo: ${tipos[mov.tipo_salida] || mov.tipo_salida}
                </div>`;
      }
    }

    return `
              <div class="timeline-item">
                <div class="timeline-date">${formatDate(mov.fecha)}</div>
                <div class="timeline-content">
                  <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                      <strong style="color: ${mov.tipo_movimiento === 'entrada' ? 'var(--color-success)' : 'var(--color-danger)'};">
                        ${mov.tipo_movimiento === 'entrada' ? '↑ ENTRADA' : '↓ SALIDA'}
                      </strong><br>
                      <span style="font-size: var(--font-size-sm);">${mov.referencia}</span>
                      ${destinoInfo}
                      ${mov.observaciones ? `<div style="font-size: var(--font-size-sm); color: var(--color-text-tertiary); margin-top: var(--spacing-xs); font-style: italic;">
                        ${mov.observaciones}
                      </div>` : ''}
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: var(--spacing-xs);">
                      <div style="font-size: var(--font-size-xl); font-weight: bold;">
                        ${mov.tipo_movimiento === 'entrada' ? '+' : '-'}${mov.cantidad}
                      </div>
                      ${mov.tipo_movimiento === 'entrada' ? `
                        <button class="btn btn-sm btn-ghost" style="color: var(--color-danger);" onclick="app.deleteIngresoBodega(${mov.id}, ${suministroId})" title="Anular Ingreso">
                          <span>🗑️</span>
                        </button>
                      ` : ''}
                    </div>
                  </div>
                </div>
              </div>
            `;
  }).join('')}
        </div>
        
        ${movimientos.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">📊</div>
            <div class="empty-state-title">Sin movimientos</div>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  const modal = createModal(`Historial: ${suministro.nombre}`, content, [
    {
      text: 'Cerrar',
      class: 'btn-secondary',
      onClick: () => closeModal(modal)
    },
    {
      text: 'Generar Reporte',
      class: 'btn-primary',
      onClick: () => {
        closeModal(modal);
        this.generarReporteSuministro(suministroId);
      }
    }
  ]);

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('active'), 10);
};

App.prototype.deleteSuministro = function (id) {
  const suministro = db.getById('suministros', id);
  const stockEntries = db.getData('bodega').filter(b => b.suministro_id === id);
  const totalStock = stockEntries.reduce((sum, s) => sum + s.cantidad, 0);

  if (totalStock > 0) {
    showToast('No se puede eliminar un suministro que todavía tiene existencias físicas en bodega', 'danger');
    return;
  }

  showConfirm(
    'Eliminar Suministro',
    `¿Estás seguro que deseas eliminar "${suministro.nombre}"? Se eliminará el catálogo y todo su historial de movimientos.`,
    () => {
      db.delete('suministros', id);

      // Clean up movements and bodega entries just in case
      const allMovs = db.getData('movimientos_bodega').filter(m => m.suministro_id !== id);
      db.setData('movimientos_bodega', allMovs);

      const allBodega = db.getData('bodega').filter(b => b.suministro_id !== id);
      db.setData('bodega', allBodega);

      showToast('Suministro eliminado exitosamente', 'success');
      this.renderBodegaGrid();
    }
  );
};

App.prototype.deleteIngresoBodega = function (movimientoId, suministroId) {
  showConfirm(
    'Anular Ingreso',
    '¿Estás seguro que deseas anular este ingreso? Esto restará la cantidad del stock actual.',
    () => {
      const movimientos = db.getData('movimientos_bodega');
      const mov = movimientos.find(m => m.id === movimientoId);

      if (!mov) return;

      const stockEntries = db.getData('bodega').filter(b => b.suministro_id === suministroId);
      const totalStock = stockEntries.reduce((sum, s) => sum + s.cantidad, 0);

      if (totalStock < mov.cantidad) {
        showToast('Error: No hay suficiente stock para anular este ingreso (parte del stock ya fue consumido)', 'danger');
        return;
      }

      // Logic to remove the stock from bodega entries
      let currentBodega = db.getData('bodega');
      let remainingToSub = mov.cantidad;

      // Try to find the exact entry first
      const exactEntryIdx = currentBodega.findIndex(b =>
        b.suministro_id === suministroId &&
        b.cantidad === mov.cantidad &&
        (b.fecha_ingreso === mov.fecha || b.documento_referencia === mov.documento_referencia)
      );

      if (exactEntryIdx !== -1) {
        currentBodega.splice(exactEntryIdx, 1);
      } else {
        // Distributed subtraction (backup logic)
        currentBodega = currentBodega.map(b => {
          if (b.suministro_id === suministroId && remainingToSub > 0) {
            const sub = Math.min(b.cantidad, remainingToSub);
            b.cantidad -= sub;
            remainingToSub -= sub;
          }
          return b;
        }).filter(b => b.cantidad > 0);
      }

      db.setData('bodega', currentBodega);
      db.setData('movimientos_bodega', movimientos.filter(m => m.id !== movimientoId));

      showToast('Ingreso anulado y stock actualizado', 'success');
      const activeModal = document.querySelector('.modal.active');
      if (activeModal) closeModal(activeModal);
      this.renderBodegaGrid();
    }
  );
};
