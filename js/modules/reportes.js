/**
 * CONSEROUT - Advanced Reporting Module
 * Detailed analytics for consumables, maintenance, and fleet status
 */

App.prototype.loadReportesModule = function (container) {
  container.innerHTML = `
    <div class="module-container">
      <div class="module-header">
        <h2 class="module-title">Reportes y Análisis Avanzados</h2>
      </div>

      <div class="data-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--spacing-lg);">
        <!-- Consumables Report Card -->
        <div class="card hover-lift" onclick="app.showReporteConsumibles()">
          <div class="card-body text-center" style="padding: var(--spacing-xl);">
            <div style="font-size: 3rem; margin-bottom: var(--spacing-md);">📦</div>
            <h3 class="card-title">Consumo de Suministros</h3>
            <p class="text-tertiary">Análisis de salida de suministros por contrato y equipo.</p>
            <button class="btn btn-sm btn-ghost mt-md">Ver Reporte →</button>
          </div>
        </div>

        <!-- Contracts Summary Card -->
        <div class="card hover-lift" onclick="app.showReporteContratos()">
          <div class="card-body text-center" style="padding: var(--spacing-xl);">
            <div style="font-size: 3rem; margin-bottom: var(--spacing-md);">📝</div>
            <h3 class="card-title">Resumen de Contratos</h3>
            <p class="text-tertiary">Vigencia, valores y estados de todos los contratos y proyectos.</p>
            <button class="btn btn-sm btn-ghost mt-md">Ver Reporte →</button>
          </div>
        </div>

        <!-- Counter Analysis Card -->
        <div class="card hover-lift" onclick="app.showReporteContadoresContrato()">
          <div class="card-body text-center" style="padding: var(--spacing-xl);">
            <div style="font-size: 3rem; margin-bottom: var(--spacing-md);">📊</div>
            <h3 class="card-title">Lecturas por Contrato</h3>
            <p class="text-tertiary">Reporte de contadores acumulados y consumos por periodo.</p>
            <button class="btn btn-sm btn-ghost mt-md">Ver Reporte →</button>
          </div>
        </div>

        <!-- Maintenance Report Card -->
        <div class="card hover-lift" onclick="app.showReporteMantenimiento()">
          <div class="card-body text-center" style="padding: var(--spacing-xl);">
            <div style="font-size: 3rem; margin-bottom: var(--spacing-md);">🛠️</div>
            <h3 class="card-title">Eficiencia Operativa</h3>
            <p class="text-tertiary">Reporte de mantenimientos realizados y carga de técnicos.</p>
            <button class="btn btn-sm btn-ghost mt-md">Ver Reporte →</button>
          </div>
        </div>
      </div>
    </div>
  `;
};

App.prototype.showReporteConsumibles = function () {
  const content = `
    <div class="filters-container mb-lg">
      <div class="filters-grid">
        <div class="form-group m-0">
          <label class="form-label">Desde</label>
          <input type="date" class="form-input" id="repConsInicio">
        </div>
        <div class="form-group m-0">
          <label class="form-label">Hasta</label>
          <input type="date" class="form-input" id="repConsFin" value="${getCurrentDate()}">
        </div>
        <div class="form-group m-0">
          <label class="form-label">Contrato</label>
          <select class="form-select" id="repConsContrato">
            <option value="">Todos los contratos</option>
            ${(() => {
      const currUser = auth.getCurrentUser();
      const isTechnician = currUser && currUser.perfil_id === 3;
      let contracts = db.getData('contratos');
      if (isTechnician) {
        const asignados = db.getData('tecnicos_contrato').filter(tc => tc.tecnico_id === currUser.id).map(a => a.contrato_id);
        contracts = contracts.filter(c => asignados.includes(c.id));
      }
      return contracts.map(c => `<option value="${c.id}">${c.numero_contrato}</option>`).join('');
    })()}
          </select>
        </div>
      </div>
    </div>
    <div id="reporteConsResult" class="table-container">
      <p class="text-center text-tertiary py-xl">Seleccione filtros para generar el reporte</p>
    </div>
  `;

  const modal = createModal('Reporte de Consumo de Suministros', content, [
    { text: 'Cerrar', class: 'btn-secondary', onClick: () => closeModal(modal) },
    { text: '🖨️ Imprimir PDF', class: 'btn-ghost', onClick: () => window.print() },
    { text: '📊 Generar', class: 'btn-primary', onClick: () => this.generarDataReporteConsumibles() }
  ], 'xl');

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('active'), 10);
};

