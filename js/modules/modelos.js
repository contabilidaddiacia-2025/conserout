/**
 * CONSEROUT - Models Management Module
 * CRUD for equipment models with brand and type association
 */

App.prototype.loadModelosModule = function (container) {
    container.innerHTML = `
    <div class="module-container">
      <div class="module-header">
        <h2 class="module-title">Gestión de Modelos</h2>
        <div class="module-actions">
          <button class="btn btn-primary" onclick="app.showModeloForm()">
            <span>+</span>
            <span>Nuevo Modelo</span>
          </button>
        </div>
      </div>

      <div class="filters-container">
        <div class="filters-grid">
          <div class="search-bar">
            <input type="text" class="form-input" placeholder="Buscar modelo..." id="searchModelo">
          </div>
          <div class="form-group m-0">
            <label class="form-label">Marca</label>
            <select class="form-select" id="filterMarcaModelo">
              <option value="">Todas las marcas</option>
            </select>
          </div>
          <div class="form-group m-0">
            <label class="form-label">Tipo</label>
            <select class="form-select" id="filterTipoModelo">
              <option value="">Todos los tipos</option>
            </select>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="table-container">
          <table class="table" id="modelosTable">
            <thead>
              <tr>
                <th>Modelo</th>
                <th>Marca</th>
                <th>Tipo</th>
                <th>Equipos</th>
                <th>Suministros</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="modelosTableBody">
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

    this.renderModelosTable();
    this.setupModelosFilters();
};

App.prototype.renderModelosTable = function () {
    const modelos = db.getData('modelos');
    const marcas = db.getData('marcas');
    const tiposEquipo = db.getData('tipos_equipo');
    const equipos = db.getData('equipos');
    const suministros = db.getData('suministros');
    const tbody = document.getElementById('modelosTableBody');

    if (!tbody) return;

    tbody.innerHTML = '';

    // Populate filters
    const filterMarca = document.getElementById('filterMarcaModelo');
    const filterTipo = document.getElementById('filterTipoModelo');

    if (filterMarca && filterMarca.options.length === 1) {
        marcas.forEach(marca => {
            const option = document.createElement('option');
            option.value = marca.id;
            option.textContent = marca.nombre;
            filterMarca.appendChild(option);
        });
    }

    if (filterTipo && filterTipo.options.length === 1) {
        tiposEquipo.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo.id;
            option.textContent = tipo.nombre;
            filterTipo.appendChild(option);
        });
    }

    modelos.forEach(modelo => {
        const marca = marcas.find(m => m.id === modelo.marca_id);
        const tipo = tiposEquipo.find(t => t.id === modelo.tipo_equipo_id);
        const equiposModelo = equipos.filter(e => e.modelo_id === modelo.id);
        const suministrosCompatibles = suministros.filter(s =>
            s.modelos_compatibles && s.modelos_compatibles.includes(modelo.id)
        );

        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td><strong>${modelo.nombre}</strong></td>
      <td>${marca ? marca.nombre : 'N/A'}</td>
      <td>${tipo ? tipo.nombre : 'N/A'}</td>
      <td>${equiposModelo.length}</td>
      <td>${suministrosCompatibles.length}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-sm btn-ghost" onclick="app.viewModelo(${modelo.id})" title="Ver">
            👁️
          </button>
          <button class="btn btn-sm btn-ghost" onclick="app.editModelo(${modelo.id})" title="Editar">
            ✏️
          </button>
          <button class="btn btn-sm btn-ghost" onclick="app.deleteModelo(${modelo.id})" title="Eliminar">
            🗑️
          </button>
        </div>
      </td>
    `;
        tbody.appendChild(tr);
    });

    if (modelos.length === 0) {
        tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          <div class="empty-state-icon">📱</div>
          <div class="empty-state-title">No hay modelos registrados</div>
        </td>
      </tr>
    `;
    }
};

App.prototype.setupModelosFilters = function () {
    const searchInput = document.getElementById('searchModelo');
    const filterMarca = document.getElementById('filterMarcaModelo');
    const filterTipo = document.getElementById('filterTipoModelo');

    const applyFilters = () => {
        const search = searchInput?.value.toLowerCase() || '';
        const marcaId = filterMarca?.value || '';
        const tipoId = filterTipo?.value || '';

        const rows = document.querySelectorAll('#modelosTableBody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const matchesSearch = text.includes(search);

            row.style.display = matchesSearch ? '' : 'none';
        });
    };

    searchInput?.addEventListener('input', debounce(applyFilters, 300));
    filterMarca?.addEventListener('change', applyFilters);
    filterTipo?.addEventListener('change', applyFilters);
};

App.prototype.showModeloForm = function (modeloId = null) {
    const modelo = modeloId ? db.getById('modelos', modeloId) : null;
    const marcas = db.getData('marcas');
    const tiposEquipo = db.getData('tipos_equipo');

    const formHTML = `
    <form id="modeloForm">
      <div class="form-group">
        <label class="form-label required">Marca</label>
        <select class="form-select" name="marca_id" required>
          <option value="">Seleccione una marca</option>
          ${marcas.map(m => `
            <option value="${m.id}" ${modelo && modelo.marca_id === m.id ? 'selected' : ''}>
              ${m.nombre}
            </option>
          `).join('')}
        </select>
      </div>
      
      <div class="form-group">
        <label class="form-label required">Nombre del Modelo</label>
        <input type="text" class="form-input" name="nombre" 
               value="${modelo ? modelo.nombre : ''}" 
               placeholder="Ej: LaserJet Pro M404dn" required>
      </div>
      
      <div class="form-group">
        <label class="form-label required">Tipo de Equipo</label>
        <select class="form-select" name="tipo_equipo_id" required>
          <option value="">Seleccione un tipo</option>
          ${tiposEquipo.map(t => `
            <option value="${t.id}" ${modelo && modelo.tipo_equipo_id === t.id ? 'selected' : ''}>
              ${t.nombre}
            </option>
          `).join('')}
        </select>
      </div>
    </form>
  `;

    const modal = createModal(
        modeloId ? 'Editar Modelo' : 'Nuevo Modelo',
        formHTML,
        [
            {
                text: 'Cancelar',
                class: 'btn-secondary',
                onClick: () => closeModal(modal)
            },
            {
                text: modeloId ? 'Actualizar' : 'Crear',
                class: 'btn-primary',
                onClick: () => {
                    const form = document.getElementById('modeloForm');
                    if (!form.checkValidity()) {
                        form.reportValidity();
                        return;
                    }

                    const formData = new FormData(form);
                    const data = {
                        marca_id: parseInt(formData.get('marca_id')),
                        nombre: formData.get('nombre').trim(),
                        tipo_equipo_id: parseInt(formData.get('tipo_equipo_id'))
                    };

                    if (modeloId) {
                        db.update('modelos', modeloId, data);
                        showToast('Modelo actualizado exitosamente', 'success');
                    } else {
                        db.insert('modelos', data);
                        showToast('Modelo creado exitosamente', 'success');
                    }

                    closeModal(modal);
                    this.renderModelosTable();
                }
            }
        ]
    );

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
};

App.prototype.viewModelo = function (id) {
    const modelo = db.getById('modelos', id);
    const marca = db.getById('marcas', modelo.marca_id);
    const tipo = db.getById('tipos_equipo', modelo.tipo_equipo_id);
    const equipos = db.getData('equipos').filter(e => e.modelo_id === id);
    const suministros = db.getData('suministros').filter(s =>
        s.modelos_compatibles && s.modelos_compatibles.includes(id)
    );

    const content = `
    <div style="display: grid; gap: var(--spacing-lg);">
      <div class="detail-section">
        <h4 class="detail-section-title">Información del Modelo</h4>
        <div class="detail-row">
          <div class="detail-label">Marca:</div>
          <div class="detail-value">${marca ? marca.nombre : 'N/A'}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Modelo:</div>
          <div class="detail-value">${modelo.nombre}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Tipo:</div>
          <div class="detail-value">${tipo ? tipo.nombre : 'N/A'}</div>
        </div>
      </div>
      
      <div class="detail-section">
        <h4 class="detail-section-title">Estadísticas</h4>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md);">
          <div style="text-align: center; padding: var(--spacing-md); background: var(--color-bg-tertiary); border-radius: var(--radius-md);">
            <div style="font-size: var(--font-size-2xl); font-weight: bold; color: var(--color-primary);">
              ${equipos.length}
            </div>
            <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary);">Equipos</div>
          </div>
          <div style="text-align: center; padding: var(--spacing-md); background: var(--color-bg-tertiary); border-radius: var(--radius-md);">
            <div style="font-size: var(--font-size-2xl); font-weight: bold; color: var(--color-success);">
              ${suministros.length}
            </div>
            <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary);">Suministros Compatibles</div>
          </div>
        </div>
      </div>
      
      ${suministros.length > 0 ? `
        <div class="detail-section">
          <h4 class="detail-section-title">Suministros Compatibles</h4>
          <ul style="list-style: none; padding: 0;">
            ${suministros.map(s => `
              <li style="padding: var(--spacing-sm); background: var(--color-bg-tertiary); border-radius: var(--radius-sm); margin-bottom: var(--spacing-xs);">
                ${s.nombre} <code>${s.codigo}</code>
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `;

    const modal = createModal(`Detalles: ${marca.nombre} ${modelo.nombre}`, content, [
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
                this.showModeloForm(id);
            }
        }
    ]);

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
};

App.prototype.editModelo = function (id) {
    this.showModeloForm(id);
};

App.prototype.deleteModelo = function (id) {
    const modelo = db.getById('modelos', id);
    const equipos = db.getData('equipos').filter(e => e.modelo_id === id);

    if (equipos.length > 0) {
        showToast(`No se puede eliminar. El modelo tiene ${equipos.length} equipo(s) asociado(s)`, 'danger');
        return;
    }

    showConfirm(
        'Eliminar Modelo',
        `¿Estás seguro que deseas eliminar el modelo ${modelo.nombre}?`,
        () => {
            db.delete('modelos', id);
            showToast('Modelo eliminado exitosamente', 'success');
            this.renderModelosTable();
        }
    );
};
