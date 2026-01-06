/**
 * CONSEROUT - Brands Management Module
 * CRUD for equipment brands
 */

App.prototype.loadMarcasModule = function (container) {
    container.innerHTML = `
    <div class="module-container">
      <div class="module-header">
        <h2 class="module-title">Gestión de Marcas</h2>
        <div class="module-actions">
          <button class="btn btn-primary" onclick="app.showMarcaForm()">
            <span>+</span>
            <span>Nueva Marca</span>
          </button>
        </div>
      </div>

      <div class="filters-container">
        <div class="filters-grid">
          <div class="search-bar">
            <input type="text" class="form-input" placeholder="Buscar marca..." id="searchMarca">
          </div>
        </div>
      </div>

      <div class="card">
        <div class="table-container">
          <table class="table" id="marcasTable">
            <thead>
              <tr>
                <th>Marca</th>
                <th>Modelos</th>
                <th>Equipos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="marcasTableBody">
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

    this.renderMarcasTable();
    this.setupMarcasFilters();
};

App.prototype.renderMarcasTable = function () {
    const marcas = db.getData('marcas');
    const modelos = db.getData('modelos');
    const equipos = db.getData('equipos');
    const tbody = document.getElementById('marcasTableBody');

    if (!tbody) return;

    tbody.innerHTML = '';

    marcas.forEach(marca => {
        const modelosMarca = modelos.filter(m => m.marca_id === marca.id);
        const equiposMarca = equipos.filter(e => {
            const modelo = modelos.find(m => m.id === e.modelo_id);
            return modelo && modelo.marca_id === marca.id;
        });

        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td><strong>${marca.nombre}</strong></td>
      <td>${modelosMarca.length}</td>
      <td>${equiposMarca.length}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-sm btn-ghost" onclick="app.editMarca(${marca.id})" title="Editar">
            ✏️
          </button>
          <button class="btn btn-sm btn-ghost" onclick="app.deleteMarca(${marca.id})" title="Eliminar">
            🗑️
          </button>
        </div>
      </td>
    `;
        tbody.appendChild(tr);
    });

    if (marcas.length === 0) {
        tbody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">
          <div class="empty-state-icon">🏷️</div>
          <div class="empty-state-title">No hay marcas registradas</div>
        </td>
      </tr>
    `;
    }
};

App.prototype.setupMarcasFilters = function () {
    const searchInput = document.getElementById('searchMarca');

    const applyFilters = () => {
        const search = searchInput?.value.toLowerCase() || '';
        const rows = document.querySelectorAll('#marcasTableBody tr');

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(search) ? '' : 'none';
        });
    };

    searchInput?.addEventListener('input', debounce(applyFilters, 300));
};

App.prototype.showMarcaForm = function (marcaId = null) {
    const marca = marcaId ? db.getById('marcas', marcaId) : null;

    const formHTML = `
    <form id="marcaForm">
      <div class="form-group">
        <label class="form-label required">Nombre de la Marca</label>
        <input type="text" class="form-input" name="nombre" 
               value="${marca ? marca.nombre : ''}" 
               placeholder="Ej: HP, Canon, Epson" required>
      </div>
    </form>
  `;

    const modal = createModal(
        marcaId ? 'Editar Marca' : 'Nueva Marca',
        formHTML,
        [
            {
                text: 'Cancelar',
                class: 'btn-secondary',
                onClick: () => closeModal(modal)
            },
            {
                text: marcaId ? 'Actualizar' : 'Crear',
                class: 'btn-primary',
                onClick: () => {
                    const form = document.getElementById('marcaForm');
                    if (!form.checkValidity()) {
                        form.reportValidity();
                        return;
                    }

                    const formData = new FormData(form);
                    const nombre = formData.get('nombre').trim();

                    // Validate unique name
                    const marcas = db.getData('marcas');
                    const nombreExiste = marcas.some(m =>
                        m.nombre.toLowerCase() === nombre.toLowerCase() && m.id !== marcaId
                    );

                    if (nombreExiste) {
                        showToast(`La marca "${nombre}" ya existe`, 'danger');
                        return;
                    }

                    const data = { nombre };

                    if (marcaId) {
                        db.update('marcas', marcaId, data);
                        showToast('Marca actualizada exitosamente', 'success');
                    } else {
                        db.insert('marcas', data);
                        showToast('Marca creada exitosamente', 'success');
                    }

                    closeModal(modal);
                    this.renderMarcasTable();
                }
            }
        ]
    );

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
};

App.prototype.editMarca = function (id) {
    this.showMarcaForm(id);
};

App.prototype.deleteMarca = function (id) {
    const marca = db.getById('marcas', id);
    const modelos = db.getData('modelos').filter(m => m.marca_id === id);

    if (modelos.length > 0) {
        showToast(`No se puede eliminar. La marca tiene ${modelos.length} modelo(s) asociado(s)`, 'danger');
        return;
    }

    showConfirm(
        'Eliminar Marca',
        `¿Estás seguro que deseas eliminar la marca ${marca.nombre}?`,
        () => {
            db.delete('marcas', id);
            showToast('Marca eliminada exitosamente', 'success');
            this.renderMarcasTable();
        }
    );
};
