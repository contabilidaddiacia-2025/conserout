/**
 * CONSEROUT - Dashboard Logic
 * Handles dashboard data loading, metrics calculation, and chart rendering
 */

App.prototype.loadDashboardModule = function (container) {
    container.innerHTML = `
    <!-- Stats Cards -->
    <div class="dashboard-grid">
        <div class="stat-card hover-lift">
            <div class="stat-card-header">
                <div class="stat-card-title">Contratos Vigentes</div>
                <div class="stat-card-icon" style="background: rgba(34, 197, 94, 0.2); color: var(--color-success);">📄</div>
            </div>
            <div class="stat-card-value" id="contratosVigentes">0</div>
            <div class="stat-card-change positive">
                <span>↑</span>
                <span id="contratosChange">0% del total</span>
            </div>
        </div>

        <div class="stat-card hover-lift">
            <div class="stat-card-header">
                <div class="stat-card-title">Equipos Instalados</div>
                <div class="stat-card-icon" style="background: rgba(59, 130, 246, 0.2); color: var(--color-primary);">🖨️</div>
            </div>
            <div class="stat-card-value" id="equiposInstalados">0</div>
            <div class="stat-card-change">
                <span id="equiposSinInstalar">0</span>
                <span>sin instalar</span>
            </div>
        </div>

        <div class="stat-card hover-lift">
            <div class="stat-card-header">
                <div class="stat-card-title">Valor Cobrado</div>
                <div class="stat-card-icon" style="background: rgba(168, 85, 247, 0.2); color: var(--color-secondary);">💰</div>
            </div>
            <div class="stat-card-value" id="valorCobrado">$0</div>
            <div class="stat-card-change">
                <span id="valorPorCobrar">$0</span>
                <span>por cobrar</span>
            </div>
        </div>

        <div class="stat-card hover-lift">
            <div class="stat-card-header">
                <div class="stat-card-title">Servicios del Mes</div>
                <div class="stat-card-icon" style="background: rgba(251, 146, 60, 0.2); color: var(--color-warning);">🔧</div>
            </div>
            <div class="stat-card-value" id="serviciosMes">0</div>
            <div class="stat-card-change positive">
                <span>↑</span>
                <span id="serviciosChange">+0 este mes</span>
            </div>
        </div>
    </div>

    <!-- Charts -->
    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: var(--spacing-lg); margin-bottom: var(--spacing-xl);">
        <div class="chart-container">
            <div class="chart-header">
                <h3 class="chart-title">Consumo Mensual por Contrato</h3>
            </div>
            <canvas id="consumoChart"></canvas>
        </div>

        <div class="chart-container">
            <div class="chart-header">
                <h3 class="chart-title">Equipos por Marca</h3>
            </div>
            <canvas id="marcasChart"></canvas>
        </div>
    </div>

    <!-- Contratos Table -->
    <div class="card">
        <div class="card-header">
            <h3 class="card-title">Contratos Activos</h3>
            <button class="btn btn-primary btn-sm" onclick="app.loadModule('contratos')">
                <span>+</span>
                <span>Gestionar Contratos</span>
            </button>
        </div>
        <div class="table-container">
            <table class="table" id="contratosTable">
                <thead>
                    <tr>
                        <th>N° Contrato</th>
                        <th>Cliente</th>
                        <th>Fecha Inicio</th>
                        <th>Fecha Fin</th>
                        <th>Equipos</th>
                        <th>Valor Total</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="contratosTableBody">
                </tbody>
            </table>
        </div>
    </div>
  `;

    this.loadDashboardMetrics();
    this.loadContratosTable();
    this.initCharts();
};

App.prototype.loadDashboardMetrics = function () {
    // Contratos vigentes
    const contratos = db.getData('contratos') || [];
    const contratosVigentes = contratos.filter(c => c.estado === 'vigente');
    const el = document.getElementById('contratosVigentes');
    if (el) el.textContent = contratosVigentes.length;

    const totalContratos = contratos.length;
    const contratosPercentage = totalContratos > 0 ? ((contratosVigentes.length / totalContratos) * 100).toFixed(0) : 0;
    const elChange = document.getElementById('contratosChange');
    if (elChange) elChange.textContent = `${contratosPercentage}% del total`;

    // Equipos
    const equipos = db.getData('equipos') || [];
    const equiposInstalados = equipos.filter(e => e.estado === 'instalado');
    const equiposSinInstalar = equipos.filter(e => e.estado === 'sin_instalar');

    const elEqI = document.getElementById('equiposInstalados');
    if (elEqI) elEqI.textContent = equiposInstalados.length;
    const elEqS = document.getElementById('equiposSinInstalar');
    if (elEqS) elEqS.textContent = equiposSinInstalar.length;

    // Valores
    const valorTotal = contratos.reduce((sum, c) => sum + (c.valor_total || 0), 0);
    const valorCobrado = valorTotal * 0.65; // Simulado
    const valorPorCobrar = valorTotal - valorCobrado;

    const elValC = document.getElementById('valorCobrado');
    if (elValC) elValC.textContent = formatCurrency(valorCobrado);
    const elValP = document.getElementById('valorPorCobrar');
    if (elValP) elValP.textContent = formatCurrency(valorPorCobrar);

    // Servicios del mes
    const servicios = db.getData('servicios') || [];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const serviciosMes = servicios.filter(s => {
        const fecha = new Date(s.fecha);
        return fecha.getMonth() === currentMonth && fecha.getFullYear() === currentYear;
    });

    const elSerM = document.getElementById('serviciosMes');
    if (elSerM) elSerM.textContent = serviciosMes.length;
    const elSerC = document.getElementById('serviciosChange');
    if (elSerC) elSerC.textContent = `+${serviciosMes.length} este mes`;
};

