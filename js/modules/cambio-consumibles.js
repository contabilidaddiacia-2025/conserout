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
            <label class="form-label">Técnico</label>
            <select class="form-select" id="filterTecnicoCambio">
              <option value="">Todos los técnicos</option>
            </select>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="table-container">
          <table class="table" id="cambiosTable">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Equipo</th>
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
};

App.prototype.renderCambiosTable = function () {
    const cambios = db.getData('cambios_consumibles') || [];
    const equipos = db.getData('equipos');
    const modelos = db.getData('modelos');
    const suministros = db.getData('suministros');
    const usuarios = db.getData('usuarios');
    const tbody = document.getElementById('cambiosTableBody');

    if (!tbody) return;

    tbody.innerHTML = '';

    // Populate tecnico filter
    const filterTecnico = document.getElementById('filterTecnicoCambio');
    if (filterTecnico && filterTecnico.options.length === 1) {
        usuarios.filter(u => u.perfil_id === 3).forEach(tecnico => {
            const option = document.createElement('option');
            option.value = tecnico.id;
            option.textContent = tecnico.nombre;
            filterTecnico.appendChild(option);
        });
    }

    cambios.forEach(cambio => {
        const equipo = equipos.find(e => e.id === cambio.equipo_id);
        const modelo = equipo ? modelos.find(m => m.id === equipo.modelo_id) : null;
        const suministro = suministros.find(s => s.id === cambio.suministro_id);
        const tecnico = usuarios.find(u => u.id === cambio.tecnico_id);

        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>${formatDate(cambio.fecha)}</td>
      <td>${modelo ? modelo.nombre : 'N/A'}</td>
      <td><code>${equipo ? equipo.numero_serie : '-'}</code></td>
      <td>${suministro ? suministro.nombre : 'N/A'}</td>
      <td><strong>${cambio.cantidad}</strong></td>
      <td>${tecnico ? tecnico.nombre : '-'}</td>
      <td>
        <button class="btn btn-sm btn-ghost" onclick="app.viewCambioConsumible(${cambio.id})" title="Ver">
          👁️
        </button>
      </td>
    `;
        tbody.appendChild(tr);
    });

    if (cambios.length === 0) {
        tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <div class="empty-state-icon">🔄</div>
          <div class="empty-state-title">No hay cambios de consumibles registrados</div>
        </td>
      </tr>
    `;
    }
};

App.prototype.showCambioConsumibleForm = function () {
    const equipos = db.getData('equipos').filter(e => e.estado === 'instalado');
    const tecnicos = db.getData('usuarios').filter(u => u.perfil_id === 3);
    const modelos = db.getData('modelos');

    const formHTML = `
    <form id="cambioConsumibleForm">
      <div class="form-group">
        <label class="form-label required">Equipo</label>
        <select class="form-select" name="equipo_id" id="equipoSelectCambio" required onchange="app.loadSuministrosCompatibles()">
          <option value="">Seleccione un equipo</option>
          ${equipos.map(e => {
        const modelo = modelos.find(m => m.id === e.modelo_id);
        return `<option value="${e.id}" data-modelo-id="${e.modelo_id}">${modelo ? modelo.nombre : 'N/A'} - ${e.numero_serie} (${e.ubicacion})</option>`;
    }).join('')}
        </select>
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

                    showToast('Cambio de consumible registrado exitosamente', 'success');
                    closeModal(modal);
                    this.renderCambiosTable();
                }
            }
        ]
    );

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
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
