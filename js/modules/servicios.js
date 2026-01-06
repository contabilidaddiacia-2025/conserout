/**
 * CONSEROUT - Services Module
 * Installations, maintenance, and consumable changes
 */

// Extend App class with installations module
App.prototype.loadInstalacionesModule = function (container) {
    container.innerHTML = `
    <div class="module-container">
      <div class="module-header">
        <h2 class="module-title">Instalaciones de Equipos</h2>
        <div class="module-actions">
          <button class="btn btn-primary" onclick="app.showInstalacionForm()">
            <span>+</span>
            <span>Nueva Instalación</span>
          </button>
        </div>
      </div>

      <div class="filters-container">
        <div class="filters-grid">
          <div class="form-group m-0">
            <label class="form-label">Desde</label>
            <input type="date" class="form-input" id="filterFechaDesdeInst">
          </div>
          <div class="form-group m-0">
            <label class="form-label">Hasta</label>
            <input type="date" class="form-input" id="filterFechaHastaInst" value="${getCurrentDate()}">
          </div>
          <div class="form-group m-0">
            <label class="form-label">Técnico</label>
            <select class="form-select" id="filterTecnicoInst">
              <option value="">Todos los técnicos</option>
            </select>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="table-container">
          <table class="table" id="instalacionesTable">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Equipo</th>
                <th>N° Serie</th>
                <th>Ubicación</th>
                <th>Contador Inicial</th>
                <th>Técnico</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="instalacionesTableBody">
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

    this.renderInstalacionesTable();
};

App.prototype.renderInstalacionesTable = function () {
    const instalaciones = db.getData('instalaciones');
    const servicios = db.getData('servicios');
    const equipos = db.getData('equipos');
    const modelos = db.getData('modelos');
    const usuarios = db.getData('usuarios');
    const tbody = document.getElementById('instalacionesTableBody');

    if (!tbody) return;

    tbody.innerHTML = '';

    // Populate tecnico filter
    const filterTecnico = document.getElementById('filterTecnicoInst');
    if (filterTecnico && filterTecnico.options.length === 1) {
        usuarios.filter(u => u.perfil_id === 3).forEach(tecnico => {
            const option = document.createElement('option');
            option.value = tecnico.id;
            option.textContent = tecnico.nombre;
            filterTecnico.appendChild(option);
        });
    }

    instalaciones.forEach(instalacion => {
        const servicio = servicios.find(s => s.id === instalacion.servicio_id);
        const equipo = equipos.find(e => e.id === instalacion.equipo_id);
        const modelo = equipo ? modelos.find(m => m.id === equipo.modelo_id) : null;
        const tecnico = servicio ? usuarios.find(u => u.id === servicio.tecnico_id) : null;

        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>${servicio ? formatDate(servicio.fecha) : '-'}</td>
      <td>${modelo ? modelo.nombre : 'N/A'}</td>
      <td><code>${equipo ? equipo.numero_serie : '-'}</code></td>
      <td>${instalacion.ubicacion || '-'}</td>
      <td><strong>${formatNumber(instalacion.contador_inicial)}</strong></td>
      <td>${tecnico ? tecnico.nombre : '-'}</td>
      <td>${servicio ? getStatusBadge(servicio.estado) : '-'}</td>
      <td>
        <button class="btn btn-sm btn-ghost" onclick="app.viewInstalacion(${instalacion.id})" title="Ver">
          👁️
        </button>
      </td>
    `;
        tbody.appendChild(tr);
    });

    if (instalaciones.length === 0) {
        tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          <div class="empty-state-icon">🔧</div>
          <div class="empty-state-title">No hay instalaciones registradas</div>
        </td>
      </tr>
    `;
    }
};

App.prototype.showInstalacionForm = function () {
    const equipos = db.getData('equipos').filter(e => e.estado === 'sin_instalar');
    const tecnicos = db.getData('usuarios').filter(u => u.perfil_id === 3);
    const modelos = db.getData('modelos');

    const formHTML = `
    <form id="instalacionForm">
      <div class="form-group">
        <label class="form-label required">Equipo</label>
        <select class="form-select" name="equipo_id" required>
          <option value="">Seleccione un equipo</option>
          ${equipos.map(e => {
        const modelo = modelos.find(m => m.id === e.modelo_id);
        return `<option value="${e.id}">${modelo ? modelo.nombre : 'N/A'} - ${e.numero_serie}</option>`;
    }).join('')}
        </select>
      </div>
      
      <div class="form-group">
        <label class="form-label required">Ubicación</label>
        <input type="text" class="form-input" name="ubicacion" placeholder="Ej: Piso 3 - Administración" required>
      </div>
      
      <div class="form-group">
        <label class="form-label required">Contador Inicial</label>
        <input type="number" class="form-input" name="contador_inicial" min="0" value="0" required>
        <span class="form-help">0 para equipos nuevos, valor actual para equipos usados</span>
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
        <textarea class="form-textarea" name="descripcion" placeholder="Detalles de la instalación..."></textarea>
      </div>
    </form>
  `;

    const modal = createModal(
        'Nueva Instalación',
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
                    const form = document.getElementById('instalacionForm');
                    if (!form.checkValidity()) {
                        form.reportValidity();
                        return;
                    }

                    const formData = new FormData(form);
                    const equipoId = parseInt(formData.get('equipo_id'));
                    const contadorInicial = parseInt(formData.get('contador_inicial'));

                    // Create service
                    const servicioId = db.insert('servicios', {
                        equipo_id: equipoId,
                        tecnico_id: parseInt(formData.get('tecnico_id')),
                        tipo_servicio: 'instalacion',
                        fecha: formData.get('fecha'),
                        descripcion: formData.get('descripcion'),
                        estado: 'completado'
                    }).id;

                    // Create installation
                    db.insert('instalaciones', {
                        servicio_id: servicioId,
                        equipo_id: equipoId,
                        ubicacion: formData.get('ubicacion'),
                        contador_inicial: contadorInicial
                    });

                    // Update equipment
                    db.update('equipos', equipoId, {
                        estado: 'instalado',
                        ubicacion: formData.get('ubicacion'),
                        fecha_instalacion: formData.get('fecha')
                    });

                    // Create initial counter
                    db.insert('contadores_equipos', {
                        equipo_id: equipoId,
                        fecha_lectura: formData.get('fecha'),
                        contador_actual: contadorInicial,
                        contador_anterior: 0,
                        consumo: 0,
                        usuario_registro_id: auth.getCurrentUser().id
                    });

                    showToast('Instalación registrada exitosamente', 'success');
                    closeModal(modal);
                    this.renderInstalacionesTable();
                }
            }
        ]
    );

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
};

App.prototype.viewInstalacion = function (id) {
    const instalacion = db.getById('instalaciones', id);
    const servicio = db.getById('servicios', instalacion.servicio_id);
    const equipo = db.getById('equipos', instalacion.equipo_id);
    const modelo = db.getById('modelos', equipo.modelo_id);
    const tecnico = db.getById('usuarios', servicio.tecnico_id);

    const content = `
    <div style="display: grid; gap: var(--spacing-lg);">
      <div class="detail-section">
        <h4 class="detail-section-title">Detalles de la Instalación</h4>
        <div class="detail-row">
          <div class="detail-label">Fecha:</div>
          <div class="detail-value">${formatDate(servicio.fecha)}</div>
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
          <div class="detail-value">${instalacion.ubicacion}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Contador Inicial:</div>
          <div class="detail-value"><strong>${formatNumber(instalacion.contador_inicial)}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Técnico:</div>
          <div class="detail-value">${tecnico.nombre}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Estado:</div>
          <div class="detail-value">${getStatusBadge(servicio.estado)}</div>
        </div>
      </div>
      
      ${servicio.descripcion ? `
        <div class="detail-section">
          <h4 class="detail-section-title">Observaciones</h4>
          <p>${servicio.descripcion}</p>
        </div>
      ` : ''}
    </div>
  `;

    const modal = createModal('Detalles de Instalación', content, [
        {
            text: 'Cerrar',
            class: 'btn-secondary',
            onClick: () => closeModal(modal)
        }
    ]);

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
};

// Extend App class with maintenance module
App.prototype.loadMantenimientosModule = function (container) {
    container.innerHTML = `
    <div class="module-container">
      <div class="module-header">
        <h2 class="module-title">Mantenimientos</h2>
        <div class="module-actions">
          <button class="btn btn-primary" onclick="app.showMantenimientoForm()">
            <span>+</span>
            <span>Nuevo Mantenimiento</span>
          </button>
        </div>
      </div>

      <div class="filters-container">
        <div class="filters-grid">
          <div class="form-group m-0">
            <label class="form-label">Tipo</label>
            <select class="form-select" id="filterTipoMant">
              <option value="">Todos</option>
              <option value="1">Preventivo</option>
              <option value="2">Correctivo</option>
            </select>
          </div>
          <div class="form-group m-0">
            <label class="form-label">Desde</label>
            <input type="date" class="form-input" id="filterFechaDesdeMant">
          </div>
          <div class="form-group m-0">
            <label class="form-label">Hasta</label>
            <input type="date" class="form-input" id="filterFechaHastaMant" value="${getCurrentDate()}">
          </div>
        </div>
      </div>

      <div class="card">
        <div class="table-container">
          <table class="table" id="mantenimientosTable">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Equipo</th>
                <th>N° Serie</th>
                <th>Técnico</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="mantenimientosTableBody">
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

    this.renderMantenimientosTable();
};