App.prototype.loadContratosTable = function () {
    const contratos = db.getData('contratos') || [];
    const clientes = db.getData('clientes') || [];
    const equipos = db.getData('equipos') || [];

    const tbody = document.getElementById('contratosTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const contratosActivos = contratos.filter(c => c.estado === 'vigente');

    contratosActivos.forEach(contrato => {
        const cliente = clientes.find(c => c.id === contrato.cliente_id);
        const equiposContrato = equipos.filter(e => e.contrato_id === contrato.id);

        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td><strong>${contrato.numero_contrato}</strong></td>
      <td>${cliente ? cliente.nombre : '-'}</td>
      <td>${formatDate(contrato.fecha_inicio)}</td>
      <td>${formatDate(contrato.fecha_fin)}</td>
      <td>${equiposContrato.length}</td>
      <td>${formatCurrency(contrato.valor_total)}</td>
      <td>${getStatusBadge(contrato.estado)}</td>
      <td>
        <button class="btn btn-sm btn-ghost" onclick="app.viewContrato(${contrato.id})" title="Ver detalles">👁️</button>
      </td>
    `;
        tbody.appendChild(tr);
    });

    if (contratosActivos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No hay contratos activos</td></tr>`;
    }
};

App.prototype.initCharts = function () {
    const consumoEl = document.getElementById('consumoChart');
    if (!consumoEl) return;

    const consumoCtx = consumoEl.getContext('2d');
    const contratos = (db.getData('contratos') || []).filter(c => c.estado === 'vigente');
    const clientes = db.getData('clientes') || [];

    const months = ['Julio', 'Agosto', 'Sept', 'Octubre', 'Nov', 'Dic'];
    const datasets = contratos.slice(0, 3).map((contrato, idx) => {
        const cliente = clientes.find(c => c.id === contrato.cliente_id);
        const colors = ['rgba(59, 130, 246, 0.8)', 'rgba(168, 85, 247, 0.8)', 'rgba(34, 197, 94, 0.8)'];

        return {
            label: cliente ? cliente.nombre : contrato.numero_contrato,
            data: Array(6).fill(0).map(() => Math.floor(Math.random() * 5000) + 2000),
            borderColor: colors[idx],
            backgroundColor: colors[idx].replace('0.8', '0.2'),
            tension: 0.4,
            fill: true
        };
    });

    new Chart(consumoCtx, {
        type: 'line',
        data: { labels: months, datasets: datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: 'rgba(255, 255, 255, 0.7)', font: { size: 12 } } } },
            scales: {
                y: { grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: 'rgba(255, 255, 255, 0.7)' } },
                x: { grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: 'rgba(255, 255, 255, 0.7)' } }
            }
        }
    });

    const marcasEl = document.getElementById('marcasChart');
    if (!marcasEl) return;

    const marcasCtx = marcasEl.getContext('2d');
    const equipos = db.getData('equipos') || [];
    const modelos = db.getData('modelos') || [];
    const marcas = db.getData('marcas') || [];

    const marcaCount = {};
    equipos.forEach(equipo => {
        const modelo = modelos.find(m => m.id === equipo.modelo_id);
        if (modelo) {
            const marca = marcas.find(m => m.id === modelo.marca_id);
            if (marca) marcaCount[marca.nombre] = (marcaCount[marca.nombre] || 0) + 1;
        }
    });

    new Chart(marcasCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(marcaCount),
            datasets: [{
                data: Object.values(marcaCount),
                backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(168, 85, 247, 0.8)', 'rgba(34, 197, 94, 0.8)'],
                borderWidth: 2, borderColor: 'rgba(0, 0, 0, 0.2)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: 'rgba(255, 255, 255, 0.7)', font: { size: 11 } } } }
        }
    });
};

