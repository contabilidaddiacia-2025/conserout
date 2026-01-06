/**
 * CONSEROUT - Reports Module
 * Comprehensive reporting system for consumption, equipment, and services
 */

// Extend App class with reports module
App.prototype.loadReportesModule = function (container) {
    container.innerHTML = `
    <div class="module-container">
      <div class="module-header">
        <h2 class="module-title">Reportes y Análisis</h2>
      </div>

      <div class="tabs">
        <button class="tab active" onclick="app.switchReportTab('consumo')">Consumo Mensual</button>
        <button class="tab" onclick="app.switchReportTab('equipos')">Equipos por Contrato</button>
        <button class="tab" onclick="app.switchReportTab('servicios')">Servicios Realizados</button>
      </div>

      <!-- Consumo Mensual Tab -->
      <div class="tab-content active" id="tab-consumo">
        <div class="filters-container">
          <div class="filters-grid">
            <div class="form-group m-0">
              <label class="form-label">Contrato</label>
              <select class="form-select" id="reportContratoFilter">
                <option value="">Todos los contratos</option>
              </select>
            </div>
            <div class="form-group m-0">
              <label class="form-label">Desde</label>
              <input type="month" class="form-input" id="reportFechaDesde">
            </div>
            <div class="form-group m-0">
              <label class="form-label">Hasta</label>
              <input type="month" class="form-input" id="reportFechaHasta" value="${getCurrentYearMonth()}">
            </div>
            <div style="display: flex; align-items: end;">
              <button class="btn btn-primary w-full" onclick="app.generateConsumoReport()">
                <span>📊</span>
                <span>Generar Reporte</span>
              </button>
            </div>
          </div>
        </div>

        <div id="reporteConsumoContainer"></div>
      </div>

      <!-- Equipos por Contrato Tab -->
      <div class="tab-content" id="tab-equipos">
        <div class="filters-container">
          <div class="filters-grid">
            <div class="form-group m-0">
              <label class="form-label required">Contrato</label>
              <select class="form-select" id="reportEquiposContrato">
                <option value="">Seleccione un contrato</option>
              </select>
            </div>
            <div style="display: flex; align-items: end;">
              <button class="btn btn-primary w-full" onclick="app.generateEquiposReport()">
                <span>📊</span>
                <span>Generar Reporte</span>
              </button>
            </div>
          </div>
        </div>

        <div id="reporteEquiposContainer"></div>
      </div>

      <!-- Servicios Tab -->
      <div class="tab-content" id="tab-servicios">
        <div class="filters-container">
          <div class="filters-grid">
            <div class="form-group m-0">
              <label class="form-label">Desde</label>
              <input type="date" class="form-input" id="serviciosFechaDesde">
            </div>
            <div class="form-group m-0">
              <label class="form-label">Hasta</label>
              <input type="date" class="form-input" id="serviciosFechaHasta" value="${getCurrentDate()}">
            </div>
            <div style="display: flex; align-items: end;">
              <button class="btn btn-primary w-full" onclick="app.generateServiciosReport()">
                <span>📊</span>
                <span>Generar Reporte</span>
              </button>
            </div>
          </div>
        </div>

        <div id="reporteServiciosContainer"></div>
      </div>
    </div>
  `;

    this.populateReportFilters();
};

App.prototype.switchReportTab = function (tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.add('active');
};

App.prototype.populateReportFilters = function () {
    const contratos = db.getData('contratos');

    // Populate contract filters
    const contratoFilters = [
        document.getElementById('reportContratoFilter'),
        document.getElementById('reportEquiposContrato')
    ];

    contratoFilters.forEach(select => {
        if (select && select.options.length === 1) {
            contratos.forEach(contrato => {
                const option = document.createElement('option');
                option.value = contrato.id;
                option.textContent = `${contrato.numero_contrato} - ${db.getById('clientes', contrato.cliente_id)?.nombre || 'N/A'}`;
                select.appendChild(option);
            });
        }
    });

    // Set default date range (last 3 months)
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const fechaDesde = document.getElementById('reportFechaDesde');
    if (fechaDesde) {
        fechaDesde.value = `${threeMonthsAgo.getFullYear()}-${String(threeMonthsAgo.getMonth() + 1).padStart(2, '0')}`;
    }
};

