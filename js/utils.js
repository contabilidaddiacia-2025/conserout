/**
 * CONSEROUT - Utility Functions
 * Common helper functions used throughout the application
 */

/**
 * Format date to DD/MM/YYYY
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    // Parse strings YYYY-MM-DD manually to avoid timezone issues
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateString)) {
        const [year, month, day] = dateString.substring(0, 10).split('-');
        return `${day}/${month}/${year}`;
    }
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Format date to YYYY-MM-DD (for input fields)
 */
function formatDateInput(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Get current date in YYYY-MM-DD format (Local Time)
 */
function getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Format currency (Chilean Peso)
 */
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '$0';

    // For unitary rates (like $0.15), we need decimals. 
    // CLP standard is 0 decimals, so we override if amount has decimals or is less than 1
    const hasDecimals = amount % 1 !== 0;
    const isSmall = Math.abs(amount) < 1 && amount !== 0;

    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: (hasDecimals || isSmall) ? 2 : 0,
        maximumFractionDigits: 4
    }).format(amount);
}

/**
 * Format number with thousand separators
 */
function formatNumber(number) {
    if (number === null || number === undefined) return '0';
    return new Intl.NumberFormat('es-CL').format(number);
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container') || createToastContainer();

    const toast = document.createElement('div');
    toast.className = `toast alert alert-${type}`;
    toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.5rem;">
      <span>${getIconForType(type)}</span>
      <span>${message}</span>
    </div>
  `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Create toast container if it doesn't exist
 */
function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

/**
 * Get icon for toast type
 */
function getIconForType(type) {
    const icons = {
        success: '✓',
        danger: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    return icons[type] || icons.info;
}

/**
 * Show confirmation dialog
 */
function showConfirm(title, message, onConfirm) {
    const modal = createModal(title, message, [
        {
            text: 'Cancelar',
            class: 'btn-secondary',
            onClick: () => closeModal(modal)
        },
        {
            text: 'Confirmar',
            class: 'btn-primary',
            onClick: () => {
                onConfirm();
                closeModal(modal);
            }
        }
    ]);

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
}

/**
 * Create modal
 */
function createModal(title, content, buttons = []) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    // Assign a unique ID to the backdrop for easier tracking
    backdrop.id = 'modal-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    const modal = document.createElement('div');
    modal.className = 'modal';

    modal.innerHTML = `
    <div class="modal-header">
      <h3 class="modal-title">${title}</h3>
      <button class="modal-close" onclick="this.closest('.modal-backdrop').remove()">×</button>
    </div>
    <div class="modal-body">
      ${content}
    </div>
    ${buttons.length > 0 ? `
      <div class="modal-footer">
        ${buttons.map((btn, idx) => `
          <button class="btn ${btn.class}" data-btn-index="${idx}">${btn.text}</button>
        `).join('')}
      </div>
    ` : ''}
  `;

    // Add button event listeners
    buttons.forEach((btn, idx) => {
        const btnElement = modal.querySelector(`[data-btn-index="${idx}"]`);
        if (btnElement && btn.onClick) {
            btnElement.addEventListener('click', btn.onClick);
        }
    });

    backdrop.appendChild(modal);
    return backdrop;
}

/**
 * Close modal
 */
function closeModal(element) {
    if (!element) return;

    // If we're passing an inner element, find the backdrop
    const modalToClose = element.classList.contains('modal-backdrop')
        ? element
        : element.closest('.modal-backdrop');

    if (modalToClose) {
        modalToClose.classList.remove('active');
        setTimeout(() => modalToClose.remove(), 300);
    }
}

/**
 * Validate email
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Validate RUT (Chilean ID)
 */
function validateRUT(rut) {
    // Remove dots and hyphens
    rut = rut.replace(/\./g, '').replace(/-/g, '');

    if (rut.length < 2) return false;

    const body = rut.slice(0, -1);
    const dv = rut.slice(-1).toUpperCase();

    let sum = 0;
    let multiplier = 2;

    for (let i = body.length - 1; i >= 0; i--) {
        sum += parseInt(body[i]) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const expectedDV = 11 - (sum % 11);
    const calculatedDV = expectedDV === 11 ? '0' : expectedDV === 10 ? 'K' : String(expectedDV);

    return dv === calculatedDV;
}

/**
 * Format RUT
 */
function formatRUT(rut) {
    // Remove all non-alphanumeric characters
    rut = rut.replace(/[^0-9kK]/g, '');

    if (rut.length <= 1) return rut;

    const body = rut.slice(0, -1);
    const dv = rut.slice(-1);

    // Add dots
    const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return `${formattedBody}-${dv}`;
}

/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Get status badge HTML
 */
function getStatusBadge(status) {
    const badges = {
        'activo': '<span class="badge badge-success">Activo</span>',
        'pasivo': '<span class="badge badge-neutral">Pasivo</span>',
        'vigente': '<span class="badge badge-success">Vigente</span>',
        'cerrado': '<span class="badge badge-neutral">Cerrado</span>',
        'instalado': '<span class="badge badge-success">Instalado</span>',
        'sin_instalar': '<span class="badge badge-warning">Sin Instalar</span>',
        'bodega': '<span class="badge badge-info">Bodega</span>',
        'pendiente': '<span class="badge badge-warning">Pendiente</span>',
        'completado': '<span class="badge badge-success">Completado</span>',
        'cancelado': '<span class="badge badge-danger">Cancelado</span>',
        'baja': '<span class="badge badge-error">Baja (Retirado)</span>'
    };

    return badges[status] || `<span class="badge badge-neutral">${status}</span>`;
}

/**
 * Generate PDF (placeholder - requires library like jsPDF)
 */
function generatePDF(title, content) {
    showToast('Generando PDF...', 'info');
    // TODO: Implement PDF generation with jsPDF
    console.log('PDF Generation:', { title, content });
}

/**
 * Export to Excel (placeholder - requires library like SheetJS)
 */
function exportToExcel(data, filename) {
    showToast('Exportando a Excel...', 'info');
    // TODO: Implement Excel export with SheetJS
    console.log('Excel Export:', { data, filename });
}

/**
 * Calculate percentage
 */
function calculatePercentage(value, total) {
    if (total === 0) return 0;
    return ((value / total) * 100).toFixed(1);
}

/**
 * Get month name in Spanish
 */
function getMonthName(monthNumber) {
    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[monthNumber - 1] || '';
}

/**
 * Get relative time (e.g., "hace 2 horas")
 */
function getRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return formatDate(dateString);
}

/**
 * Sanitize HTML to prevent XSS
 */
function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Copy to clipboard
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copiado al portapapeles', 'success');
    } catch (err) {
        showToast('Error al copiar', 'danger');
    }
}

/**
 * Download file
 */
function downloadFile(content, filename, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Format number with thousands separator
 */
function formatNumber(value) {
    if (value === null || value === undefined) return '0';
    return new Intl.NumberFormat('es-CL').format(value);
}
