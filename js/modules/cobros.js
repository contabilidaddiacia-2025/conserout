/**
 * CONSEROUT - Billing & Collections Module
 * Calculate and manage billing based on equipment counters and contract rates
 */

App.prototype.loadCobrosModule = function (container) {
  container.innerHTML = `
    <div class="module-container">
      <div class="module-header">
        <h2 class="module-title">Facturación y Cobros</h2>
        <div class="module-actions">
          <button class="btn btn-primary" onclick="app.showGenerarFacturaForm()">
            <span>📄</span>
            <span>Generar Facturación</span>
          </button>
        </div>
      </div>

      <div class="filters-container">
        <div class="filters-grid">
          <div class="search-bar">
            <input type="text" class="form-input" placeholder="Buscar cliente..." id="searchCobro">
          </div>
          <div class="form-group m-0">
            <label class="form-label">Contrato</label>
            <select class="form-select" id="filterContratoCobro">
              <option value="">Todos</option>
            </select>
          </div>
          <div class="form-group m-0">
            <label class="form-label">Estado</label>
            <select class="form-select" id="filterEstadoCobro">
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado</option>
              <option value="vencido">Vencido</option>
            </select>
          </div>
          <div style="display: flex; align-items: end;">
            <button class="btn btn-secondary w-full" onclick="app.renderCobrosTable()">
              <span>🔍</span>
              <span>Filtrar</span>
            </button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="table-container">
          <table class="table" id="cobrosTable">
            <thead>
              <tr>
                <th>Periodo</th>
                <th>Cliente / Contrato</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Vencimiento</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="cobrosTableBody">
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  this.loadCobrosFilters();
  this.renderCobrosTable();
};

App.prototype.loadCobrosFilters = function () {
  let contratos = db.getData('contratos');
  const clientes = db.getData('clientes');
  const select = document.getElementById('filterContratoCobro');
  const currUser = auth.getCurrentUser();

  if (currUser && currUser.perfil_id === 3) { // Technician
    const assignedIds = db.getData('tecnicos_contrato')
      .filter(tc => tc.tecnico_id === currUser.id)
      .map(tc => tc.contrato_id);
    contratos = contratos.filter(c => assignedIds.includes(c.id));
  }

  if (select) {
    select.innerHTML = '<option value="">Todos</option>' +
      contratos.map(c => {
        const cliente = clientes.find(cl => cl.id === c.cliente_id);
        return `<option value="${c.id}">${c.numero_contrato} - ${cliente ? cliente.nombre : '?'}</option>`;
      }).join('');
  }
};

App.prototype.renderCobrosTable = function () {
  let cobros = db.getData('cobros') || [];  // Let allows filtering
  const clientes = db.getData('clientes');
  const contratos = db.getData('contratos');
  const tbody = document.getElementById('cobrosTableBody');

  // Filters
  const filterEstado = document.getElementById('filterEstadoCobro')?.value;
  const filterContrato = document.getElementById('filterContratoCobro')?.value;
  const searchTerm = document.getElementById('searchCobro')?.value.toLowerCase();

  const user = auth.getCurrentUser();
  const isAdmin = user && (user.perfil.permisos.includes('all') || user.perfil.nombre.toLowerCase().includes('admin'));

  // Technician Restriction implementation for the table view as well
  if (user && user.perfil_id === 3) {
    const assignedIds = db.getData('tecnicos_contrato')
      .filter(tc => tc.tecnico_id === user.id)
      .map(tc => tc.contrato_id);
    cobros = cobros.filter(c => assignedIds.includes(c.contrato_id));
  }

  if (!tbody) return;
  tbody.innerHTML = '';

  let filtered = cobros;

  if (filterEstado) {
    filtered = filtered.filter(c => c.estado === filterEstado);
  }

  if (filterContrato) {
    filtered = filtered.filter(c => c.contrato_id == filterContrato);
  }

  if (searchTerm) {
    filtered = filtered.filter(c => {
      const cliente = clientes.find(cli => cli.id === c.cliente_id);
      const contrato = contratos.find(con => con.id === c.contrato_id);
      return (cliente && cliente.nombre.toLowerCase().includes(searchTerm)) ||
        (contrato && contrato.numero_contrato.toLowerCase().includes(searchTerm));
    });
  }

  filtered.sort((a, b) => new Date(b.periodo_fin) - new Date(a.periodo_fin)).forEach(cobro => {
    const contrato = contratos.find(c => c.id === cobro.contrato_id);
    const cliente = clientes.find(c => c.id === cobro.cliente_id);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDate(cobro.periodo_inicio)} - ${formatDate(cobro.periodo_fin)}</td>
      <td>
        <strong>${cliente ? cliente.nombre : 'N/A'}</strong><br>
        <small class="text-tertiary">${contrato ? contrato.numero_contrato : '-'}</small>
      </td>
      <td><strong>${formatCurrency(cobro.monto_total)}</strong></td>
      <td>${getStatusBadge(cobro.estado)}</td>
      <td>${formatDate(cobro.fecha_vencimiento)}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-sm btn-ghost" onclick="app.viewDetalleCobro(${cobro.id})" title="Ver Detalles">👁️</button>
          
          ${cobro.estado === 'pendiente' ?
        `<button class="btn btn-sm btn-ghost" onclick="app.registrarPago(${cobro.id})" title="Registrar Pago">💰</button>
             <button class="btn btn-sm btn-ghost text-danger" onclick="app.eliminarCobro(${cobro.id})" title="Eliminar Cobro">🗑️</button>`
        : ''}
            
          ${(cobro.estado === 'pagado' && isAdmin) ?
        `<button class="btn btn-sm btn-ghost text-warning" onclick="app.deshacerPago(${cobro.id})" title="Deshacer Pago (Admin)">🔓</button>`
        : ''}

          <button class="btn btn-sm btn-ghost" onclick="app.exportarCobroPDF(${cobro.id})" title="Exportar Manualmente">📄</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No hay registros encontrados</td></tr>`;
  }
};