App.prototype.generateConsumoReport = function () {
    const contratoId = document.getElementById('reportContratoFilter')?.value;
    const fechaDesde = document.getElementById('reportFechaDesde')?.value;
    const fechaHasta = document.getElementById('reportFechaHasta')?.value;

    if (!fechaDesde || !fechaHasta) {
        showToast('Por favor seleccione el rango de fechas', 'warning');
        return;
    }

    const equipos = contratoId ?
        db.getBy('equipos', 'contrato_id', parseInt(contratoId)) :
        db.getData('equipos');

    const contadores = db.getData('contadores_equipos');
    const modelos = db.getData('modelos');
    const marcas = db.getData('marcas');
    const contratos = db.getData('contratos');
    const tarifas = db.getData('tarifas_contrato');

    // Filter counters by date range
    const [yearDesde, monthDesde] = fechaDesde.split('-').map(Number);
    const [yearHasta, monthHasta] = fechaHasta.split('-').map(Number);

    const filteredContadores = contadores.filter(c => {
        const fecha = new Date(c.fecha_lectura);
        const year = fecha.getFullYear();
        const month = fecha.getMonth() + 1;

        const dateValue = year * 100 + month;
        const desdeValue = yearDesde * 100 + monthDesde;
        const hastaValue = yearHasta * 100 + monthHasta;

        return dateValue >= desdeValue && dateValue <= hastaValue;
    });

    // Group by equipment and calculate totals
    const reportData = [];
    let totalConsumo = 0;
    let totalValor = 0;

    equipos.forEach(equipo => {
        const equipoContadores = filteredContadores.filter(c => c.equipo_id === equipo.id);
        const consumoTotal = equipoContadores.reduce((sum, c) => sum + c.consumo, 0);

        if (consumoTotal > 0 || equipoContadores.length > 0) {
            const modelo = modelos.find(m => m.id === equipo.modelo_id);
            const marca = modelo ? marcas.find(m => m.id === modelo.marca_id) : null;
            const contrato = contratos.find(c => c.id === equipo.contrato_id);

            // Get tariff (simplified - using first tariff)
            const tarifa = tarifas.find(t => t.contrato_id === equipo.contrato_id);
            const valorUnitario = tarifa ? tarifa.valor_unitario : 5; // Default $5 per page
            const valorTotal = consumoTotal * valorUnitario;

            reportData.push({
                equipo,
                modelo,
                marca,
                contrato,
                consumo: consumoTotal,
                valor: valorTotal,
                lecturas: equipoContadores.length
            });

            totalConsumo += consumoTotal;
            totalValor += valorTotal;
        }
    });

    // Render report
    const container = document.getElementById('reporteConsumoContainer');
    container.innerHTML = `
    <div class="card" style="margin-top: var(--spacing-lg);">
      <div class="card-header">
        <h3 class="card-title">Reporte de Consumo Mensual</h3>
        <div style="display: flex; gap: var(--spacing-sm);">
          <button class="btn btn-sm btn-secondary" onclick="app.exportReportPDF()">
            <span>📄</span>
            <span>PDF</span>
          </button>
          <button class="btn btn-sm btn-secondary" onclick="app.exportReportExcel()">
            <span>📊</span>
            <span>Excel</span>
          </button>
        </div>
      </div>
      
      <div style="padding: var(--spacing-lg); background: rgba(59, 130, 246, 0.1); border-radius: var(--radius-md); margin: var(--spacing-lg);">
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-lg); text-align: center;">
          <div>
            <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary); margin-bottom: var(--spacing-xs);">PERÍODO</div>
            <div style="font-size: var(--font-size-lg); font-weight: bold;">${getMonthName(monthDesde)} ${yearDesde} - ${getMonthName(monthHasta)} ${yearHasta}</div>
          </div>
          <div>
            <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary); margin-bottom: var(--spacing-xs);">CONSUMO TOTAL</div>
            <div style="font-size: var(--font-size-2xl); font-weight: bold; color: var(--color-success);">${formatNumber(totalConsumo)}</div>
            <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary);">páginas</div>
          </div>
          <div>
            <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary); margin-bottom: var(--spacing-xs);">VALOR TOTAL</div>
            <div style="font-size: var(--font-size-2xl); font-weight: bold; color: var(--color-primary);">${formatCurrency(totalValor)}</div>
          </div>
        </div>
      </div>
      
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Equipo</th>
              <th>Marca</th>
              <th>Modelo</th>
              <th>N° Serie</th>
              <th>Contrato</th>
              <th>Ubicación</th>
              <th>Lecturas</th>
              <th>Consumo</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.map(item => `
              <tr>
                <td>🖨️ ${item.modelo?.nombre || 'N/A'}</td>
                <td>${item.marca?.nombre || '-'}</td>
                <td>${item.modelo?.nombre || '-'}</td>
                <td><code>${item.equipo.numero_serie}</code></td>
                <td>${item.contrato?.numero_contrato || '-'}</td>
                <td>${item.equipo.ubicacion || '-'}</td>
                <td>${item.lecturas}</td>
                <td><strong>${formatNumber(item.consumo)}</strong></td>
                <td>${formatCurrency(item.valor)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background: var(--color-bg-tertiary); font-weight: bold;">
              <td colspan="7" style="text-align: right;">TOTALES:</td>
              <td><strong>${formatNumber(totalConsumo)}</strong></td>
              <td><strong>${formatCurrency(totalValor)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `;

    if (reportData.length === 0) {
        container.innerHTML = `
      <div class="empty-state" style="margin-top: var(--spacing-xl);">
        <div class="empty-state-icon">📊</div>
        <div class="empty-state-title">Sin datos para mostrar</div>
        <div class="empty-state-description">No hay consumo registrado en el período seleccionado</div>
      </div>
    `;
    }
};

App.prototype.generateEquiposReport = function () {
    const contratoId = document.getElementById('reportEquiposContrato')?.value;

    if (!contratoId) {
        showToast('Por favor seleccione un contrato', 'warning');
        return;
    }

    const contrato = db.getById('contratos', contratoId);
    const cliente = db.getById('clientes', contrato.cliente_id);
    const equipos = db.getBy('equipos', 'contrato_id', parseInt(contratoId));
    const modelos = db.getData('modelos');
    const marcas = db.getData('marcas');
    const contadores = db.getData('contadores_equipos');

    const container = document.getElementById('reporteEquiposContainer');
    container.innerHTML = `
    <div class="card" style="margin-top: var(--spacing-lg);">
      <div class="card-header">
        <h3 class="card-title">Equipos por Contrato</h3>
        <button class="btn btn-sm btn-secondary" onclick="app.exportReportPDF()">
          <span>📄</span>
          <span>Exportar PDF</span>
        </button>
      </div>
      
      <div style="padding: var(--spacing-lg); background: var(--color-surface); border-radius: var(--radius-md); margin: var(--spacing-lg);">
        <h4 style="margin-bottom: var(--spacing-md);">Información del Contrato</h4>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md);">
          <div>
            <strong>Cliente:</strong> ${cliente.nombre}<br>
            <strong>N° Contrato:</strong> ${contrato.numero_contrato}<br>
            <strong>Estado:</strong> ${getStatusBadge(contrato.estado)}
          </div>
          <div>
            <strong>Período:</strong> ${formatDate(contrato.fecha_inicio)} - ${formatDate(contrato.fecha_fin)}<br>
            <strong>Total Equipos:</strong> ${equipos.length}<br>
            <strong>Valor Contrato:</strong> ${formatCurrency(contrato.valor_total)}
          </div>
        </div>
      </div>
      
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Equipo</th>
              <th>Marca</th>
              <th>Modelo</th>
              <th>N° Serie</th>
              <th>Estado</th>
              <th>Ubicación</th>
              <th>Fecha Instalación</th>
              <th>Consumo Acumulado</th>
            </tr>
          </thead>
          <tbody>
            ${equipos.map(equipo => {
        const modelo = modelos.find(m => m.id === equipo.modelo_id);
        const marca = modelo ? marcas.find(m => m.id === modelo.marca_id) : null;
        const equipoContadores = contadores.filter(c => c.equipo_id === equipo.id);
        const consumoTotal = equipoContadores.reduce((sum, c) => sum + c.consumo, 0);

        return `
                <tr>
                  <td>🖨️ ${modelo?.nombre || 'N/A'}</td>
                  <td>${marca?.nombre || '-'}</td>
                  <td>${modelo?.nombre || '-'}</td>
                  <td><code>${equipo.numero_serie}</code></td>
                  <td>${getStatusBadge(equipo.estado)}</td>
                  <td>${equipo.ubicacion || '-'}</td>
                  <td>${formatDate(equipo.fecha_instalacion)}</td>
                  <td><strong>${formatNumber(consumoTotal)}</strong> páginas</td>
                </tr>
              `;
    }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
};

App.prototype.generateServiciosReport = function () {
    showToast('Reporte de servicios en desarrollo', 'info');
};

App.prototype.exportReportPDF = function () {
    showToast('Exportación a PDF en desarrollo', 'info');
};

App.prototype.exportReportExcel = function () {
    showToast('Exportación a Excel en desarrollo', 'info');
};
