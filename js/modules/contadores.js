/**
 * CONSEROUT - Counter Tracking Module
 * Critical module for monthly equipment counter registration and consumption tracking
 */

// Extend App class with counter module
App.prototype.loadContadoresModule = function (container) {
    container.innerHTML = `
    <div class="module-container">
      <div class="module-header">
        <h2 class="module-title">Registro de Contadores</h2>
        <div class="module-actions">
          <button class="btn btn-primary" onclick="app.showRegistroContadoresForm()">
            <span>+</span>
            <span>Registrar Contadores</span>
          </button>
        </div>
      </div>

      <div class="info-box">
        <div class="info-box-icon">ℹ️</div>
        <div class="info-box-content">
          <div class="info-box-title">Sistema de Contadores</div>
          <p style="margin: 0;">Registre los contadores mensuales de los equipos. El sistema calculará automáticamente el consumo (contador actual - contador anterior).</p>
        </div>
      </div>

      <div class="filters-container">
        <div class="filters-grid">
          <div class="form-group m-0">
            <label class="form-label">Contrato</label>
            <select class="form-select" id="filterContratoContadores">
              <option value="">Todos los contratos</option>
            </select>
          </div>
          <div class="form-group m-0">
            <label class="form-label">Mes/Año</label>
            <input type="month" class="form-input" id="filterMesContadores" value="${getCurrentYearMonth()}">
          </div>
          <div class="form-group m-0">
            <label class="form-label">Estado Equipo</label>
            <select class="form-select" id="filterEstadoEquipo">
              <option value="">Todos</option>
              <option value="instalado" selected>Instalados</option>
              <option value="sin_instalar">Sin Instalar</option>
            </select>
          </div>
          <div style="display: flex; align-items: end;">
            <button class="btn btn-secondary w-full" onclick="app.renderContadoresTable()">
              <span>🔍</span>
              <span>Filtrar</span>
            </button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Equipos y Contadores</h3>
          <div style="display: flex; gap: var(--spacing-sm);">
            <button class="btn btn-sm btn-secondary" onclick="app.exportContadores()">
              <span>📊</span>
              <span>Exportar</span>
            </button>
          </div>
        </div>
        <div class="table-container">
          <table class="table" id="contadoresTable">
            <thead>
              <tr>
                <th>Equipo</th>
                <th>Marca/Modelo</th>
                <th>N° Serie</th>
                <th>Contrato</th>
                <th>Ubicación</th>
                <th>Contador Anterior</th>
                <th>Contador Actual</th>
                <th>Consumo</th>
                <th>Última Lectura</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="contadoresTableBody">
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

    this.renderContadoresTable();
    this.setupContadoresFilters();
};

App.prototype.renderContadoresTable = function () {
    const equipos = db.getData('equipos');
    const modelos = db.getData('modelos');
    const marcas = db.getData('marcas');
    const contratos = db.getData('contratos');
    const contadores = db.getData('contadores_equipos');

    const tbody = document.getElementById('contadoresTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Populate contract filter
    const filterContrato = document.getElementById('filterContratoContadores');
    if (filterContrato && filterContrato.options.length === 1) {
        contratos.filter(c => c.estado === 'vigente').forEach(contrato => {
            const option = document.createElement('option');
            option.value = contrato.id;
            option.textContent = contrato.numero_contrato;
            filterContrato.appendChild(option);
        });
    }

    // Get filter values
    const contratoFilter = document.getElementById('filterContratoContadores')?.value || '';
    const estadoFilter = document.getElementById('filterEstadoEquipo')?.value || '';

    // Filter equipos
    let filteredEquipos = equipos;
    if (contratoFilter) {
        filteredEquipos = filteredEquipos.filter(e => e.contrato_id === parseInt(contratoFilter));
    }
    if (estadoFilter) {
        filteredEquipos = filteredEquipos.filter(e => e.estado === estadoFilter);
    }

    filteredEquipos.forEach(equipo => {
        const modelo = modelos.find(m => m.id === equipo.modelo_id);
        const marca = modelo ? marcas.find(m => m.id === modelo.marca_id) : null;
        const contrato = contratos.find(c => c.id === equipo.contrato_id);

        // Get latest counter for this equipment
        const equipoContadores = contadores.filter(c => c.equipo_id === equipo.id)
            .sort((a, b) => new Date(b.fecha_lectura) - new Date(a.fecha_lectura));

        const ultimoContador = equipoContadores[0];
        const contadorAnterior = equipoContadores[1];

        const contadorActual = ultimoContador ? ultimoContador.contador_actual : 0;
        const contadorPrevio = contadorAnterior ? contadorAnterior.contador_actual : 0;
        const consumo = ultimoContador ? ultimoContador.consumo : 0;
        const ultimaLectura = ultimoContador ? ultimoContador.fecha_lectura : '-';

        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>
        <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
          <span style="font-size: var(--font-size-xl);">🖨️</span>
          <div>
            <strong>${modelo ? modelo.nombre : 'N/A'}</strong>
            <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary);">
              ${getStatusBadge(equipo.estado)}
            </div>
          </div>
        </div>
      </td>
      <td>${marca ? marca.nombre : '-'} / ${modelo ? modelo.nombre : '-'}</td>
      <td><code style="font-size: var(--font-size-xs);">${equipo.numero_serie}</code></td>
      <td>${contrato ? contrato.numero_contrato : '-'}</td>
      <td>${equipo.ubicacion || '-'}</td>
      <td>
        <div class="counter-display" style="min-width: 100px; padding: var(--spacing-sm);">
          <div class="counter-value" style="font-size: var(--font-size-lg);">${formatNumber(contadorPrevio)}</div>
        </div>
      </td>
      <td>
        <div class="counter-display" style="min-width: 100px; padding: var(--spacing-sm); border-color: var(--color-primary);">
          <div class="counter-value" style="font-size: var(--font-size-lg);">${formatNumber(contadorActual)}</div>
        </div>
      </td>
      <td>
        <div style="text-align: center;">
          <div style="font-size: var(--font-size-xl); font-weight: bold; color: ${consumo > 0 ? 'var(--color-success)' : 'var(--color-text-tertiary)'};">
            ${formatNumber(consumo)}
          </div>
          <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary);">páginas</div>
        </div>
      </td>
      <td>${formatDate(ultimaLectura)}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-sm btn-primary" onclick="app.registrarContador(${equipo.id})" title="Registrar">
            <span>+</span>
          </button>
          <button class="btn btn-sm btn-ghost" onclick="app.verHistorialContadores(${equipo.id})" title="Historial">
            📊
          </button>
        </div>
      </td>
    `;
        tbody.appendChild(tr);
    });

    if (filteredEquipos.length === 0) {
        tbody.innerHTML = `
      <tr>
        <td colspan="10" class="empty-state">
          <div class="empty-state-icon">🖨️</div>
          <div class="empty-state-title">No hay equipos para mostrar</div>
          <div class="empty-state-description">Ajusta los filtros o agrega equipos al contrato</div>
        </td>
      </tr>
    `;
    }
};

