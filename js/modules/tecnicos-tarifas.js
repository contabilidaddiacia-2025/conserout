/**
 * CONSEROUT - Technicians & Rates Management
 * Assign technicians and define unit rates for contracts
 */

App.prototype.loadTecnicosTarifasModule = function (container) {
  container.innerHTML = `
    <div class="module-container">
      <div class="module-header">
        <h2 class="module-title">Técnicos y Tarifas por Contrato</h2>
      </div>

      <div class="filters-container">
        <div class="filters-grid">
          <div class="search-bar">
            <input type="text" class="form-input" placeholder="Buscar contrato..." id="searchContratoTec">
          </div>
        </div>
      </div>

      <div class="data-grid" id="tecnicosTarifasGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: var(--spacing-lg);">
      </div>
    </div>
  `;

  this.renderTecnicosTarifasGrid();
};

App.prototype.renderTecnicosTarifasGrid = function () {
  const contratos = db.getData('contratos').filter(c => c.estado === 'vigente');
  const clientes = db.getData('clientes');
  const tecnicosContrato = db.getData('tecnicos_contrato');
  const tarifasContrato = db.getData('tarifas_contrato');
  const usuarios = db.getData('usuarios');
  const grid = document.getElementById('tecnicosTarifasGrid');

  if (!grid) return;
  grid.innerHTML = '';

  contratos.forEach(contrato => {
    const cliente = clientes.find(c => c.id === contrato.cliente_id);
    const tecnicosAsignados = tecnicosContrato.filter(tc => tc.contrato_id === contrato.id)
      .map(tc => usuarios.find(u => u.id === tc.tecnico_id))
      .filter(u => u);

    const tarifas = tarifasContrato.filter(t => t.contrato_id === contrato.id);

    const card = document.createElement('div');
    card.className = 'card hover-lift';
    card.innerHTML = `
      <div class="card-header">
        <h3 class="card-title">${contrato.numero_contrato}</h3>
        <p class="card-subtitle">${cliente ? cliente.nombre : 'Cliente Desconocido'}</p>
      </div>
      <div class="card-body">
        <div class="detail-section mb-md">
          <h4 class="detail-section-title">Técnicos Asignados</h4>
          <div style="display: flex; flex-wrap: wrap; gap: var(--spacing-xs);">
            ${tecnicosAsignados.length > 0
        ? tecnicosAsignados.map(t => `<span class="badge badge-info">${t.nombre}</span>`).join('')
        : '<span class="text-tertiary">Sin técnicos asignados</span>'}
          </div>
        </div>
        <div class="detail-section">
          <h4 class="detail-section-title">Tarifas Vigentes</h4>
          <table class="table table-sm">
            <thead>
              <tr><th>Servicio</th><th>Valor</th></tr>
            </thead>
            <tbody>
              ${tarifas.map(t => `<tr><td>${t.tipo_servicio}</td><td>${formatCurrency(t.valor_unitario)}</td></tr>`).join('')}
              ${tarifas.length === 0 ? '<tr><td colspan="2" class="text-center">Sin tarifas</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>
      <div class="card-footer">
        <button class="btn btn-sm btn-secondary" onclick="app.showAssignTecnicoForm(${contrato.id})">
          <span>👥</span><span>Técnicos</span>
        </button>
        <button class="btn btn-sm btn-primary" onclick="app.showRateForm(${contrato.id})">
          <span>💰</span><span>Tarifas</span>
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
};

App.prototype.showAssignTecnicoForm = function (contratoId) {
  const contrato = db.getById('contratos', contratoId);
  const tecnicos = db.getData('usuarios').filter(u => u.perfil_id === 3); // 3 = Tecnico
  const asignadosIds = db.getData('tecnicos_contrato')
    .filter(tc => tc.contrato_id === contratoId)
    .map(tc => tc.tecnico_id);

  const formHTML = `
    <form id="assignTecnicoForm">
      <p class="mb-md">Seleccione los técnicos encargados de este contrato:</p>
      <div class="form-group">
        <div style="max-height: 200px; overflow-y: auto; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--spacing-sm);">
          ${tecnicos.map(t => `
            <label style="display: block; padding: var(--spacing-xs); cursor: pointer;">
              <input type="checkbox" name="tecnicos" value="${t.id}" ${asignadosIds.includes(t.id) ? 'checked' : ''}>
              ${t.nombre}
            </label>
          `).join('')}
        </div>
      </div>
    </form>
  `;

  const modal = createModal(
    `Asignar Técnicos - ${contrato.numero_contrato}`,
    formHTML,
    [
      { text: 'Cancelar', class: 'btn-secondary', onClick: () => closeModal(modal) },
      {
        text: 'Guardar Asignaciones',
        class: 'btn-primary',
        onClick: () => {
          const form = document.getElementById('assignTecnicoForm');
          const selected = Array.from(form.querySelectorAll('input[name="tecnicos"]:checked')).map(cb => parseInt(cb.value));

          // Delete existing and insert new
          const current = db.getData('tecnicos_contrato');
          const filtered = current.filter(tc => tc.contrato_id !== contratoId);
          selected.forEach(tecnicoId => {
            filtered.push({ id: filtered.length + 1, contrato_id: contratoId, tecnico_id: tecnicoId });
          });

          db.setData('tecnicos_contrato', filtered);
          showToast('Técnicos asignados correctamente', 'success');
          closeModal(modal);
          this.renderTecnicosTarifasGrid();
        }
      }
    ]
  );
  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('active'), 10);
};

App.prototype.showRateForm = function (contratoId) {
  const contrato = db.getById('contratos', contratoId);
  const tarifas = db.getData('tarifas_contrato').filter(t => t.contrato_id === contratoId);

  const formHTML = `
    <div class="mb-md">
      <button class="btn btn-sm btn-ghost" onclick="app.addRateRow()">+ Agregar Tarifa</button>
    </div>
    <form id="rateForm">
      <table class="table table-sm" id="ratesTable">
        <thead><tr><th>Servicio</th><th>Valor Unitario</th><th></th></tr></thead>
        <tbody id="ratesTableBody">
          ${tarifas.map(t => `
            <tr>
              <td><input type="text" class="form-input form-input-sm" name="servicio" value="${t.tipo_servicio}" required></td>
              <td><input type="number" class="form-input form-input-sm" name="valor" value="${t.valor_unitario}" step="0.01" min="0" required></td>
              <td><button type="button" class="btn btn-sm btn-ghost" onclick="this.closest('tr').remove()">🗑️</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </form>
  `;

  const modal = createModal(
    `Gestionar Tarifas - ${contrato.numero_contrato}`,
    formHTML,
    [
      { text: 'Cancelar', class: 'btn-secondary', onClick: () => closeModal(modal) },
      {
        text: 'Guardar Tarifas',
        class: 'btn-primary',
        onClick: () => {
          const rows = document.querySelectorAll('#ratesTableBody tr');
          const newTarifas = [];
          rows.forEach(row => {
            const servicio = row.querySelector('input[name="servicio"]').value;
            const valor = parseFloat(row.querySelector('input[name="valor"]').value);
            if (servicio && !isNaN(valor)) {
              newTarifas.push({ contrato_id: contratoId, tipo_servicio: servicio, valor_unitario: valor });
            }
          });

          const currentAll = db.getData('tarifas_contrato');
          const otherTarifas = currentAll.filter(t => t.contrato_id !== contratoId);

          newTarifas.forEach((t, index) => {
            t.id = otherTarifas.length + 1;
            otherTarifas.push(t);
          });

          db.setData('tarifas_contrato', otherTarifas);
          showToast('Tarifas actualizadas', 'success');
          closeModal(modal);
          this.renderTecnicosTarifasGrid();
        }
      }
    ]
  );
  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('active'), 10);
};

App.prototype.addRateRow = function () {
  const tbody = document.getElementById('ratesTableBody');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" class="form-input form-input-sm" name="servicio" placeholder="Ej: B/N" required></td>
    <td><input type="number" class="form-input form-input-sm" name="valor" placeholder="0" required></td>
    <td><button type="button" class="btn btn-sm btn-ghost" onclick="this.closest('tr').remove()">🗑️</button></td>
  `;
  tbody.appendChild(tr);
};
