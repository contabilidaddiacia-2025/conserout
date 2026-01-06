/**
 * CONSEROUT - Dashboard Logic
 * Handles dashboard data loading, metrics calculation, and chart rendering
 */

// Check authentication
if (!auth.requireAuth()) {
    // Will redirect to login
}

// Load user info
function loadUserInfo() {
    const user = auth.getCurrentUser();
    if (user) {
        const initials = user.nombre.split(' ').map(n => n[0]).join('').substring(0, 2);
        document.getElementById('userAvatar').textContent = initials;
        document.getElementById('userName').textContent = user.nombre;
        document.getElementById('userRole').textContent = user.perfil.nombre;
    }
}

// Load dashboard metrics
function loadDashboardMetrics() {
    // Contratos vigentes
    const contratos = db.getData('contratos');
    const contratosVigentes = contratos.filter(c => c.estado === 'vigente');
    document.getElementById('contratosVigentes').textContent = contratosVigentes.length;

    const contratosCerrados = contratos.filter(c => c.estado === 'cerrado').length;
    const totalContratos = contratos.length;
    const contratosPercentage = totalContratos > 0 ? ((contratosVigentes.length / totalContratos) * 100).toFixed(0) : 0;
    document.getElementById('contratosChange').textContent = `${contratosPercentage}% del total`;

    // Equipos
    const equipos = db.getData('equipos');
    const equiposInstalados = equipos.filter(e => e.estado === 'instalado');
    const equiposSinInstalar = equipos.filter(e => e.estado === 'sin_instalar');

    document.getElementById('equiposInstalados').textContent = equiposInstalados.length;
    document.getElementById('equiposSinInstalar').textContent = equiposSinInstalar.length;

    // Valores (simulado - en producción vendría de tabla cobros)
    const valorTotal = contratos.reduce((sum, c) => sum + (c.valor_total || 0), 0);
    const valorCobrado = valorTotal * 0.65; // 65% cobrado (simulado)
    const valorPorCobrar = valorTotal - valorCobrado;

    document.getElementById('valorCobrado').textContent = formatCurrency(valorCobrado);
    document.getElementById('valorPorCobrar').textContent = formatCurrency(valorPorCobrar);

    // Servicios del mes
    const servicios = db.getData('servicios');
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const serviciosMes = servicios.filter(s => {
        const fecha = new Date(s.fecha);
        return fecha.getMonth() === currentMonth && fecha.getFullYear() === currentYear;
    });

    document.getElementById('serviciosMes').textContent = serviciosMes.length;
    document.getElementById('serviciosChange').textContent = `+${serviciosMes.length} este mes`;
}

// Load contratos table
function loadContratosTable() {
    const contratos = db.getData('contratos');
    const clientes = db.getData('clientes');
    const equipos = db.getData('equipos');

    const tbody = document.getElementById('contratosTableBody');
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
        <button class="btn btn-sm btn-ghost" onclick="viewContrato(${contrato.id})" title="Ver detalles">
          👁️
        </button>
        <button class="btn btn-sm btn-ghost" onclick="editContrato(${contrato.id})" title="Editar">
          ✏️
        </button>
      </td>
    `;
        tbody.appendChild(tr);
    });

    if (contratosActivos.length === 0) {
        tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: var(--spacing-xl); color: var(--color-text-tertiary);">
          No hay contratos activos
        </td>
      </tr>
    `;
    }
}

// Initialize charts
let consumoChart = null;
let marcasChart = null;

