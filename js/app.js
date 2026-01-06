/**
 * CONSEROUT - Application Core
 * Main application logic and module loader
 */

class App {
    constructor() {
        this.currentModule = null;
        this.modules = {};
        this.init();
    }

    init() {
        // Check authentication
        if (!auth.requireAuth()) {
            return;
        }

        // Load user info
        this.loadUserInfo();

        // Setup navigation
        this.setupNavigation();

        // Setup logout
        this.setupLogout();
    }

    loadUserInfo() {
        const user = auth.getCurrentUser();
        if (user) {
            const initials = user.nombre.split(' ').map(n => n[0]).join('').substring(0, 2);
            const avatarEl = document.getElementById('userAvatar');
            const nameEl = document.getElementById('userName');
            const roleEl = document.getElementById('userRole');

            if (avatarEl) avatarEl.textContent = initials;
            if (nameEl) nameEl.textContent = user.nombre;
            if (roleEl) roleEl.textContent = user.perfil.nombre;
        }
    }

    setupNavigation() {
        // Handle nav item clicks
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();

                // Update active state
                document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');

                // Get module name
                const module = item.getAttribute('data-module');
                if (module) {
                    this.loadModule(module);
                }
            });
        });
    }

    setupLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                showConfirm(
                    'Cerrar Sesión',
                    '¿Estás seguro que deseas cerrar sesión?',
                    () => auth.logout()
                );
            });
        }
    }

    loadModule(moduleName) {
        const contentArea = document.querySelector('.content-area');
        if (!contentArea) return;

        // Update page title
        const topbarTitle = document.querySelector('.topbar-title h1');
        if (topbarTitle) {
            topbarTitle.textContent = this.getModuleTitle(moduleName);
        }

        // Load module content
        switch (moduleName) {
            case 'contratos':
                this.loadContratosModule(contentArea);
                break;
            case 'clientes':
                this.loadClientesModule(contentArea);
                break;
            case 'equipos-gestion':
                this.loadEquiposModule(contentArea);
                break;
            case 'contadores':
                this.loadContadoresModule(contentArea);
                break;
            case 'bodega':
                this.loadBodegaModule(contentArea);
                break;
            case 'reportes':
                this.loadReportesModule(contentArea);
                break;
            default:
                showToast(`Módulo "${moduleName}" en desarrollo`, 'info');
        }
    }

    getModuleTitle(moduleName) {
        const titles = {
            'contratos': 'Gestión de Contratos',
            'clientes': 'Gestión de Clientes',
            'equipos-gestion': 'Gestión de Equipos',
            'contadores': 'Registro de Contadores',
            'bodega': 'Gestión de Bodega',
            'reportes': 'Reportes y Análisis'
        };
        return titles[moduleName] || 'Dashboard';
    }

    loadContratosModule(container) {
        container.innerHTML = `
      <div class="module-container">
        <div class="module-header">
          <h2 class="module-title">Gestión de Contratos</h2>
          <div class="module-actions">
            <button class="btn btn-primary" onclick="app.showContratoForm()">
              <span>+</span>
              <span>Nuevo Contrato</span>
            </button>
          </div>
        </div>

        <div class="filters-container">
          <div class="filters-grid">
            <div class="search-bar">
              <input type="text" class="form-input" placeholder="Buscar contrato..." id="searchContrato">
            </div>
            <div class="form-group m-0">
              <select class="form-select" id="filterEstado">
                <option value="">Todos los estados</option>
                <option value="vigente">Vigente</option>
                <option value="cerrado">Cerrado</option>
              </select>
            </div>
            <div class="form-group m-0">
              <select class="form-select" id="filterCliente">
                <option value="">Todos los clientes</option>
              </select>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="table-container">
            <table class="table" id="contratosTable">
              <thead>
                <tr>
                  <th>N° Contrato</th>
                  <th>Cliente</th>
                  <th>Fecha Inicio</th>
                  <th>Fecha Fin</th>
                  <th>Equipos</th>
                  <th>Valor Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody id="contratosTableBody">
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

        this.renderContratosTable();
        this.setupContratosFilters();
    }

    renderContratosTable() {
        const contratos = db.getData('contratos');
        const clientes = db.getData('clientes');
        const equipos = db.getData('equipos');
        const tbody = document.getElementById('contratosTableBody');

        if (!tbody) return;

        tbody.innerHTML = '';

        // Populate cliente filter
        const filterCliente = document.getElementById('filterCliente');
        if (filterCliente && filterCliente.options.length === 1) {
            clientes.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente.id;
                option.textContent = cliente.nombre;
                filterCliente.appendChild(option);
            });
        }

        contratos.forEach(contrato => {
            const cliente = clientes.find(c => c.id === contrato.cliente_id);
            const equiposContrato = equipos.filter(e => e.contrato_id === contrato.id);

            const tr = document.createElement('tr');
            tr.innerHTML = `
        <td><strong>${contrato.numero_contrato}</strong></td>
        <td>${cliente ? cliente.nombre : '-'}</td>
        <td>${formatDate(contrato.fecha_inicio)}</td>
        <td>${formatDate(contrato.fecha_fin)}</td>
        <td>${equiposContrato.length}</td>
        <td>${formatCurrency(contrato.valor_total)}</td>
        <td>${getStatusBadge(contrato.estado)}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-sm btn-ghost" onclick="app.viewContrato(${contrato.id})" title="Ver">
              👁️
            </button>
            <button class="btn btn-sm btn-ghost" onclick="app.editContrato(${contrato.id})" title="Editar">
              ✏️
            </button>
            <button class="btn btn-sm btn-ghost" onclick="app.deleteContrato(${contrato.id})" title="Eliminar">
              🗑️
            </button>
          </div>
        </td>
      `;
            tbody.appendChild(tr);
        });
    }

    setupContratosFilters() {
        const searchInput = document.getElementById('searchContrato');
        const filterEstado = document.getElementById('filterEstado');
        const filterCliente = document.getElementById('filterCliente');

        const applyFilters = () => {
            const search = searchInput?.value.toLowerCase() || '';
            const estado = filterEstado?.value || '';
            const clienteId = filterCliente?.value || '';

            const rows = document.querySelectorAll('#contratosTableBody tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                const estadoBadge = row.querySelector('.badge');
                const rowEstado = estadoBadge?.textContent.toLowerCase() || '';

                const matchesSearch = text.includes(search);
                const matchesEstado = !estado || rowEstado.includes(estado);

                row.style.display = (matchesSearch && matchesEstado) ? '' : 'none';
            });
        };

        searchInput?.addEventListener('input', debounce(applyFilters, 300));
        filterEstado?.addEventListener('change', applyFilters);
        filterCliente?.addEventListener('change', applyFilters);
    }

    showContratoForm(contratoId = null) {
        const contrato = contratoId ? db.getById('contratos', contratoId) : null;
        const clientes = db.getData('clientes');

        const formHTML = `
      <form id="contratoForm">
        <div class="form-group">
          <label class="form-label required">Cliente</label>
          <select class="form-select" name="cliente_id" required>
            <option value="">Seleccione un cliente</option>
            ${clientes.map(c => `
              <option value="${c.id}" ${contrato && contrato.cliente_id === c.id ? 'selected' : ''}>
                ${c.nombre}
              </option>
            `).join('')}
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label required">Número de Contrato</label>
          <input type="text" class="form-input" name="numero_contrato" 
                 value="${contrato ? contrato.numero_contrato : ''}" required>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md);">
          <div class="form-group">
            <label class="form-label required">Fecha Inicio</label>
            <input type="date" class="form-input" name="fecha_inicio" 
                   value="${contrato ? formatDateInput(contrato.fecha_inicio) : ''}" required>
          </div>
          
          <div class="form-group">
            <label class="form-label required">Fecha Fin</label>
            <input type="date" class="form-input" name="fecha_fin" 
                   value="${contrato ? formatDateInput(contrato.fecha_fin) : ''}" required>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label required">Valor Total</label>
          <input type="number" class="form-input" name="valor_total" 
                 value="${contrato ? contrato.valor_total : ''}" required>
        </div>
        
        <div class="form-group">
          <label class="form-label">Descripción</label>
          <textarea class="form-textarea" name="descripcion">${contrato ? contrato.descripcion : ''}</textarea>
        </div>
        
        <div class="form-group">
          <label class="form-label required">Estado</label>
          <select class="form-select" name="estado" required>
            <option value="vigente" ${contrato && contrato.estado === 'vigente' ? 'selected' : ''}>Vigente</option>
            <option value="cerrado" ${contrato && contrato.estado === 'cerrado' ? 'selected' : ''}>Cerrado</option>
          </select>
        </div>
      </form>
    `;

        const modal = createModal(
            contratoId ? 'Editar Contrato' : 'Nuevo Contrato',
            formHTML,
            [
                {
                    text: 'Cancelar',
                    class: 'btn-secondary',
                    onClick: () => closeModal(modal)
                },
                {
                    text: contratoId ? 'Actualizar' : 'Crear',
                    class: 'btn-primary',
                    onClick: () => this.saveContrato(contratoId, modal)
                }
            ]
        );

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 10);
    }

    saveContrato(contratoId, modal) {
        const form = document.getElementById('contratoForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const data = {
            cliente_id: parseInt(formData.get('cliente_id')),
            numero_contrato: formData.get('numero_contrato'),
            fecha_inicio: formData.get('fecha_inicio'),
            fecha_fin: formData.get('fecha_fin'),
            valor_total: parseFloat(formData.get('valor_total')),
            descripcion: formData.get('descripcion'),
            estado: formData.get('estado')
        };

        if (contratoId) {
            db.update('contratos', contratoId, data);
            showToast('Contrato actualizado exitosamente', 'success');
        } else {
            db.insert('contratos', data);
            showToast('Contrato creado exitosamente', 'success');
        }

        closeModal(modal);
        this.renderContratosTable();
    }

    viewContrato(id) {
        const contrato = db.getById('contratos', id);
        const cliente = db.getById('clientes', contrato.cliente_id);
        const equipos = db.getBy('equipos', 'contrato_id', id);
        const tarifas = db.getBy('tarifas_contrato', 'contrato_id', id);

        const content = `
      <div style="display: grid; gap: var(--spacing-lg);">
        <div class="detail-section">
          <h4 class="detail-section-title">Información General</h4>
          <div class="detail-row">
            <div class="detail-label">Cliente:</div>
            <div class="detail-value">${cliente.nombre}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">N° Contrato:</div>
            <div class="detail-value">${contrato.numero_contrato}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Período:</div>
            <div class="detail-value">${formatDate(contrato.fecha_inicio)} - ${formatDate(contrato.fecha_fin)}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Valor Total:</div>
            <div class="detail-value">${formatCurrency(contrato.valor_total)}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Estado:</div>
            <div class="detail-value">${getStatusBadge(contrato.estado)}</div>
          </div>
        </div>
        
        <div class="detail-section">
          <h4 class="detail-section-title">Descripción</h4>
          <p>${contrato.descripcion}</p>
        </div>
        
        <div class="detail-section">
          <h4 class="detail-section-title">Equipos Asignados</h4>
          <p><strong>${equipos.length}</strong> equipos en este contrato</p>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-sm); margin-top: var(--spacing-md);">
            <div style="text-align: center; padding: var(--spacing-md); background: rgba(34, 197, 94, 0.1); border-radius: var(--radius-md);">
              <div style="font-size: var(--font-size-2xl); font-weight: bold; color: var(--color-success);">
                ${equipos.filter(e => e.estado === 'instalado').length}
              </div>
              <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary);">Instalados</div>
            </div>
            <div style="text-align: center; padding: var(--spacing-md); background: rgba(251, 146, 60, 0.1); border-radius: var(--radius-md);">
              <div style="font-size: var(--font-size-2xl); font-weight: bold; color: var(--color-warning);">
                ${equipos.filter(e => e.estado === 'sin_instalar').length}
              </div>
              <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary);">Sin Instalar</div>
            </div>
            <div style="text-align: center; padding: var(--spacing-md); background: rgba(14, 165, 233, 0.1); border-radius: var(--radius-md);">
              <div style="font-size: var(--font-size-2xl); font-weight: bold; color: var(--color-info);">
                ${equipos.filter(e => e.estado === 'bodega').length}
              </div>
              <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary);">En Bodega</div>
            </div>
          </div>
        </div>
        
        ${tarifas.length > 0 ? `
          <div class="detail-section">
            <h4 class="detail-section-title">Tarifas</h4>
            ${tarifas.map(t => `
              <div class="detail-row">
                <div class="detail-label">${t.tipo_servicio}:</div>
                <div class="detail-value">${formatCurrency(t.valor_unitario)} por unidad</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;

        const modal = createModal('Detalles del Contrato', content, [
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
                    this.showContratoForm(id);
                }
            }
        ]);

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 10);
    }

    editContrato(id) {
        this.showContratoForm(id);
    }

    deleteContrato(id) {
        const contrato = db.getById('contratos', id);
        showConfirm(
            'Eliminar Contrato',
            `¿Estás seguro que deseas eliminar el contrato ${contrato.numero_contrato}?`,
            () => {
                db.delete('contratos', id);
                showToast('Contrato eliminado exitosamente', 'success');
                this.renderContratosTable();
            }
        );
    }

    // Placeholder methods for other modules
    loadClientesModule(container) {
        showToast('Módulo de Clientes en desarrollo', 'info');
    }

    loadEquiposModule(container) {
        showToast('Módulo de Equipos en desarrollo', 'info');
    }

    loadContadoresModule(container) {
        showToast('Módulo de Contadores en desarrollo', 'info');
    }

    loadBodegaModule(container) {
        showToast('Módulo de Bodega en desarrollo', 'info');
    }

    loadReportesModule(container) {
        showToast('Módulo de Reportes en desarrollo', 'info');
    }
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new App();
});