App.prototype.showGenerarFacturaForm = function () {
  let contratos = db.getData('contratos').filter(c => c.estado === 'vigente');
  const clientes = db.getData('clientes');
  const currUser = auth.getCurrentUser();

  if (currUser && currUser.perfil_id === 3) { // Technician
    const assignedIds = db.getData('tecnicos_contrato')
      .filter(tc => tc.tecnico_id === currUser.id)
      .map(tc => tc.contrato_id);
    contratos = contratos.filter(c => assignedIds.includes(c.id));
  }

  const formHTML = `
    <form id="generarFacturaForm">
      <div class="form-group">
        <label class="form-label required">Contrato</label>
        <select class="form-select" name="contrato_id" required>
          <option value="">Seleccione contrato</option>
          ${contratos.map(c => {
    const cliente = clientes.find(cli => cli.id === c.cliente_id);
    return `<option value="${c.id}">${c.numero_contrato} - ${cliente ? cliente.nombre : '?'}</option>`;
  }).join('')}
        </select>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md);">
        <div class="form-group">
          <label class="form-label required">Desde</label>
          <input type="date" class="form-input" name="periodo_inicio" required>
        </div>
        <div class="form-group">
          <label class="form-label required">Hasta</label>
          <input type="date" class="form-input" name="periodo_fin" required>
        </div>
      </div>
      <div class="alert alert-info">
        <span>ℹ️</span>
        <div>La facturación calculará el consumo de contadores registrado en este periodo y aplicará las tarifas del contrato.</div>
      </div>
    </form>
  `;

  const modal = createModal(
    'Generar Facturación Mensual',
    formHTML,
    [
      { text: 'Cancelar', class: 'btn-secondary', onClick: () => closeModal(modal) },
      {
        text: 'Calcular y Generar',
        class: 'btn-primary',
        onClick: () => {
          const form = document.getElementById('generarFacturaForm');
          if (!form.checkValidity()) {
            form.reportValidity();
            return;
          }

          const formData = new FormData(form);
          this.procesarFacturacion(formData, modal);
        }
      }
    ]
  );
  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('active'), 10);
};