App.prototype.setupContadoresFilters = function () {
    const filterContrato = document.getElementById('filterContratoContadores');
    const filterMes = document.getElementById('filterMesContadores');
    const filterEstado = document.getElementById('filterEstadoEquipo');

    filterContrato?.addEventListener('change', () => this.renderContadoresTable());
    filterEstado?.addEventListener('change', () => this.renderContadoresTable());
};

App.prototype.registrarContador = function (equipoId) {
    const equipo = db.getById('equipos', equipoId);
    const modelo = db.getById('modelos', equipo.modelo_id);
    const contadores = db.getData('contadores_equipos');

    // Get latest counter
    const equipoContadores = contadores.filter(c => c.equipo_id === equipoId)
        .sort((a, b) => new Date(b.fecha_lectura) - new Date(a.fecha_lectura));

    const ultimoContador = equipoContadores[0];
    const contadorAnterior = ultimoContador ? ultimoContador.contador_actual : 0;

    const formHTML = `
    <form id="contadorForm">
      <div class="info-box" style="margin-bottom: var(--spacing-lg);">
        <div class="info-box-icon">🖨️</div>
        <div class="info-box-content">
          <div class="info-box-title">${modelo.nombre}</div>
          <p style="margin: 0; font-size: var(--font-size-sm);">
            <strong>N° Serie:</strong> ${equipo.numero_serie}<br>
            <strong>Ubicación:</strong> ${equipo.ubicacion || 'N/A'}
          </p>
        </div>
      </div>
      
      <div class="counter-input-group" style="justify-content: center; margin-bottom: var(--spacing-lg);">
        <div class="counter-display">
          <div class="counter-label">Contador Anterior</div>
          <div class="counter-value">${formatNumber(contadorAnterior)}</div>
        </div>
        <div style="font-size: var(--font-size-2xl); color: var(--color-text-tertiary);">→</div>
        <div class="counter-display" style="border-color: var(--color-primary);">
          <div class="counter-label">Contador Actual</div>
          <div class="counter-value" id="contadorActualDisplay">0</div>
        </div>
      </div>
      
      <div class="form-group">
        <label class="form-label required">Contador Actual</label>
        <input 
          type="number" 
          class="form-input" 
          name="contador_actual" 
          min="${contadorAnterior}"
          value="${contadorAnterior}"
          required
          style="font-size: var(--font-size-xl); font-weight: bold; text-align: center;"
          oninput="document.getElementById('contadorActualDisplay').textContent = formatNumber(this.value); document.getElementById('consumoDisplay').textContent = formatNumber(Math.max(0, this.value - ${contadorAnterior}));"
        >
        <span class="form-help">El contador debe ser mayor o igual al anterior (${formatNumber(contadorAnterior)})</span>
      </div>
      
      <div class="form-group">
        <label class="form-label required">Fecha de Lectura</label>
        <input type="date" class="form-input" name="fecha_lectura" value="${getCurrentDate()}" required>
      </div>
      
      <div class="alert alert-info">
        <span>📊</span>
        <div>
          <strong>Consumo calculado:</strong> <span id="consumoDisplay" style="font-size: var(--font-size-lg); font-weight: bold;">0</span> páginas
        </div>
      </div>
      
      <input type="hidden" name="equipo_id" value="${equipoId}">
      <input type="hidden" name="contador_anterior" value="${contadorAnterior}">
    </form>
  `;

    const modal = createModal(
        'Registrar Contador',
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
                onClick: () => this.saveContador(modal)
            }
        ]
    );

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
};

