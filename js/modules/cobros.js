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
            <label class="form-label">Estado</label>
            <select class="form-select" id="filterEstadoCobro">
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado</option>
              <option value="vencido">Vencido</option>
            </select>
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

    this.renderCobrosTable();
};

App.prototype.renderCobrosTable = function () {
    const cobros = db.getData('cobros') || [];
    const clientes = db.getData('clientes');
    const contratos = db.getData('contratos');
    const tbody = document.getElementById('cobrosTableBody');

    if (!tbody) return;
    tbody.innerHTML = '';

    cobros.sort((a, b) => new Date(b.periodo_fin) - new Date(a.periodo_fin)).forEach(cobro => {
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
      <td>${this.getStatusBadge(cobro.estado)}</td>
      <td>${formatDate(cobro.fecha_vencimiento)}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-sm btn-ghost" onclick="app.viewDetalleCobro(${cobro.id})" title="Ver Detalles">👁️</button>
          ${cobro.estado !== 'pagado' ? `<button class="btn btn-sm btn-ghost" onclick="app.registrarPago(${cobro.id})" title="Registrar Pago">💰</button>` : ''}
          <button class="btn btn-sm btn-ghost" onclick="app.exportarCobroPDF(${cobro.id})" title="Exportar">📄</button>
        </div>
      </td>
    `;
        tbody.appendChild(tr);
    });

    if (cobros.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No hay registros de facturación</td></tr>`;
    }
};

App.prototype.showGenerarFacturaForm = function () {
    const contratos = db.getData('contratos').filter(c => c.estado === 'vigente');
    const clientes = db.getData('clientes');

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

    // Logic to sum consumptions. Simple approach for demo: Sum 'consumo' from contadores in range
    const contadores = db.getData('contadores_equipos');
    equipos.forEach(equipo => {
        const lecturas = contadores.filter(c =>
            c.equipo_id === equipo.id &&
            c.fecha_lectura >= inicio &&
            c.fecha_lectura <= fin
        );

        const consumoTotal = lecturas.reduce((sum, l) => sum + l.consumo, 0);

        // For each equipment, if it's laser B/N we apply B/N rate. 
        // This is simplified. Real logic would match 'servicio' with reading type.
        const tarifa = tarifas[0] || { valor_unitario: 10, tipo_servicio: 'Servicio Base' };
        const subtotal = consumoTotal * tarifa.valor_unitario;

        if (consumoTotal > 0) {
            detallesItems.push({
                equipo_id: equipo.id,
                consumo: consumoTotal,
                tarifa: tarifa.valor_unitario,
                servicio: tarifa.tipo_servicio,
                subtotal: subtotal
            });
            montoTotal += subtotal;
        }
    });

    if (detallesItems.length === 0) {
        showToast('No se encontraron lecturas de consumo para el periodo seleccionado', 'warning');
        return;
    }

    const cobroData = {
        contrato_id: contratoId,
        cliente_id: contrato.cliente_id,
        periodo_inicio: inicio,
        periodo_fin: fin,
        monto_total: montoTotal,
        estado: 'pendiente',
        fecha_generacion: getCurrentDate(),
        fecha_vencimiento: new Date(new Date(fin).getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days later
        detalles: detallesItems
    };

    db.insert('cobros', cobroData);
    showToast('Facturación generada exitosamente', 'success');
    closeModal(modal);
    this.renderCobrosTable();
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
        <div class="detail-row"><div class="detail-label">Estado:</div><div>${this.getStatusBadge(cobro.estado)}</div></div>
      </div>
      
      <div class="detail-section">
        <h4 class="detail-section-title">Desglose por Equipo</h4>
        <table class="table table-sm">
          <thead><tr><th>Equipo</th><th>Consumo</th><th>Tarifa</th><th>Subtotal</th></tr></thead>
          <tbody>
            ${cobro.detalles.map(d => {
        const eq = equipos.find(e => e.id === d.equipo_id);
        const mod = eq ? modelos.find(m => m.id === eq.modelo_id) : null;
        return `
                <tr>
                  <td>${mod ? mod.nombre : 'Eq #' + d.equipo_id}<br><small>${eq ? eq.numero_serie : '-'}</small></td>
                  <td>${d.consumo}</td>
                  <td>${formatCurrency(d.tarifa)}</td>
                  <td>${formatCurrency(d.subtotal)}</td>
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