App.prototype.procesarFacturacion = function (formData, modal) {
  const contratoId = parseInt(formData.get('contrato_id'));
  const inicio = formData.get('periodo_inicio');
  const fin = formData.get('periodo_fin');

  const contrato = db.getById('contratos', contratoId);
  const tarifas = db.getData('tarifas_contrato').filter(t => t.contrato_id === contratoId);
  const equipos = db.getData('equipos').filter(e => e.contrato_id === contratoId);

  let montoTotal = 0;
  const detallesItems = [];

  // Find B/N and Color rates specifically
  const tarifaBN = tarifas.find(t => t.tipo_servicio.toUpperCase().includes('B/N') || t.tipo_servicio.toUpperCase().includes('BN')) || null;
  const tarifaColor = tarifas.find(t => t.tipo_servicio.toUpperCase().includes('COLOR')) || null;
  const tarifaBase = tarifas[0] || { valor_unitario: 0, tipo_servicio: 'Servicio' };

  const contadores = db.getData('contadores_equipos');

  equipos.forEach(equipo => {
    // Only consider approved readings within the range
    const lecturas = contadores.filter(c =>
      c.equipo_id == equipo.id &&
      (c.aprobado === true || c.aprobado == 1) &&
      c.fecha_lectura >= inicio &&
      c.fecha_lectura <= fin
    );

    if (lecturas.length === 0) return;

    if (lecturas.length > 0) {
      // Sort readings by date to find initial/final
      lecturas.sort((a, b) => new Date(a.fecha_lectura) - new Date(b.fecha_lectura));

      const initRead = lecturas[0];
      const finalRead = lecturas[lecturas.length - 1];

      // Calculate totals
      const consumoBN = lecturas.reduce((sum, l) => sum + (parseFloat(l.consumo_bn) || 0), 0);
      const consumoColor = lecturas.reduce((sum, l) => sum + (parseFloat(l.consumo_color) || 0), 0);

      let subtotalEquipo = 0;
      const lineasDetalle = [];

      if (consumoBN > 0) {
        const vUnit = tarifaBN ? tarifaBN.valor_unitario : tarifaBase.valor_unitario;
        const sub = consumoBN * vUnit;
        lineasDetalle.push({
          tipo: 'B/N',
          consumo: consumoBN,
          vUnit,
          sub,
          inicio: initRead.ant_bn ?? initRead.contador_anterior ?? initRead.contador_bn_anterior ?? 0,
          fin: finalRead.contador_bn ?? finalRead.contador_actual ?? 0
        });
        subtotalEquipo += sub;
      }

      if (consumoColor > 0) {
        const vUnit = tarifaColor ? tarifaColor.valor_unitario : tarifaBase.valor_unitario;
        const sub = consumoColor * vUnit;
        lineasDetalle.push({
          tipo: 'Color',
          consumo: consumoColor,
          vUnit,
          sub,
          inicio: initRead.ant_color ?? initRead.contador_anterior_color ?? initRead.contador_color_anterior ?? 0,
          fin: finalRead.contador_color ?? 0
        });
        subtotalEquipo += sub;
      }

      if (subtotalEquipo > 0) {
        detallesItems.push({
          equipo_id: equipo.id,
          subtotal: subtotalEquipo,
          lineas: lineasDetalle
        });
        montoTotal += subtotalEquipo;
      }
    }
  });

  if (detallesItems.length === 0) {
    showToast('No se encontraron lecturas de consumo APROBADAS para el periodo seleccionado', 'warning');
    return;
  }

  // CLOSE selection modal
  closeModal(modal);

  const cobroData = {
    contrato_id: contratoId,
    cliente_id: contrato.cliente_id,
    periodo_inicio: inicio,
    periodo_fin: fin,
    monto_total: montoTotal,
    estado: 'pendiente',
    fecha_generacion: getCurrentDate(),
    fecha_vencimiento: new Date(new Date(fin).getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    detalles: detallesItems
  };

  // SHOW PREVIEW MODAL
  this.mostrarVistaPreviaFacturacion(cobroData, contrato);
};

App.prototype.mostrarVistaPreviaFacturacion = function (cobroData, contrato) {
  const content = `
    <div style="display: grid; gap: var(--spacing-lg);">
      <div class="alert alert-info" style="margin-bottom: 0;">
        <span>ℹ️</span>
        <div>Revise los totales calculados antes de confirmar el guardado y la descarga del reporte.</div>
      </div>

      <div class="detail-section">
        <h4 class="detail-section-title">Resumen de Facturación</h4>
        <div class="detail-row"><div class="detail-label">Cliente:</div><div class="font-bold">${db.getById('clientes', cobroData.cliente_id)?.nombre}</div></div>
        <div class="detail-row"><div class="detail-label">Contrato:</div><div>${contrato.numero_contrato}</div></div>
        <div class="detail-row"><div class="detail-label">Periodo:</div><div>${formatDate(cobroData.periodo_inicio)} al ${formatDate(cobroData.periodo_fin)}</div></div>
        <div class="detail-row" style="font-size: 1.1rem; color: var(--color-primary);">
          <div class="detail-label">Total Neto:</div>
          <div class="font-bold">${formatCurrency(cobroData.monto_total)}</div>
        </div>
      </div>

      <div class="detail-section">
        <h4 class="detail-section-title">Detalle de Equipos (${cobroData.detalles.length})</h4>
        <div style="max-height: 200px; overflow-y: auto;">
          <table class="table table-sm">
            <thead><tr><th>Equipo / Serie</th><th>B/N</th><th>Color</th><th>Subtotal</th></tr></thead>
            <tbody>
              ${cobroData.detalles.map(d => {
    const eq = db.getById('equipos', d.equipo_id);
    const mod = eq ? db.getById('modelos', eq.modelo_id) : null;
    const lineBN = d.lineas.find(l => l.tipo === 'B/N');
    const lineCol = d.lineas.find(l => l.tipo === 'Color');
    return `
                  <tr>
                    <td><small><strong>${mod?.nombre}</strong><br>${eq?.numero_serie}</small></td>
                    <td>${lineBN ? formatNumber(lineBN.consumo) : '0'}</td>
                    <td>${lineCol ? formatNumber(lineCol.consumo) : '0'}</td>
                    <td class="font-bold">${formatCurrency(d.subtotal)}</td>
                  </tr>
                `;
  }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  const modal = createModal(
    'Vista Previa de Facturación',
    content,
    [
      { text: 'Atrás', class: 'btn-secondary', onClick: () => { closeModal(modal); this.showGenerarFacturaForm(); } },
      { text: 'Confirmar y Generar', class: 'btn-primary', onClick: () => this.confirmarGuardadoFactura(cobroData, modal) }
    ],
    'lg'
  );

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('active'), 10);
};

App.prototype.confirmarGuardadoFactura = function (cobroData, modal) {
  const newRecord = db.insert('cobros', cobroData);
  if (!newRecord || !newRecord.id) {
    showToast('Error crítico al guardar en base de datos', 'danger');
    return;
  }

  showToast('Facturación guardada exitosamente', 'success');
  closeModal(modal);
  this.renderCobrosTable();

  // Automatic export DISABLED upon request
  // setTimeout(() => this.exportarCobroPDF(newRecord.id), 500);
};

App.prototype.viewDetalleCobro = function (id) {
  const cobro = db.getById('cobros', id);
  const cliente = db.getById('clientes', cobro.cliente_id);
  const equipos = db.getData('equipos');
  const modelos = db.getData('modelos');

  const content = `
    <div style="display: grid; gap: var(--spacing-lg);">
      <div class="detail-section">
        <h4 class="detail-section-title">Información de Facturación</h4>
        <div class="detail-row"><div class="detail-label">Cliente:</div><div>${cliente.nombre}</div></div>
        <div class="detail-row"><div class="detail-label">Periodo:</div><div>${formatDate(cobro.periodo_inicio)} - ${formatDate(cobro.periodo_fin)}</div></div>
        <div class="detail-row"><div class="detail-label">Total:</div><div class="font-bold">${formatCurrency(cobro.monto_total)}</div></div>
        <div class="detail-row"><div class="detail-label">Estado:</div><div>${getStatusBadge(cobro.estado)}</div></div>
      </div>
      
      <div class="detail-section">
        <h4 class="detail-section-title">Desglose por Equipo</h4>
        <table class="table table-sm">
          <thead><tr><th>Equipo</th><th>Desglose Consumo</th><th>Subtotal</th></tr></thead>
          <tbody>
            ${cobro.detalles.map(d => {
    const eq = equipos.find(e => e.id === d.equipo_id);
    const mod = eq ? modelos.find(m => m.id === eq.modelo_id) : null;
    return `
                <tr>
                  <td>
                    <strong>${mod ? mod.nombre : 'Eq #' + d.equipo_id}</strong><br>
                    <small>${eq ? eq.numero_serie : '-'}</small>
                  </td>
                  <td>
                    <div style="font-size: 0.85rem;">
                      ${d.lineas.map(l => `
                        <div>${l.tipo}: ${formatNumber(l.consumo)} x ${formatCurrency(l.vUnit)}</div>
                      `).join('')}
                    </div>
                  </td>
                  <td><strong>${formatCurrency(d.subtotal)}</strong></td>
                </tr>
              `;
  }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  const modal = createModal('Detalle de Cobro', content, [{ text: 'Cerrar', class: 'btn-secondary', onClick: () => closeModal(modal) }]);
  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('active'), 10);
};

App.prototype.registrarPago = function (id) {
  showConfirm(
    'Registrar Pago',
    '¿Desea marcar esta factura como PAGADA?',
    () => {
      db.update('cobros', id, { estado: 'pagado', fecha_pago: getCurrentDate() });
      showToast('Pago registrado correctamente', 'success');
      this.renderCobrosTable();
    }
  );
};

App.prototype.deshacerPago = function (id) {
  // Security check redundant if UI handles it, but good for safety
  const user = auth.getCurrentUser();
  if (!user || !(user.perfil.permisos.includes('all') || user.perfil.nombre.toLowerCase().includes('admin'))) {
    showToast('No tiene permisos para realizar esta acción', 'danger');
    return;
  }

  showConfirm(
    'Deshacer Pago',
    '¿Confirmas que deseas revertir el estado de esta factura a PENDIENTE? (Solo Administrador)',
    () => {
      db.update('cobros', id, { estado: 'pendiente', fecha_pago: null });
      showToast('Estado revertido a pendiente', 'info');
      this.renderCobrosTable();
    }
  );
};

App.prototype.exportarCobroPDF = function (id) {
  const cobro = db.getById('cobros', id);
  const cliente = db.getById('clientes', cobro.cliente_id);
  const contrato = db.getById('contratos', cobro.contrato_id);
  const equipos = db.getData('equipos');
  const modelos = db.getData('modelos');

  if (!cobro) {
    showToast('Error al encontrar los datos de cobro', 'danger');
    return;
  }

  // Create a CSV structure with all requested details
  let csv = [];
  csv.push(`"REPORTE DE FACTURACION"`);
  csv.push(`"Cliente:", "${cliente?.nombre || 'N/A'}"`);
  csv.push(`"RUT:", "${cliente?.rut || 'N/A'}"`);
  csv.push(`"Contrato:", "${contrato?.numero_contrato || 'N/A'}"`);
  csv.push(`"Periodo:", "${formatDate(cobro.periodo_inicio)} al ${formatDate(cobro.periodo_fin)}"`);
  csv.push(`"Cantidad Equipos:", "${cobro.detalles.length}"`);
  csv.push(`"Monto Total:", "${formatCurrency(cobro.monto_total)}"`);
  csv.push(`"Estado:", "${cobro.estado.toUpperCase()}"`);
  csv.push("");
  csv.push(`"DETALLE POR EQUIPO"`);
  csv.push(`"Equipo", "Serie", "Servicio", "Cont. Inicial", "Cont. Final", "Consumo", "Tarifa", "Subtotal"`);

  cobro.detalles.forEach(d => {
    const eq = equipos.find(e => e.id === d.equipo_id);
    const mod = eq ? modelos.find(m => m.id === eq.modelo_id) : null;

    d.lineas.forEach(l => {
      // Handle missing new fields for old records gracefully
      const inicio = l.inicio !== undefined ? l.inicio : '-';
      const fin = l.fin !== undefined ? l.fin : '-';
      csv.push(`"${mod?.nombre || 'Eq'}","${eq?.numero_serie || '-'}","${l.tipo}","${inicio}","${fin}","${l.consumo}","${l.vUnit}","${l.sub}"`);
    });
  });

  const csvContent = csv.join("\n");
  const filename = `Facturacion_${cliente?.nombre.replace(/\s+/g, '_')}_${cobro.periodo_fin}.csv`;

  downloadFile(csvContent, filename, 'text/csv;charset=utf-8');
  showToast('Archivo generado y descargado', 'success');
};

App.prototype.eliminarCobro = function (id) {
  showConfirm(
    'Eliminar Facturación',
    '¿Estás seguro de que deseas eliminar este registro de facturación? Esta acción no se puede deshacer.',
    () => {
      db.delete('cobros', id);
      showToast('Facturación eliminada correctamente', 'success');
      this.renderCobrosTable();
    }
  );
};
