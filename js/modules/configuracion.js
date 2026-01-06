/**
 * CONSEROUT - Generic Maintenance Module
 * Handles simple CRUD for configuration tables
 */

App.prototype.loadConfiguracionModule = function (container, type) {
    const configs = {
        'tipos-equipo': { title: 'Tipos de Equipo', table: 'tipos_equipo', icon: '🖨️' },
        'tipos-impresion': { title: 'Tipos de Impresión', table: 'tipos_impresion', icon: '🎨' },
        'tamanos-impresion': { title: 'Tamaños de Impresión', table: 'tamanos_impresion', icon: '📄' },
        'tipos-mantenimiento': { title: 'Tipos de Mantenimiento', table: 'tipos_mantenimiento', icon: '🛠️' },
        'tipos-suministro': { title: 'Tipos de Suministro', table: 'tipos_suministro', icon: '📦' },
        'departamentos': { title: 'Departamentos', table: 'departamentos', icon: '🏢' }
    };

    const config = configs[type];
    if (!config) return;

    container.innerHTML = `
    <div class="module-container">
      <div class="module-header">
        <h2 class="module-title">${config.title}</h2>
        <div class="module-actions">
          <button class="btn btn-primary" onclick="app.showConfigForm('${type}')">
            <span>+</span>
            <span>Nuevo Registro</span>
          </button>
        </div>
      </div>

      <div class="card">
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Nombre</th>
                ${config.table === 'departamentos' ? '<th>Descripción</th>' : ''}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="configTableBody">
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

    this.renderConfigTable(type);
};

App.prototype.renderConfigTable = function (type) {
    const configs = {
        'tipos-equipo': { table: 'tipos_equipo' },
        'tipos-impresion': { table: 'tipos_impresion' },
        'tamanos-impresion': { table: 'tamanos_impresion' },
        'tipos-mantenimiento': { table: 'tipos_mantenimiento' },
        'tipos-suministro': { table: 'tipos_suministro' },
        'departamentos': { table: 'departamentos' }
    };

    const table = configs[type].table;
    const data = db.getData(table);
    const tbody = document.getElementById('configTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    data.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td><strong>${item.nombre}</strong></td>
      ${table === 'departamentos' ? `<td>${item.descripcion || '-'}</td>` : ''}
      <td>
        <div class="table-actions">
          <button class="btn btn-sm btn-ghost" onclick="app.showConfigForm('${type}', ${item.id})" title="Editar">
            ✏️
          </button>
          <button class="btn btn-sm btn-ghost" onclick="app.deleteConfig('${type}', ${item.id})" title="Eliminar">
            🗑️
          </button>
        </div>
      </td>
    `;
        tbody.appendChild(tr);
    });

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="empty-state">No hay registros</td></tr>`;
    }
};

App.prototype.showConfigForm = function (type, id = null) {
    const configs = {
        'tipos-equipo': { title: 'Tipo de Equipo', table: 'tipos_equipo' },
        'tipos-impresion': { title: 'Tipo de Impresión', table: 'tipos_impresion' },
        'tamanos-impresion': { title: 'Tamaño de Impresión', table: 'tamanos_impresion' },
        'tipos-mantenimiento': { title: 'Tipo de Mantenimiento', table: 'tipos_mantenimiento' },
        'tipos-suministro': { title: 'Tipo de Suministro', table: 'tipos_suministro' },
        'departamentos': { title: 'Departamento', table: 'departamentos' }
    };

    const config = configs[type];
    const item = id ? db.getById(config.table, id) : null;

    const formHTML = `
    <form id="configForm">
      <div class="form-group">
        <label class="form-label required">Nombre</label>
        <input type="text" class="form-input" name="nombre" value="${item ? item.nombre : ''}" required>
      </div>
      ${config.table === 'departamentos' ? `
      <div class="form-group">
        <label class="form-label">Descripción</label>
        <textarea class="form-textarea" name="descripcion">${item ? item.descripcion || '' : ''}</textarea>
      </div>` : ''}
    </form>
  `;

    const modal = createModal(
        id ? `Editar ${config.title}` : `Nuevo ${config.title}`,
        formHTML,
        [
            { text: 'Cancelar', class: 'btn-secondary', onClick: () => closeModal(modal) },
            {
                text: id ? 'Actualizar' : 'Crear',
                class: 'btn-primary',
                onClick: () => {
                    const form = document.getElementById('configForm');
                    if (!form.checkValidity()) {
                        form.reportValidity();
                        return;
                    }
                    const formData = new FormData(form);
                    const data = { nombre: formData.get('nombre') };
                    if (config.table === 'departamentos') data.descripcion = formData.get('descripcion');

                    if (id) {
                        db.update(config.table, id, data);
                        showToast('Actualizado exitosamente', 'success');
                    } else {
                        db.insert(config.table, data);
                        showToast('Creado exitosamente', 'success');
                    }
                    closeModal(modal);
                    this.renderConfigTable(type);
                }
            }
        ]
    );

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
};

App.prototype.deleteConfig = function (type, id) {
    const configs = {
        'tipos-equipo': { title: 'Tipo de Equipo', table: 'tipos_equipo' },
        'tipos-impresion': { title: 'Tipo de Impresión', table: 'tipos_impresion' },
        'tamanos-impresion': { title: 'Tamaño de Impresión', table: 'tamanos_impresion' },
        'tipos-mantenimiento': { title: 'Tipo de Mantenimiento', table: 'tipos_mantenimiento' },
        'tipos-suministro': { title: 'Tipo de Suministro', table: 'tipos_suministro' },
        'departamentos': { title: 'Departamento', table: 'departamentos' }
    };
    const config = configs[type];

    showConfirm(
        'Eliminar Registro',
        `¿Estás seguro que deseas eliminar este registro?`,
        () => {
            db.delete(config.table, id);
            showToast('Eliminado exitosamente', 'success');
            this.renderConfigTable(type);
        }
    );
};
