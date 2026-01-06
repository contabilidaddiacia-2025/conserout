/**
 * CONSEROUT - Material Assignment Module
 * Track tools and non-consumable materials assigned to technicians
 */

App.prototype.loadMaterialesModule = function (container) {
    container.innerHTML = `
    <div class="module-container">
      <div class="module-header">
        <h2 class="module-title">Asignación de Materiales y Herramientas</h2>
        <div class="module-actions">
          <button class="btn btn-primary" onclick="app.showAsignacionMaterialForm()">
            <span>+</span>
            <span>Nueva Asignación</span>
          </button>
        </div>
      </div>

      <div class="filters-container">
        <div class="filters-grid">
          <div class="search-bar">
            <input type="text" class="form-input" placeholder="Buscar material o técnico..." id="searchMaterial">
          </div>
          <div class="form-group m-0">
            <label class="form-label">Técnico</label>
            <select class="form-select" id="filterTecnicoMaterial">
              <option value="">Todos los técnicos</option>
            </select>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Técnico</th>
                <th>Material / Herramienta</th>
                <th>Cant.</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="materialesTableBody">
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

    this.renderMaterialesTable();
    this.setupMaterialesFilters();
};

App.prototype.renderMaterialesTable = function () {
    const asignaciones = db.getData('asignaciones_materiales') || [];
    const usuarios = db.getData('usuarios');
    const tbody = document.getElementById('materialesTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Populate filter
    const filterTec = document.getElementById('filterTecnicoMaterial');
    if (filterTec && filterTec.options.length === 1) {
        usuarios.filter(u => u.perfil_id === 3).forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.id;
            opt.textContent = u.nombre;
            filterTec.appendChild(opt);
        });
    }

    asignaciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).forEach(asig => {
        const tecnico = usuarios.find(u => u.id === asig.tecnico_id);
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>${formatDate(asig.fecha)}</td>
      <td><strong>${tecnico ? tecnico.nombre : 'N/A'}</strong></td>
      <td>${asig.nombre_material}</td>
      <td>${asig.cantidad}</td>
      <td><span class="badge ${asig.estado === 'entregado' ? 'badge-primary' : 'badge-success'}">${asig.estado.toUpperCase()}</span></td>
      <td>
        <div class="table-actions">
          ${asig.estado === 'entregado' ? `<button class="btn btn-sm btn-ghost" onclick="app.devolverMaterial(${asig.id})" title="Devolver">🔄</button>` : ''}
          <button class="btn btn-sm btn-ghost" onclick="app.deleteAsignacionMaterial(${asig.id})" title="Eliminar">🗑️</button>
        </div>
      </td>
    `;
        tbody.appendChild(tr);
    });

    if (asignaciones.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No hay asignaciones de materiales</td></tr>`;
    }
};

App.prototype.showAsignacionMaterialForm = function () {
    const tecnicos = db.getData('usuarios').filter(u => u.perfil_id === 3);

    const formHTML = `
    <form id="asignacionMaterialForm">
      <div class="form-group">
        <label class="form-label required">Técnico</label>
        <select class="form-select" name="tecnico_id" required>
          <option value="">Seleccione un técnico</option>
          ${tecnicos.map(t => `<option value="${t.id}">${t.nombre}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label required">Material / Herramienta</label>
        <input type="text" class="form-input" name="nombre_material" placeholder="Ej: Multímetro, Kit de limpieza" required>
      </div>
      <div class="form-group">
        <label class="form-label required">Cantidad</label>
        <input type="number" class="form-input" name="cantidad" min="1" value="1" required>
      </div>
      <div class="form-group">
        <label class="form-label">Observaciones</label>
        <textarea class="form-textarea" name="observaciones"></textarea>
      </div>
    </form>
  `;

    const modal = createModal('Asignar Material a Técnico', formHTML, [
        { text: 'Cancelar', class: 'btn-secondary', onClick: () => closeModal(modal) },
        {
            text: 'Asignar',
            class: 'btn-primary',
            onClick: () => {
                const form = document.getElementById('asignacionMaterialForm');
                if (!form.checkValidity()) { form.reportValidity(); return; }

                const data = {
                    id: Date.now(),
                    tecnico_id: parseInt(form.tecnico_id.value),
                    nombre_material: form.nombre_material.value,
                    cantidad: parseInt(form.cantidad.value),
                    fecha: getCurrentDate(),
                    estado: 'entregado',
                    observaciones: form.observaciones.value
                };

                const current = db.getData('asignaciones_materiales') || [];
                current.push(data);
                db.setData('asignaciones_materiales', current);

                showToast('Material asignado correctamente', 'success');
                closeModal(modal);
                this.renderMaterialesTable();
            }
        }
    ]);
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
};

App.prototype.devolverMaterial = function (id) {
    showConfirm('Devolución de Material', '¿El técnico ha devuelto este material en buen estado?', () => {
        const data = db.getData('asignaciones_materiales');
        const index = data.findIndex(asig => asig.id === id);
        if (index !== -1) {
            data[index].estado = 'devuelto';
            data[index].fecha_devolucion = getCurrentDate();
            db.setData('asignaciones_materiales', data);
            showToast('Devolución registrada', 'success');
            this.renderMaterialesTable();
        }
    });
};