App.prototype.renderMantenimientosTable = function () {
    const mantenimientos = db.getData('mantenimientos');
    const servicios = db.getData('servicios');
    const equipos = db.getData('equipos');
    const modelos = db.getData('modelos');
    const usuarios = db.getData('usuarios');
    const tiposMant = db.getData('tipos_mantenimiento');
    const tbody = document.getElementById('mantenimientosTableBody');

    if (!tbody) return;

    tbody.innerHTML = '';

    mantenimientos.forEach(mant => {
        const servicio = servicios.find(s => s.id === mant.servicio_id);
        const equipo = servicio ? equipos.find(e => e.id === servicio.equipo_id) : null;
        const modelo = equipo ? modelos.find(m => m.id === equipo.modelo_id) : null;
        const tecnico = servicio ? usuarios.find(u => u.id === servicio.tecnico_id) : null;
        const tipo = tiposMant.find(t => t.id === mant.tipo_mantenimiento_id);

        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>${servicio ? formatDate(servicio.fecha) : '-'}</td>
      <td>
        <span class="badge ${tipo && tipo.id === 1 ? 'badge-info' : 'badge-warning'}">
          ${tipo ? tipo.nombre : 'N/A'}
        </span>
      </td>
      <td>${modelo ? modelo.nombre : 'N/A'}</td>
      <td><code>${equipo ? equipo.numero_serie : '-'}</code></td>
      <td>${tecnico ? tecnico.nombre : '-'}</td>
      <td>${mant.descripcion ? mant.descripcion.substring(0, 50) + '...' : '-'}</td>
      <td>${servicio ? getStatusBadge(servicio.estado) : '-'}</td>
      <td>
        <button class="btn btn-sm btn-ghost" onclick="app.viewMantenimiento(${mant.id})" title="Ver">
          👁️
        </button>
      </td>
    `;
        tbody.appendChild(tr);
    });

    if (mantenimientos.length === 0) {
        tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          <div class="empty-state-icon">🛠️</div>
          <div class="empty-state-title">No hay mantenimientos registrados</div>
        </td>
      </tr>
    `;
    }
};

App.prototype.showMantenimientoForm = function () {
    const equipos = db.getData('equipos').filter(e => e.estado === 'instalado');
    const tecnicos = db.getData('usuarios').filter(u => u.perfil_id === 3);
    const tiposMant = db.getData('tipos_mantenimiento');
    const modelos = db.getData('modelos');

    const formHTML = `
    <form id="mantenimientoForm">
      <div class="form-group">
        <label class="form-label required">Tipo de Mantenimiento</label>
        <select class="form-select" name="tipo_mantenimiento_id" required>
          ${tiposMant.map(t => `<option value="${t.id}">${t.nombre}</option>`).join('')}
        </select>
      </div>
      
      <div class="form-group">
        <label class="form-label required">Equipo</label>
        <select class="form-select" name="equipo_id" required>
          <option value="">Seleccione un equipo</option>
          ${equipos.map(e => {
        const modelo = modelos.find(m => m.id === e.modelo_id);
        return `<option value="${e.id}">${modelo ? modelo.nombre : 'N/A'} - ${e.numero_serie} (${e.ubicacion})</option>`;
    }).join('')}
        </select>
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
        <label class="form-label required">Descripción</label>
        <textarea class="form-textarea" name="descripcion" placeholder="Detalle del mantenimiento realizado..." required></textarea>
      </div>
      
      <div class="form-group">
        <label class="form-label">Materiales Usados</label>
        <textarea class="form-textarea" name="materiales_usados" placeholder="Lista de materiales utilizados..."></textarea>
      </div>
    </form>
  `;

    const modal = createModal(
        'Nuevo Mantenimiento',
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
                    const form = document.getElementById('mantenimientoForm');
                    if (!form.checkValidity()) {
                        form.reportValidity();
                        return;
                    }

                    const formData = new FormData(form);

                    // Create service
                    const servicioId = db.insert('servicios', {
                        equipo_id: parseInt(formData.get('equipo_id')),
                        tecnico_id: parseInt(formData.get('tecnico_id')),
                        tipo_servicio: 'mantenimiento',
                        fecha: formData.get('fecha'),
                        descripcion: formData.get('descripcion'),
                        estado: 'completado'
                    }).id;

                    // Create maintenance
                    db.insert('mantenimientos', {
                        servicio_id: servicioId,
                        tipo_mantenimiento_id: parseInt(formData.get('tipo_mantenimiento_id')),
                        descripcion: formData.get('descripcion'),
                        materiales_usados: formData.get('materiales_usados')
                    });

                    showToast('Mantenimiento registrado exitosamente', 'success');
                    closeModal(modal);
                    this.renderMantenimientosTable();
                }
            }
        ]
    );

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
};

