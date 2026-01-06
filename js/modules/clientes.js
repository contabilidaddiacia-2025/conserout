/**
 * CONSEROUT - Clients Module
 * Complete CRUD for client management
 */

// Extend App class with clients module
App.prototype.loadClientesModule = function (container) {
    container.innerHTML = `
    <div class="module-container">
      <div class="module-header">
        <h2 class="module-title">Gestión de Clientes</h2>
        <div class="module-actions">
          <button class="btn btn-primary" onclick="app.showClienteForm()">
            <span>+</span>
            <span>Nuevo Cliente</span>
          </button>
        </div>
      </div>

      <div class="filters-container">
        <div class="filters-grid">
          <div class="search-bar">
            <input type="text" class="form-input" placeholder="Buscar cliente..." id="searchCliente">
          </div>
          <div class="form-group m-0">
            <select class="form-select" id="filterEstadoCliente">
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="pasivo">Pasivo</option>
            </select>
          </div>
        </div>
      </div>

      <div class="data-grid">
        <div id="clientesGrid"></div>
      </div>
    </div>
  `;

    this.renderClientesGrid();
    this.setupClientesFilters();
};

App.prototype.renderClientesGrid = function () {
    const clientes = db.getData('clientes');
    const contratos = db.getData('contratos');
    const grid = document.getElementById('clientesGrid');

    if (!grid) return;

    grid.innerHTML = '';

    clientes.forEach(cliente => {
        const clienteContratos = contratos.filter(c => c.cliente_id === cliente.id);
        const contratosActivos = clienteContratos.filter(c => c.estado === 'vigente').length;

        const card = document.createElement('div');
        card.className = 'card hover-lift';
        card.innerHTML = `
      <div class="card-header">
        <div style="display: flex; align-items: center; gap: var(--spacing-md);">
          <div style="width: 60px; height: 60px; background: var(--gradient-primary); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; font-size: var(--font-size-2xl);">
            🏢
          </div>
          <div style="flex: 1;">
            <h3 class="card-title" style="margin: 0;">${cliente.nombre}</h3>
            <p style="margin: 0; font-size: var(--font-size-sm); color: var(--color-text-secondary);">
              RUT: ${cliente.rut}
            </p>
          </div>
          <div>
            ${getStatusBadge(cliente.estado)}
          </div>
        </div>
      </div>
      <div class="card-body">
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md); margin-bottom: var(--spacing-md);">
          <div>
            <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary);">Contacto</div>
            <div style="font-weight: var(--font-weight-medium);">${cliente.contacto}</div>
          </div>
          <div>
            <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary);">Teléfono</div>
            <div style="font-weight: var(--font-weight-medium);">${cliente.telefono}</div>
          </div>
          <div>
            <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary);">Email</div>
            <div style="font-weight: var(--font-weight-medium);">${cliente.email}</div>
          </div>
          <div>
            <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary);">Contratos Activos</div>
            <div style="font-weight: var(--font-weight-bold); color: var(--color-primary);">${contratosActivos}</div>
          </div>
        </div>
        <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary); margin-bottom: var(--spacing-xs);">Dirección</div>
        <div style="margin-bottom: var(--spacing-md);">${cliente.direccion}</div>
      </div>
      <div class="card-footer">
        <button class="btn btn-sm btn-ghost" onclick="app.viewCliente(${cliente.id})">
          <span>👁️</span>
          <span>Ver</span>
        </button>
        <button class="btn btn-sm btn-ghost" onclick="app.editCliente(${cliente.id})">
          <span>✏️</span>
          <span>Editar</span>
        </button>
        <button class="btn btn-sm btn-ghost" onclick="app.deleteCliente(${cliente.id})">
          <span>🗑️</span>
          <span>Eliminar</span>
        </button>
      </div>
    `;
        grid.appendChild(card);
    });

    if (clientes.length === 0) {
        grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🏢</div>
        <div class="empty-state-title">No hay clientes registrados</div>
        <div class="empty-state-description">Comienza agregando tu primer cliente</div>
      </div>
    `;
    }
};

App.prototype.setupClientesFilters = function () {
    const searchInput = document.getElementById('searchCliente');
    const filterEstado = document.getElementById('filterEstadoCliente');

    const applyFilters = () => {
        const search = searchInput?.value.toLowerCase() || '';
        const estado = filterEstado?.value || '';

        const cards = document.querySelectorAll('#clientesGrid .card');
        cards.forEach(card => {
            const text = card.textContent.toLowerCase();
            const badge = card.querySelector('.badge');
            const cardEstado = badge?.textContent.toLowerCase() || '';

            const matchesSearch = text.includes(search);
            const matchesEstado = !estado || cardEstado.includes(estado);

            card.style.display = (matchesSearch && matchesEstado) ? '' : 'none';
        });
    };

    searchInput?.addEventListener('input', debounce(applyFilters, 300));
    filterEstado?.addEventListener('change', applyFilters);
};

App.prototype.showClienteForm = function (clienteId = null) {
    const cliente = clienteId ? db.getById('clientes', clienteId) : null;

    const formHTML = `
    <form id="clienteForm">
      <div class="form-group">
        <label class="form-label required">Nombre / Razón Social</label>
        <input type="text" class="form-input" name="nombre" 
               value="${cliente ? cliente.nombre : ''}" required>
      </div>
      
      <div class="form-group">
        <label class="form-label required">RUT</label>
        <input type="text" class="form-input" name="rut" 
               value="${cliente ? cliente.rut : ''}" 
               placeholder="12.345.678-9" required>
        <span class="form-help">Formato: 12.345.678-9</span>
      </div>
      
      <div class="form-group">
        <label class="form-label required">Dirección</label>
        <input type="text" class="form-input" name="direccion" 
               value="${cliente ? cliente.direccion : ''}" required>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md);">
        <div class="form-group">
          <label class="form-label required">Teléfono</label>
          <input type="tel" class="form-input" name="telefono" 
                 value="${cliente ? cliente.telefono : ''}" 
                 placeholder="+56 2 2345 6789" required>
        </div>
        
        <div class="form-group">
          <label class="form-label required">Email</label>
          <input type="email" class="form-input" name="email" 
                 value="${cliente ? cliente.email : ''}" required>
        </div>
      </div>
      
      <div class="form-group">
        <label class="form-label required">Contacto Principal</label>
        <input type="text" class="form-input" name="contacto" 
               value="${cliente ? cliente.contacto : ''}" required>
      </div>
      
      <div class="form-group">
        <label class="form-label required">Estado</label>
        <select class="form-select" name="estado" required>
          <option value="activo" ${cliente && cliente.estado === 'activo' ? 'selected' : ''}>Activo</option>
          <option value="pasivo" ${cliente && cliente.estado === 'pasivo' ? 'selected' : ''}>Pasivo</option>
        </select>
      </div>
    </form>
  `;

    const modal = createModal(
        clienteId ? 'Editar Cliente' : 'Nuevo Cliente',
        formHTML,
        [
            {
                text: 'Cancelar',
                class: 'btn-secondary',
                onClick: () => closeModal(modal)
            },
            {
                text: clienteId ? 'Actualizar' : 'Crear',
                class: 'btn-primary',
                onClick: () => this.saveCliente(clienteId, modal)
            }
        ]
    );

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
};

App.prototype.saveCliente = function (clienteId, modal) {
    const form = document.getElementById('clienteForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    const data = {
        nombre: formData.get('nombre'),
        rut: formData.get('rut'),
        direccion: formData.get('direccion'),
        telefono: formData.get('telefono'),
        email: formData.get('email'),
        contacto: formData.get('contacto'),
        estado: formData.get('estado')
    };

    if (clienteId) {
        db.update('clientes', clienteId, data);
        showToast('Cliente actualizado exitosamente', 'success');
    } else {
        db.insert('clientes', data);
        showToast('Cliente creado exitosamente', 'success');
    }

    closeModal(modal);
    this.renderClientesGrid();
};

App.prototype.viewCliente = function (id) {
    const cliente = db.getById('clientes', id);
    const contratos = db.getBy('contratos', 'cliente_id', id);

    const content = `
    <div style="display: grid; gap: var(--spacing-lg);">
      <div class="detail-section">
        <h4 class="detail-section-title">Información del Cliente</h4>
        <div class="detail-row">
          <div class="detail-label">Razón Social:</div>
          <div class="detail-value">${cliente.nombre}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">RUT:</div>
          <div class="detail-value">${cliente.rut}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Dirección:</div>
          <div class="detail-value">${cliente.direccion}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Teléfono:</div>
          <div class="detail-value">${cliente.telefono}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Email:</div>
          <div class="detail-value">${cliente.email}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Contacto:</div>
          <div class="detail-value">${cliente.contacto}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Estado:</div>
          <div class="detail-value">${getStatusBadge(cliente.estado)}</div>
        </div>
      </div>
      
      <div class="detail-section">
        <h4 class="detail-section-title">Contratos</h4>
        ${contratos.length > 0 ? `
          <div style="display: grid; gap: var(--spacing-sm);">
            ${contratos.map(c => `
              <div style="padding: var(--spacing-md); background: var(--color-bg-tertiary); border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong>${c.numero_contrato}</strong><br>
                  <span style="font-size: var(--font-size-sm); color: var(--color-text-secondary);">
                    ${formatDate(c.fecha_inicio)} - ${formatDate(c.fecha_fin)}
                  </span>
                </div>
                <div>
                  ${getStatusBadge(c.estado)}
                </div>
              </div>
            `).join('')}
          </div>
        ` : '<p>No hay contratos asociados</p>'}
      </div>
    </div>
  `;

    const modal = createModal('Detalles del Cliente', content, [
        {
            text: 'Cerrar',
            class: 'btn-secondary',
            onClick: () => closeModal(modal)
        },
        {
            text: 'Editar',
            class: 'btn-primary',
            onClick: () => {
                closeModal(modal);
                this.showClienteForm(id);
            }
        }
    ]);

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
};

App.prototype.editCliente = function (id) {
    this.showClienteForm(id);
};

App.prototype.deleteCliente = function (id) {
    const cliente = db.getById('clientes', id);
    const contratos = db.getBy('contratos', 'cliente_id', id);

    if (contratos.length > 0) {
        showToast('No se puede eliminar un cliente con contratos asociados', 'danger');
        return;
    }

    showConfirm(
        'Eliminar Cliente',
        `¿Estás seguro que deseas eliminar a ${cliente.nombre}?`,
        () => {
            db.delete('clientes', id);
            showToast('Cliente eliminado exitosamente', 'success');
            this.renderClientesGrid();
        }
    );
};
