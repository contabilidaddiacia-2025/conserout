/**
 * CONSEROUT - Permission System
 * Role-based access control for menu items
 */

// Menu permissions configuration
const MENU_PERMISSIONS = {
    // Nivel 1: Mantenimiento (Solo Admin)
    'equipos': ['Administrador'],
    'usuarios': ['Administrador'],
    'departamentos': ['Administrador'],
    'tipos-equipo': ['Administrador'],
    'marcas': ['Administrador'],

    // Nivel 2: Operación
    'clientes': ['Administrador', 'Gestor'],
    'contratos': ['Administrador', 'Gestor'],
    'equipos-gestion': ['Administrador', 'Gestor'],
    'bodega': ['Administrador', 'Gestor'],
    'cobros': ['Administrador', 'Gestor'],

    // Nivel 3: Servicios
    'contadores': ['Administrador', 'Gestor', 'Técnico'],
    'cambio-consumibles': ['Administrador', 'Gestor', 'Técnico'],
    'instalaciones': ['Administrador', 'Gestor', 'Técnico'],
    'mantenimientos': ['Administrador', 'Gestor', 'Técnico'],

    // Nivel 4: Reportería
    'reportes': ['Administrador', 'Gestor'],

    // Nivel 5: Notificaciones
    'notificaciones': ['Administrador', 'Gestor', 'Técnico'],

    // Dashboard (todos)
    'dashboard': ['Administrador', 'Gestor', 'Técnico']
};

// Check if user has permission for a module
function hasPermission(moduleName) {
    const user = auth.getCurrentUser();
    if (!user || !user.perfil) return false;

    const perfilNombre = user.perfil.nombre;

    // Admin has access to everything
    if (perfilNombre === 'Administrador') return true;

    // Check specific module permissions
    const allowedProfiles = MENU_PERMISSIONS[moduleName];
    if (!allowedProfiles) return false;

    return allowedProfiles.includes(perfilNombre);
}

// Filter menu items based on permissions
function filterMenuByPermissions() {
    const navItems = document.querySelectorAll('.nav-item[data-module]');
    const navSections = document.querySelectorAll('.nav-section');

    navItems.forEach(item => {
        const module = item.getAttribute('data-module');
        if (module && !hasPermission(module)) {
            item.style.display = 'none';
        } else {
            item.style.display = '';
        }
    });

    // Hide empty sections
    navSections.forEach(section => {
        const visibleItems = section.querySelectorAll('.nav-item[data-module]:not([style*="display: none"])');
        if (visibleItems.length === 0) {
            section.style.display = 'none';
        } else {
            section.style.display = '';
        }
    });
}

// Validate access when loading a module
function validateModuleAccess(moduleName) {
    if (!hasPermission(moduleName)) {
        showToast('No tienes permisos para acceder a este módulo', 'danger');
        return false;
    }
    return true;
}