App.prototype.viewMantenimiento = function (id) {
    const mant = db.getById('mantenimientos', id);
    const servicio = db.getById('servicios', mant.servicio_id);
    const equipo = db.getById('equipos', servicio.equipo_id);
    const modelo = db.getById('modelos', equipo.modelo_id);
    const tecnico = db.getById('usuarios', servicio.tecnico_id);
    const tipo = db.getById('tipos_mantenimiento', mant.tipo_mantenimiento_id);

    const content = `
    <div style="display: grid; gap: var(--spacing-lg);">
      <div class="detail-section">
        <h4 class="detail-section-title">Detalles del Mantenimiento</h4>
        <div class="detail-row">
          <div class="detail-label">Tipo:</div>
          <div class="detail-value">
            <span class="badge ${tipo.id === 1 ? 'badge-info' : 'badge-warning'}">
              ${tipo.nombre}
            </span>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Fecha:</div>
          <div class="detail-value">${formatDate(servicio.fecha)}</div>
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
          <div class="detail-label">Técnico:</div>
          <div class="detail-value">${tecnico.nombre}</div>
        </div>
      </div>
      
      <div class="detail-section">
        <h4 class="detail-section-title">Descripción</h4>
        <p>${mant.descripcion}</p>
      </div>
      
      ${mant.materiales_usados ? `
        <div class="detail-section">
          <h4 class="detail-section-title">Materiales Utilizados</h4>
          <p>${mant.materiales_usados}</p>
        </div>
      ` : ''}
    </div>
  `;

    const modal = createModal('Detalles de Mantenimiento', content, [
        {
            text: 'Cerrar',
            class: 'btn-secondary',
            onClick: () => closeModal(modal)
        }
    ]);

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
};
