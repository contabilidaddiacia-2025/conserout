/**
 * CONSEROUT - Warehouse Reports Module
 * Detailed reports for supply tracking by contract
 */

// Extend App class with warehouse reporting
App.prototype.generarReporteSuministro = function (suministroId) {
    const suministro = db.getById('suministros', suministroId);
    const movimientos = db.getData('movimientos_bodega')
        .filter(m => m.suministro_id === suministroId && m.tipo_movimiento === 'salida')
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    const contratos = db.getData('contratos');
    const clientes = db.getData('clientes');
    const equipos = db.getData('equipos');
    const modelos = db.getData('modelos');

    // Group by contract
    const porContrato = {};
    movimientos.forEach(mov => {
        if (mov.contrato_id) {
            if (!porContrato[mov.contrato_id]) {
                porContrato[mov.contrato_id] = {
                    contrato: contratos.find(c => c.id === mov.contrato_id),
                    movimientos: [],
                    total: 0
                };
            }
            porContrato[mov.contrato_id].movimientos.push(mov);
            porContrato[mov.contrato_id].total += mov.cantidad;
        }
    });

    const content = `
    <div style="display: grid; gap: var(--spacing-lg);">
      <div class="detail-section">
        <h4 class="detail-section-title">Reporte de Distribución: ${suministro.nombre}</h4>
        <p style="color: var(--color-text-secondary);">Código: ${suministro.codigo}</p>
      </div>
      
      ${Object.keys(porContrato).length > 0 ? `
        <div class="detail-section">
          <h4 class="detail-section-title">Distribución por Contrato</h4>
          ${Object.values(porContrato).map(item => {
        const cliente = item.contrato ? clientes.find(c => c.id === item.contrato.cliente_id) : null;
        return `
              <div style="margin-bottom: var(--spacing-lg); padding: var(--spacing-md); background: var(--color-bg-tertiary); border-radius: var(--radius-md);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--spacing-md);">
                  <div>
                    <h5 style="margin: 0 0 var(--spacing-xs) 0;">${item.contrato ? item.contrato.numero_contrato : 'N/A'}</h5>
                    <p style="margin: 0; color: var(--color-text-secondary); font-size: var(--font-size-sm);">
                      ${cliente ? cliente.nombre : 'N/A'}
                    </p>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: var(--font-size-2xl); font-weight: bold; color: var(--color-primary);">
                      ${item.total}
                    </div>
                    <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary);">
                      unidades
                    </div>
                  </div>
                </div>
                
                <div style="display: grid; gap: var(--spacing-sm);">
                  ${item.movimientos.map(mov => {
            let equipoInfo = '';
            if (mov.equipo_id) {
                const equipo = equipos.find(e => e.id === mov.equipo_id);
                const modelo = equipo ? modelos.find(m => m.id === equipo.modelo_id) : null;
                equipoInfo = ` → ${modelo ? modelo.nombre : 'N/A'} (${equipo ? equipo.numero_serie : 'N/A'})`;
            }

            return `
                      <div style="display: flex; justify-content: space-between; padding: var(--spacing-sm); background: var(--color-bg-secondary); border-radius: var(--radius-sm);">
                        <div style="flex: 1;">
                          <div style="font-size: var(--font-size-sm);">
                            ${formatDate(mov.fecha)} - ${mov.referencia}${equipoInfo}
                          </div>
                          ${mov.observaciones ? `
                            <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary); font-style: italic; margin-top: var(--spacing-xs);">
                              ${mov.observaciones}
                            </div>
                          ` : ''}
                        </div>
                        <div style="font-weight: bold; margin-left: var(--spacing-md);">
                          ${mov.cantidad} uds
                        </div>
                      </div>
                    `;
        }).join('')}
                </div>
              </div>
            `;
    }).join('')}
        </div>
      ` : `
        <div class="empty-state">
          <div class="empty-state-icon">📊</div>
          <div class="empty-state-title">Sin salidas registradas</div>
          <div class="empty-state-description">No hay movimientos de salida para este suministro</div>
        </div>
      `}
      
      <div class="detail-section">
        <h4 class="detail-section-title">Resumen</h4>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-md);">
          <div style="text-align: center; padding: var(--spacing-md); background: var(--color-bg-tertiary); border-radius: var(--radius-md);">
            <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary);">Contratos</div>
            <div style="font-size: var(--font-size-2xl); font-weight: bold; color: var(--color-info);">
              ${Object.keys(porContrato).length}
            </div>
          </div>
          <div style="text-align: center; padding: var(--spacing-md); background: var(--color-bg-tertiary); border-radius: var(--radius-md);">
            <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary);">Total Salidas</div>
            <div style="font-size: var(--font-size-2xl); font-weight: bold; color: var(--color-danger);">
              ${movimientos.reduce((sum, m) => sum + m.cantidad, 0)}
            </div>
          </div>
          <div style="text-align: center; padding: var(--spacing-md); background: var(--color-bg-tertiary); border-radius: var(--radius-md);">
            <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary);">Movimientos</div>
            <div style="font-size: var(--font-size-2xl); font-weight: bold;">
              ${movimientos.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

    const modal = createModal(
        `Reporte de Distribución - ${suministro.nombre}`,
        content,
        [
            {
                text: 'Cerrar',
                class: 'btn-secondary',
                onClick: () => closeModal(modal)
            },
            {
                text: 'Exportar PDF',
                class: 'btn-primary',
                onClick: () => {
                    showToast('Generando PDF...', 'info');
                    // Placeholder for PDF generation
                }
            }
        ]
    );

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
};

// Add general warehouse report by contract
App.prototype.loadReporteBodegaModule = function (container) {
    container.innerHTML = `
    <div class="module-container">
      <div class="module-header">
        <h2 class="module-title">Reporte de Bodega por Contrato</h2>
        <div class="module-actions">
          <button class="btn btn-primary" onclick="app.exportarReporteBodega()">
            <span>📊</span>
            <span>Exportar Reporte</span>
          </button>
        </div>
      </div>

      <div class="filters-container">
        <div class="filters-grid">
          <div class="form-group m-0">
            <label class="form-label">Contrato</label>
            <select class="form-select" id="filterContratoReporte" onchange="app.renderReporteBodega()">
              <option value="">Todos los contratos</option>
            </select>
          </div>
          <div class="form-group m-0">
            <label class="form-label">Desde</label>
            <input type="date" class="form-input" id="filterFechaDesdeReporte" onchange="app.renderReporteBodega()">
          </div>
          <div class="form-group m-0">
            <label class="form-label">Hasta</label>
            <input type="date" class="form-input" id="filterFechaHastaReporte" value="${getCurrentDate()}" onchange="app.renderReporteBodega()">
          </div>
        </div>
      </div>

      <div id="reporteBodegaContent"></div>
    </div>
  `;

    // Populate contract filter
    const contratos = db.getData('contratos');
    const filterContrato = document.getElementById('filterContratoReporte');
    if (filterContrato) {
        contratos.forEach(contrato => {
            const cliente = db.getById('clientes', contrato.cliente_id);
            const option = document.createElement('option');
            option.value = contrato.id;
            option.textContent = `${contrato.numero_contrato} - ${cliente ? cliente.nombre : 'N/A'}`;
            filterContrato.appendChild(option);
        });
    }

    this.renderReporteBodega();
};

App.prototype.renderReporteBodega = function () {
    const contratoId = document.getElementById('filterContratoReporte')?.value;
    const fechaDesde = document.getElementById('filterFechaDesdeReporte')?.value;
    const fechaHasta = document.getElementById('filterFechaHastaReporte')?.value;

    let movimientos = db.getData('movimientos_bodega').filter(m => m.tipo_movimiento === 'salida');

    // Apply filters
    if (contratoId) {
        movimientos = movimientos.filter(m => m.contrato_id === parseInt(contratoId));
    }
    if (fechaDesde) {
        movimientos = movimientos.filter(m => m.fecha >= fechaDesde);
    }
    if (fechaHasta) {
        movimientos = movimientos.filter(m => m.fecha <= fechaHasta);
    }

    const suministros = db.getData('suministros');
    const contratos = db.getData('contratos');
    const clientes = db.getData('clientes');

    // Group by contract and supply
    const porContrato = {};
    movimientos.forEach(mov => {
        if (mov.contrato_id) {
            if (!porContrato[mov.contrato_id]) {
                porContrato[mov.contrato_id] = {
                    contrato: contratos.find(c => c.id === mov.contrato_id),
                    suministros: {},
                    total: 0
                };
            }

            if (!porContrato[mov.contrato_id].suministros[mov.suministro_id]) {
                porContrato[mov.contrato_id].suministros[mov.suministro_id] = {
                    suministro: suministros.find(s => s.id === mov.suministro_id),
                    cantidad: 0,
                    movimientos: []
                };
            }

            porContrato[mov.contrato_id].suministros[mov.suministro_id].cantidad += mov.cantidad;
            porContrato[mov.contrato_id].suministros[mov.suministro_id].movimientos.push(mov);
            porContrato[mov.contrato_id].total += mov.cantidad;
        }
    });

    const content = document.getElementById('reporteBodegaContent');
    if (!content) return;

    if (Object.keys(porContrato).length === 0) {
        content.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📦</div>
        <div class="empty-state-title">No hay datos para mostrar</div>
        <div class="empty-state-description">No se encontraron movimientos con los filtros seleccionados</div>
      </div>
    `;
        return;
    }

    content.innerHTML = `
    <div style="display: grid; gap: var(--spacing-lg);">
      ${Object.values(porContrato).map(item => {
        const cliente = item.contrato ? clientes.find(c => c.id === item.contrato.cliente_id) : null;
        return `
          <div class="card">
            <div class="card-header">
              <div style="flex: 1;">
                <h3 class="card-title" style="margin: 0 0 var(--spacing-xs) 0;">
                  ${item.contrato ? item.contrato.numero_contrato : 'N/A'}
                </h3>
                <p style="margin: 0; color: var(--color-text-secondary);">
                  ${cliente ? cliente.nombre : 'N/A'}
                </p>
              </div>
              <div style="text-align: right;">
                <div style="font-size: var(--font-size-2xl); font-weight: bold; color: var(--color-primary);">
                  ${item.total}
                </div>
                <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary);">
                  unidades totales
                </div>
              </div>
            </div>
            <div class="card-body">
              <div class="table-container">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Suministro</th>
                      <th>Código</th>
                      <th>Cantidad</th>
                      <th>Movimientos</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${Object.values(item.suministros).map(s => `
                      <tr>
                        <td><strong>${s.suministro ? s.suministro.nombre : 'N/A'}</strong></td>
                        <td><code>${s.suministro ? s.suministro.codigo : 'N/A'}</code></td>
                        <td><strong>${s.cantidad}</strong> uds</td>
                        <td>${s.movimientos.length}</td>
                        <td>
                          <button class="btn btn-sm btn-ghost" onclick="app.viewMovimientosSuministro(${s.suministro.id})" title="Ver historial">
                            📊
                          </button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `;
    }).join('')}
    </div>
  `;
};

App.prototype.exportarReporteBodega = function () {
    showToast('Generando reporte de bodega...', 'info');
    // Placeholder for export functionality
};
