/**
 * CONSEROUT - Users Management Module
 * CRUD for system users with profile and department assignment
 */

App.prototype.loadUsuariosModule = function (container) {
    container.innerHTML = `
    <div class="module-container">
      <div class="module-header">
        <h2 class="module-title">Gestión de Usuarios</h2>
        <div class="module-actions">
          <button class="btn btn-primary" onclick="app.showUsuarioForm()">
            <span>+</span>
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      <div class="filters-container">
        <div class="filters-grid">
          <div class="search-bar">
            <input type="text" class="form-input" placeholder="Buscar usuario..." id="searchUsuario">
          </div>
          <div class="form-group m-0">
            <label class="form-label">Perfil</label>
            <select class="form-select" id="filterPerfil">
              <option value="">Todos los perfiles</option>
            </select>
          </div>
          <div class="form-group m-0">
            <label class="form-label">Estado</label>
            <select class="form-select" id="filterEstadoUsuario">
              <option value="">Todos</option>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="table-container">
          <table class="table" id="usuariosTable">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Perfil</th>
                <th>Departamento</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="usuariosTableBody">
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

    this.renderUsuariosTable();
    this.setupUsuariosFilters();
};

App.prototype.renderUsuariosTable = function () {
    const usuarios = db.getData('usuarios');
    const perfiles = db.getData('perfiles');
    const departamentos = db.getData('departamentos');
    const tbody = document.getElementById('usuariosTableBody');

    if (!tbody) return;

    tbody.innerHTML = '';

    // Populate filters
    const filterPerfil = document.getElementById('filterPerfil');
    if (filterPerfil && filterPerfil.options.length === 1) {
        perfiles.forEach(perfil => {
            const option = document.createElement('option');
            option.value = perfil.id;
            option.textContent = perfil.nombre;
            filterPerfil.appendChild(option);
        });
    }

    usuarios.forEach(usuario => {
        const perfil = perfiles.find(p => p.id === usuario.perfil_id);
        const departamento = departamentos.find(d => d.id === usuario.departamento_id);

        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td><code>${usuario.username}</code></td>
      <td><strong>${usuario.nombre}</strong></td>
      <td>${usuario.email}</td>
      <td>${perfil ? perfil.nombre : 'N/A'}</td>
      <td>${departamento ? departamento.nombre : 'N/A'}</td>
      <td>${usuario.activo ? '<span class="badge badge-success">Activo</span>' : '<span class="badge badge-secondary">Inactivo</span>'}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-sm btn-ghost" onclick="app.viewUsuario(${usuario.id})" title="Ver">
            👁️
          </button>
          <button class="btn btn-sm btn-ghost" onclick="app.editUsuario(${usuario.id})" title="Editar">
            ✏️
          </button>
          <button class="btn btn-sm btn-ghost" onclick="app.toggleUsuarioEstado(${usuario.id})" title="${usuario.activo ? 'Desactivar' : 'Activar'}">
            ${usuario.activo ? '🔒' : '🔓'}
          </button>
        </div>
      </td>
    `;
        tbody.appendChild(tr);
    });

    if (usuarios.length === 0) {
        tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <div class="empty-state-icon">👥</div>
          <div class="empty-state-title">No hay usuarios registrados</div>
        </td>
      </tr>
    `;
    }
};

App.prototype.setupUsuariosFilters = function () {
    const searchInput = document.getElementById('searchUsuario');
    const filterPerfil = document.getElementById('filterPerfil');
    const filterEstado = document.getElementById('filterEstadoUsuario');

    const applyFilters = () => {
        const search = searchInput?.value.toLowerCase() || '';
        const perfilId = filterPerfil?.value || '';
        const estado = filterEstado?.value || '';

        const rows = document.querySelectorAll('#usuariosTableBody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const matchesSearch = text.includes(search);

            row.style.display = matchesSearch ? '' : 'none';
        });
    };

    searchInput?.addEventListener('input', debounce(applyFilters, 300));
    filterPerfil?.addEventListener('change', applyFilters);
    filterEstado?.addEventListener('change', applyFilters);
};

App.prototype.showUsuarioForm = function (usuarioId = null) {
    const usuario = usuarioId ? db.getById('usuarios', usuarioId) : null;
    const perfiles = db.getData('perfiles');
    const departamentos = db.getData('departamentos');

    const formHTML = `
    <form id="usuarioForm">
      <div class="form-group">
        <label class="form-label required">Nombre Completo</label>
        <input type="text" class="form-input" name="nombre" 
               value="${usuario ? usuario.nombre : ''}" required>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md);">
        <div class="form-group">
          <label class="form-label required">Usuario</label>
          <input type="text" class="form-input" name="username" 
                 value="${usuario ? usuario.username : ''}" 
                 ${usuario ? 'readonly' : ''} required>
          ${usuario ? '<span class="form-help">El usuario no se puede modificar</span>' : ''}
        </div>
        
        <div class="form-group">
          <label class="form-label ${usuario ? '' : 'required'}">Contraseña</label>
          <input type="password" class="form-input" name="password" 
                 placeholder="${usuario ? 'Dejar en blanco para no cambiar' : ''}"
                 ${usuario ? '' : 'required'}>
        </div>
      </div>
      
      <div class="form-group">
        <label class="form-label required">Email</label>
        <input type="email" class="form-input" name="email" 
               value="${usuario ? usuario.email : ''}" required>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md);">
        <div class="form-group">
          <label class="form-label required">Perfil</label>
          <select class="form-select" name="perfil_id" required>
            <option value="">Seleccione un perfil</option>
            ${perfiles.map(p => `
              <option value="${p.id}" ${usuario && usuario.perfil_id === p.id ? 'selected' : ''}>
                ${p.nombre}
              </option>
            `).join('')}
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label required">Departamento</label>
          <select class="form-select" name="departamento_id" required>
            <option value="">Seleccione un departamento</option>
            ${departamentos.map(d => `
              <option value="${d.id}" ${usuario && usuario.departamento_id === d.id ? 'selected' : ''}>
                ${d.nombre}
              </option>
            `).join('')}
          </select>
        </div>
      </div>
      
      <div class="form-group">
        <label class="form-label">
          <input type="checkbox" name="activo" ${usuario && usuario.activo ? 'checked' : ''} ${!usuario ? 'checked' : ''}>
          Usuario activo
        </label>
      </div>
    </form>
  `;

    const modal = createModal(
        usuarioId ? 'Editar Usuario' : 'Nuevo Usuario',
        formHTML,
        [
            {
                text: 'Cancelar',
                class: 'btn-secondary',
                onClick: () => closeModal(modal)
            },
            {
                text: usuarioId ? 'Actualizar' : 'Crear',
                class: 'btn-primary',
                onClick: () => {
                    const form = document.getElementById('usuarioForm');
                    if (!form.checkValidity()) {
                        form.reportValidity();
                        return;
                    }

                    const formData = new FormData(form);

                    // Validate unique username
                    if (!usuarioId) {
                        const usuarios = db.getData('usuarios');
                        const usernameExiste = usuarios.some(u =>
                            u.username.toLowerCase() === formData.get('username').toLowerCase()
                        );

                        if (usernameExiste) {
                            showToast('El nombre de usuario ya existe', 'danger');
                            return;
                        }
                    }

                    const data = {
                        nombre: formData.get('nombre'),
                        email: formData.get('email'),
                        perfil_id: parseInt(formData.get('perfil_id')),
                        departamento_id: parseInt(formData.get('departamento_id')),
                        activo: formData.get('activo') === 'on'
                    };

                    if (!usuarioId) {
                        data.username = formData.get('username');
                        data.password = formData.get('password');
                    } else if (formData.get('password')) {
                        data.password = formData.get('password');
                    }

                    if (usuarioId) {
                        db.update('usuarios', usuarioId, data);
                        showToast('Usuario actualizado exitosamente', 'success');
                    } else {
                        db.insert('usuarios', data);
                        showToast('Usuario creado exitosamente', 'success');
                    }

                    closeModal(modal);
                    this.renderUsuariosTable();
                }
            }
        ]
    );

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
};

App.prototype.viewUsuario = function (id) {
    const usuario = db.getById('usuarios', id);
    const perfil = db.getById('perfiles', usuario.perfil_id);
    const departamento = db.getById('departamentos', usuario.departamento_id);

    const content = `
    <div style="display: grid; gap: var(--spacing-lg);">
      <div class="detail-section">
        <h4 class="detail-section-title">Información del Usuario</h4>
        <div class="detail-row">
          <div class="detail-label">Nombre:</div>
          <div class="detail-value">${usuario.nombre}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Usuario:</div>
          <div class="detail-value"><code>${usuario.username}</code></div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Email:</div>
          <div class="detail-value">${usuario.email}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Perfil:</div>
          <div class="detail-value">${perfil ? perfil.nombre : 'N/A'}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Departamento:</div>
          <div class="detail-value">${departamento ? departamento.nombre : 'N/A'}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Estado:</div>
          <div class="detail-value">${usuario.activo ? '<span class="badge badge-success">Activo</span>' : '<span class="badge badge-secondary">Inactivo</span>'}</div>
        </div>
      </div>
      
      ${perfil ? `
        <div class="detail-section">
          <h4 class="detail-section-title">Permisos del Perfil</h4>
          <div style="display: flex; flex-wrap: wrap; gap: var(--spacing-xs);">
            ${perfil.permisos.map(p => `
              <span class="badge badge-info">${p}</span>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;

    const modal = createModal(`Usuario: ${usuario.nombre}`, content, [
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
                this.showUsuarioForm(id);
            }
        }
    ]);

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
};

App.prototype.editUsuario = function (id) {
    this.showUsuarioForm(id);
};

App.prototype.toggleUsuarioEstado = function (id) {
    const usuario = db.getById('usuarios', id);
    const nuevoEstado = !usuario.activo;

    showConfirm(
        nuevoEstado ? 'Activar Usuario' : 'Desactivar Usuario',
        `¿Estás seguro que deseas ${nuevoEstado ? 'activar' : 'desactivar'} al usuario ${usuario.nombre}?`,
        () => {
            db.update('usuarios', id, { activo: nuevoEstado });
            showToast(`Usuario ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente`, 'success');
            this.renderUsuariosTable();
        }
    );
};