App.prototype.saveContador = function (modal) {
    const form = document.getElementById('contadorForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    const contadorActual = parseInt(formData.get('contador_actual'));
    const contadorAnterior = parseInt(formData.get('contador_anterior'));
    const consumo = Math.max(0, contadorActual - contadorAnterior);

    const data = {
        equipo_id: parseInt(formData.get('equipo_id')),
        fecha_lectura: formData.get('fecha_lectura'),
        contador_actual: contadorActual,
        contador_anterior: contadorAnterior,
        consumo: consumo,
        usuario_registro_id: auth.getCurrentUser().id
    };

    db.insert('contadores_equipos', data);
    showToast(`Contador registrado exitosamente. Consumo: ${formatNumber(consumo)} páginas`, 'success');

    closeModal(modal);
    this.renderContadoresTable();
};

App.prototype.verHistorialContadores = function (equipoId) {
    const equipo = db.getById('equipos', equipoId);
    const modelo = db.getById('modelos', equipo.modelo_id);
    const marca = db.getById('marcas', modelo.marca_id);
    const contadores = db.getData('contadores_equipos')
        .filter(c => c.equipo_id === equipoId)
        .sort((a, b) => new Date(b.fecha_lectura) - new Date(a.fecha_lectura));

    const totalConsumo = contadores.reduce((sum, c) => sum + c.consumo, 0);

    const content = `
    <div style="display: grid; gap: var(--spacing-lg);">
      <div class="detail-section">
        <h4 class="detail-section-title">Información del Equipo</h4>
        <div class="detail-row">
          <div class="detail-label">Marca/Modelo:</div>
          <div class="detail-value">${marca.nombre} ${modelo.nombre}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">N° Serie:</div>
          <div class="detail-value">${equipo.numero_serie}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Ubicación:</div>
          <div class="detail-value">${equipo.ubicacion || 'N/A'}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Consumo Total:</div>
          <div class="detail-value"><strong>${formatNumber(totalConsumo)}</strong> páginas</div>
        </div>
      </div>
      
      <div class="detail-section">
        <h4 class="detail-section-title">Historial de Lecturas</h4>
        <div class="timeline">
          ${contadores.map(contador => `
            <div class="timeline-item">
              <div class="timeline-date">${formatDate(contador.fecha_lectura)}</div>
              <div class="timeline-content">
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-md); text-align: center;">
                  <div>
                    <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary);">Contador</div>
                    <div style="font-size: var(--font-size-lg); font-weight: bold;">${formatNumber(contador.contador_actual)}</div>
                  </div>
                  <div>
                    <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary);">Anterior</div>
                    <div style="font-size: var(--font-size-lg);">${formatNumber(contador.contador_anterior)}</div>
                  </div>
                  <div>
                    <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary);">Consumo</div>
                    <div style="font-size: var(--font-size-lg); font-weight: bold; color: var(--color-success);">
                      +${formatNumber(contador.consumo)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        
        ${contadores.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">📊</div>
            <div class="empty-state-title">Sin registros</div>
            <div class="empty-state-description">No hay lecturas registradas para este equipo</div>
          </div>
        ` : ''}
      </div>
    </div>
  `;

    const modal = createModal('Historial de Contadores', content, [
        {
            text: 'Cerrar',
            class: 'btn-secondary',
            onClick: () => closeModal(modal)
        },
        {
            text: 'Nuevo Registro',
            class: 'btn-primary',
            onClick: () => {
                closeModal(modal);
                this.registrarContador(equipoId);
            }
        }
    ]);

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
};

App.prototype.showRegistroContadoresForm = function () {
    const contratos = db.getData('contratos').filter(c => c.estado === 'vigente');

    const formHTML = `
    <form id="registroMasivoForm">
      <div class="info-box" style="margin-bottom: var(--spacing-lg);">
        <div class="info-box-icon">ℹ️</div>
        <div class="info-box-content">
          <div class="info-box-title">Registro Masivo</div>
          <p style="margin: 0;">Seleccione un contrato para registrar contadores de múltiples equipos a la vez.</p>
        </div>
      </div>
      
      <div class="form-group">
        <label class="form-label required">Contrato</label>
        <select class="form-select" name="contrato_id" required onchange="app.loadEquiposForMasivo(this.value)">
          <option value="">Seleccione un contrato</option>
          ${contratos.map(c => `<option value="${c.id}">${c.numero_contrato}</option>`).join('')}
        </select>
      </div>
      
      <div id="equiposListContainer" style="display: none;">
        <div class="form-group">
          <label class="form-label required">Fecha de Lectura</label>
          <input type="date" class="form-input" name="fecha_lectura" value="${getCurrentDate()}" required>
        </div>
        
        <div class="form-group">
          <label class="form-label">Equipos del Contrato</label>
          <div id="equiposList" style="max-height: 400px; overflow-y: auto;">
            <!-- Equipos loaded dynamically -->
          </div>
        </div>
      </div>
    </form>
  `;

    const modal = createModal(
        'Registro Masivo de Contadores',
        formHTML,
        [
            {
                text: 'Cancelar',
                class: 'btn-secondary',
                onClick: () => closeModal(modal)
            }
        ]
    );

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
};

App.prototype.loadEquiposForMasivo = function (contratoId) {
    if (!contratoId) {
        document.getElementById('equiposListContainer').style.display = 'none';
        return;
    }

    const equipos = db.getBy('equipos', 'contrato_id', parseInt(contratoId))
        .filter(e => e.estado === 'instalado');
    const modelos = db.getData('modelos');
    const marcas = db.getData('marcas');

    const container = document.getElementById('equiposList');
    container.innerHTML = '';

    equipos.forEach(equipo => {
        const modelo = modelos.find(m => m.id === equipo.modelo_id);
        const marca = modelo ? marcas.find(m => m.id === modelo.marca_id) : null;

        const div = document.createElement('div');
        div.className = 'equipment-card';
        div.innerHTML = `
      <div class="equipment-header">
        <div class="equipment-info">
          <h4>${modelo ? modelo.nombre : 'N/A'}</h4>
          <p>${marca ? marca.nombre : '-'} • ${equipo.numero_serie}</p>
        </div>
      </div>
      <div class="form-group m-0">
        <label class="form-label">Contador Actual</label>
        <input type="number" class="form-input" data-equipo-id="${equipo.id}" min="0" placeholder="Ingrese contador">
      </div>
    `;
        container.appendChild(div);
    });

    document.getElementById('equiposListContainer').style.display = 'block';
};

App.prototype.exportContadores = function () {
    showToast('Exportación de contadores en desarrollo', 'info');
};

// Helper function to get current year-month
function getCurrentYearMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}