App.prototype.generarDataReporteConsumibles = function () {
  const inicio = document.getElementById('repConsInicio').value;
  const fin = document.getElementById('repConsFin').value;
  const contratoId = document.getElementById('repConsContrato').value;
  const resultDiv = document.getElementById('reporteConsResult');

  const movimientos = db.getData('movimientos_bodega').filter(m =>
    m.tipo === 'salida' &&
    (!inicio || m.fecha >= inicio) &&
    (!fin || m.fecha <= fin)
  );

  const suministros = db.getData('suministros');
  const equipos = db.getData('equipos');

  let html = `
    <table class="table table-sm">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Suministro</th>
          <th>Equipo / Serie</th>
          <th>Cantidad</th>
          <th>Técnico</th>
        </tr>
      </thead>
      <tbody>
  `;

  let totalItems = 0;
  const currUser = auth.getCurrentUser();
  const isTechnician = currUser && currUser.perfil_id === 3;
  let assignedContratosIds = [];
  if (isTechnician) {
    assignedContratosIds = db.getData('tecnicos_contrato').filter(tc => tc.tecnico_id === currUser.id).map(a => a.contrato_id);
  }

  movimientos.forEach(mov => {
    const sum = suministros.find(s => s.id === mov.suministro_id);
    const eq = equipos.find(e => e.id === mov.equipo_id);

    // Restriction for technicians
    if (isTechnician) {
      if (!eq || !eq.contrato_id || !assignedContratosIds.includes(eq.contrato_id)) return;
    }

    // Filter by contract if selected in form
    if (contratoId && (!eq || eq.contrato_id != contratoId)) return;

    totalItems += mov.cantidad;
    html += `
      <tr>
        <td>${formatDate(mov.fecha)}</td>
        <td><strong>${sum ? sum.nombre : 'N/A'}</strong><br><small>${sum ? sum.codigo : '-'}</small></td>
        <td>${eq ? eq.numero_serie : 'Salida General'}</td>
        <td>${mov.cantidad}</td>
        <td>${mov.usuario_id || 'Admin'}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
      <tfoot>
        <tr style="background: var(--color-bg-tertiary);">
          <td colspan="3" class="text-right font-bold">Total Consumido:</td>
          <td colspan="2" class="font-bold">${totalItems} unidades</td>
        </tr>
      </tfoot>
    </table>
  `;

  resultDiv.innerHTML = html;
};

App.prototype.showReporteContratos = function () {
  const content = `
    <div class="filters-container mb-lg">
      <div class="filters-grid">
        <div class="form-group m-0"><label class="form-label">Estado</label>
          <select class="form-select" id="repContrEstado">
            <option value="">Todos</option>
            <option value="vigente">Vigente</option>
            <option value="vencido">Vencido</option>
            <option value="cerrado">Cerrado</option>
          </select>
        </div>
        <div class="form-group m-0"><label class="form-label">Cliente</label>
          <select class="form-select" id="repContrCliente">
            <option value="">Todos los clientes</option>
            ${(() => {
      const currUser = auth.getCurrentUser();
      const isTechnician = currUser && currUser.perfil_id === 3;
      let validClients = db.getData('clientes');
      if (isTechnician) {
        const assignedContratos = db.getData('tecnicos_contrato').filter(tc => tc.tecnico_id === currUser.id).map(a => a.contrato_id);
        const clientIds = db.getData('contratos').filter(c => assignedContratos.includes(c.id)).map(c => c.cliente_id);
        validClients = validClients.filter(cl => clientIds.includes(cl.id));
      }
      return validClients.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
    })()}
          </select>
        </div>
      </div>
    </div>
    <div id="reporteContrResult" class="table-container"></div>
  `;

  const modal = createModal('Reporte Resumen de Contratos', content, [
    { text: 'Cerrar', class: 'btn-secondary', onClick: () => closeModal(modal) },
    { text: '📥 Exportar CSV', class: 'btn-ghost', onClick: () => this.exportToCSV('tableContratos', 'reporte_contratos') },
    { text: '📊 Generar', class: 'btn-primary', onClick: () => this.generarDataReporteContratos() }
  ], 'xl');

  document.body.appendChild(modal);
  setTimeout(() => {
    modal.classList.add('active');
    this.generarDataReporteContratos();
  }, 10);
};

App.prototype.generarDataReporteContratos = function () {
  const estado = document.getElementById('repContrEstado').value;
  const clienteId = document.getElementById('repContrCliente').value;
  const currUser = auth.getCurrentUser();
  const isTechnician = currUser && currUser.perfil_id === 3;
  let assignedIds = [];
  if (isTechnician) {
    assignedIds = db.getData('tecnicos_contrato').filter(tc => tc.tecnico_id === currUser.id).map(a => a.contrato_id);
  }

  const contratos = db.getData('contratos').filter(c =>
    (!estado || c.estado === estado) &&
    (!clienteId || c.cliente_id == clienteId) &&
    (!isTechnician || assignedIds.includes(c.id))
  );
  const clientes = db.getData('clientes');
  const resultDiv = document.getElementById('reporteContrResult');

  let html = `
    <table class="table" id="tableContratos">
      <thead>
        <tr>
          <th>N° Contrato</th>
          <th>Cliente</th>
          <th>Fecha Inicio</th>
          <th>Fecha Fin</th>
          <th>Valor Total</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        ${contratos.map(c => {
    const cliente = clientes.find(cl => cl.id == c.cliente_id);
    return `
            <tr>
              <td><strong>${c.numero_contrato}</strong></td>
              <td>${cliente ? cliente.nombre : 'N/A'}</td>
              <td>${formatDate(c.fecha_inicio)}</td>
              <td>${formatDate(c.fecha_fin)}</td>
              <td>${formatCurrency(c.valor_total || 0)}</td>
              <td><span class="badge badge-${c.estado === 'vigente' ? 'success' : 'danger'}">${c.estado.toUpperCase()}</span></td>
            </tr>
          `;
  }).join('')}
      </tbody>
    </table>
  `;
  resultDiv.innerHTML = html;
};

App.prototype.showReporteContadoresContrato = function () {
  const content = `
    <div class="filters-container mb-lg">
      <div class="filters-grid">
        <div class="form-group m-0"><label class="form-label">Desde</label>
          <input type="date" class="form-input" id="repContadInicio">
        </div>
        <div class="form-group m-0"><label class="form-label">Hasta</label>
          <input type="date" class="form-input" id="repContadFin" value="${getCurrentDate()}">
        </div>
        <div class="form-group m-0"><label class="form-label">Contrato/Proyecto</label>
          <select class="form-select" id="repContadContrato">
            <option value="">Todos los contratos</option>
            ${(() => {
      const currUser = auth.getCurrentUser();
      const isTechnician = currUser && currUser.perfil_id === 3;
      let contracts = db.getData('contratos');
      if (isTechnician) {
        const asignados = db.getData('tecnicos_contrato').filter(tc => tc.tecnico_id === currUser.id).map(a => a.contrato_id);
        contracts = contracts.filter(c => asignados.includes(c.id));
      }
      return contracts.map(c => `<option value="${c.id}">${c.numero_contrato}</option>`).join('');
    })()}
          </select>
        </div>
      </div>
    </div>
    <div id="reporteContadResult" class="table-container">
      <p class="text-center text-tertiary py-xl">Defina los filtros para mostrar lecturas</p>
    </div>
  `;

  const modal = createModal('Reporte de Lecturas por Contrato', content, [
    { text: 'Cerrar', class: 'btn-secondary', onClick: () => closeModal(modal) },
    { text: '📥 CSV', class: 'btn-ghost', onClick: () => this.exportToCSV('tableContadores', 'reporte_lecturas') },
    { text: '📊 Generar', class: 'btn-primary', onClick: () => this.generarDataReporteContadores() }
  ], 'xl');

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('active'), 10);
};

App.prototype.generarDataReporteContadores = function () {
  const inicio = document.getElementById('repContadInicio').value;
  const fin = document.getElementById('repContadFin').value;
  const contratoId = document.getElementById('repContadContrato').value;
  const resultDiv = document.getElementById('reporteContadResult');

  const currUser = auth.getCurrentUser();
  const isTechnician = currUser && currUser.perfil_id === 3;
  let assignedContratosIds = [];
  if (isTechnician) {
    assignedContratosIds = db.getData('tecnicos_contrato').filter(tc => tc.tecnico_id === currUser.id).map(a => a.contrato_id);
  }

  const lecturas = db.getData('contadores_equipos').filter(l =>
    (!inicio || l.fecha_lectura >= inicio) &&
    (!fin || l.fecha_lectura <= fin)
  );
  const equipos = db.getData('equipos');
  const modelos = db.getData('modelos');
  const contratos = db.getData('contratos');

  let html = `
    <table class="table table-sm" id="tableContadores">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Contrato</th>
          <th>Equipo / Serie</th>
          <th>Lectura Anterior</th>
          <th>Lectura Actual</th>
          <th>Consumo</th>
        </tr>
      </thead>
      <tbody>
  `;

  let totalConsumo = 0;
  lecturas.forEach(l => {
    const eq = equipos.find(e => e.id == l.equipo_id);
    if (!eq) return;

    // Restriction for technicians
    if (isTechnician) {
      if (!eq.contrato_id || !assignedContratosIds.includes(eq.contrato_id)) return;
    }

    const cont = contratos.find(c => c.id == eq.contrato_id);
    if (contratoId && eq.contrato_id != contratoId) return;

    totalConsumo += l.consumo || 0;
    const mod = modelos.find(m => m.id == eq.modelo_id);

    html += `
      <tr>
        <td>${formatDate(l.fecha_lectura)}</td>
        <td>${cont ? cont.numero_contrato : 'N/A'}</td>
        <td><strong>${mod ? mod.nombre : '-'}</strong> (${eq.numero_serie})</td>
        <td>${l.lectura_anterior || 0}</td>
        <td>${l.valor}</td>
        <td class="font-bold">${l.consumo || 0}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
      <tfoot>
        <tr style="background: var(--color-bg-tertiary);">
          <td colspan="5" class="text-right font-bold">Total Consumo Periodo:</td>
          <td class="font-bold text-primary">${totalConsumo}</td>
        </tr>
      </tfoot>
    </table>
  `;
  resultDiv.innerHTML = html;
};

App.prototype.showReporteMantenimiento = function () {
  const content = `
    <div class="filters-container mb-lg">
      <div class="filters-grid">
        <div class="form-group m-0"><label class="form-label">Tipo</label>
          <select class="form-select" id="repMantTipo">
            <option value="">Todos</option>
            <option value="preventivo">Preventivo</option>
            <option value="correctivo">Correctivo</option>
          </select>
        </div>
        <div class="form-group m-0"><label class="form-label">Técnico</label>
          <select class="form-select" id="repMantTec">
            <option value="">Cualquiera</option>
            ${db.getData('usuarios').filter(u => u.perfil_id === 3).map(u => `<option value="${u.id}">${u.nombre}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>
    <div id="reporteMantResult">
      <div style="height: 300px; display: flex; align-items: center; justify-content: center; background: var(--color-bg-tertiary); border-radius: var(--radius-lg);">
        <p class="text-tertiary">El gráfico de eficiencia se generará aquí</p>
      </div>
    </div>
  `;

  const modal = createModal('Eficiencia Operativa (Técnicos)', content, [
    { text: 'Cerrar', class: 'btn-secondary', onClick: () => closeModal(modal) },
    { text: '📊 Analizar Carga', class: 'btn-primary', onClick: () => showToast('Analizando datos históricos...', 'info') }
  ], 'lg');

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('active'), 10);
};

// Global export helper
App.prototype.exportToCSV = function (tableId, filename) {
  const table = document.getElementById(tableId);
  if (!table) return;

  let csv = [];
  const rows = table.querySelectorAll('tr');

  for (const row of rows) {
    const cols = row.querySelectorAll('td, th');
    let rowData = [];
    for (const col of cols) {
      rowData.push('"' + col.innerText.replace(/"/g, '""') + '"');
    }
    csv.push(rowData.join(','));
  }

  const csvContent = "data:text/csv;charset=utf-8," + csv.join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename + ".csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