function initCharts() {
    // Consumo mensual chart
    const consumoCtx = document.getElementById('consumoChart').getContext('2d');
    const contratos = db.getData('contratos').filter(c => c.estado === 'vigente');
    const clientes = db.getData('clientes');

    // Get last 6 months of data (simulated)
    const months = ['Julio', 'Agosto', 'Sept', 'Octubre', 'Nov', 'Dic'];
    const datasets = contratos.slice(0, 3).map((contrato, idx) => {
        const cliente = clientes.find(c => c.id === contrato.cliente_id);
        const colors = [
            'rgba(59, 130, 246, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(34, 197, 94, 0.8)'
        ];

        return {
            label: cliente ? cliente.nombre : contrato.numero_contrato,
            data: Array(6).fill(0).map(() => Math.floor(Math.random() * 5000) + 2000),
            borderColor: colors[idx],
            backgroundColor: colors[idx].replace('0.8', '0.2'),
            tension: 0.4,
            fill: true
        };
    });

    consumoChart = new Chart(consumoCtx, {
        type: 'line',
        data: {
            labels: months,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    }
                }
            }
        }
    });

    // Marcas chart
    const marcasCtx = document.getElementById('marcasChart').getContext('2d');
    const equipos = db.getData('equipos');
    const modelos = db.getData('modelos');
    const marcas = db.getData('marcas');

    // Count equipos by marca
    const marcaCount = {};
    equipos.forEach(equipo => {
        const modelo = modelos.find(m => m.id === equipo.modelo_id);
        if (modelo) {
            const marca = marcas.find(m => m.id === modelo.marca_id);
            if (marca) {
                marcaCount[marca.nombre] = (marcaCount[marca.nombre] || 0) + 1;
            }
        }
    });

    const marcaLabels = Object.keys(marcaCount);
    const marcaData = Object.values(marcaCount);
    const marcaColors = [
        'rgba(59, 130, 246, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(251, 146, 60, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(14, 165, 233, 0.8)'
    ];

    marcasChart = new Chart(marcasCtx, {
        type: 'doughnut',
        data: {
            labels: marcaLabels,
            datasets: [{
                data: marcaData,
                backgroundColor: marcaColors,
                borderWidth: 2,
                borderColor: 'rgba(0, 0, 0, 0.2)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        padding: 10,
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });
}

// View contrato details
function viewContrato(id) {
    const contrato = db.getById('contratos', id);
    const cliente = db.getById('clientes', contrato.cliente_id);
    const equipos = db.getBy('equipos', 'contrato_id', id);

    const content = `
    <div style="display: grid; gap: var(--spacing-md);">
      <div>
        <strong>Cliente:</strong> ${cliente.nombre}<br>
        <strong>N° Contrato:</strong> ${contrato.numero_contrato}<br>
        <strong>Período:</strong> ${formatDate(contrato.fecha_inicio)} - ${formatDate(contrato.fecha_fin)}<br>
        <strong>Valor Total:</strong> ${formatCurrency(contrato.valor_total)}
      </div>
      <div>
        <strong>Descripción:</strong><br>
        ${contrato.descripcion}
      </div>
      <div>
        <strong>Equipos:</strong> ${equipos.length} equipos asignados
      </div>
    </div>
  `;

    const modal = createModal('Detalles del Contrato', content, [
        {
            text: 'Cerrar',
            class: 'btn-secondary',
            onClick: () => closeModal(modal)
        }
    ]);

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
}

// Edit contrato (placeholder)
function editContrato(id) {
    showToast('Función de edición en desarrollo', 'info');
}

// Logout handler
document.getElementById('logoutBtn').addEventListener('click', () => {
    showConfirm(
        'Cerrar Sesión',
        '¿Estás seguro que deseas cerrar sesión?',
        () => {
            auth.logout();
        }
    );
});

// User profile dropdown
document.getElementById('userProfile').addEventListener('click', () => {
    const dropdown = document.createElement('div');
    dropdown.className = 'dropdown-menu active';
    dropdown.style.position = 'absolute';
    dropdown.style.bottom = '60px';
    dropdown.style.left = '10px';
    dropdown.innerHTML = `
    <div class="dropdown-item" onclick="showToast('Perfil en desarrollo', 'info')">
      <span>👤</span>
      <span>Mi Perfil</span>
    </div>
    <div class="dropdown-item" onclick="showToast('Configuración en desarrollo', 'info')">
      <span>⚙️</span>
      <span>Configuración</span>
    </div>
    <div class="dropdown-divider"></div>
    <div class="dropdown-item" onclick="auth.logout()">
      <span>🚪</span>
      <span>Cerrar Sesión</span>
    </div>
  `;

    document.querySelector('.sidebar-footer').appendChild(dropdown);

    // Close on click outside
    setTimeout(() => {
        document.addEventListener('click', function closeDropdown(e) {
            if (!dropdown.contains(e.target) && !document.getElementById('userProfile').contains(e.target)) {
                dropdown.remove();
                document.removeEventListener('click', closeDropdown);
            }
        });
    }, 100);
});

// Module navigation
document.querySelectorAll('[data-module]').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const module = item.getAttribute('data-module');
        showToast(`Módulo "${module}" en desarrollo`, 'info');
    });
});

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    loadUserInfo();
    loadDashboardMetrics();
    loadContratosTable();
    initCharts();

    showToast('Bienvenido a CONSEROUT', 'success');
});
