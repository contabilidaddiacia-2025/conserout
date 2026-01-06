/**
 * CONSEROUT - Authentication Module
 * Handles user login, session management, and permissions
 */

class Auth {
    constructor() {
        this.currentUser = null;
        this.loadSession();
    }

    /**
     * Login user
     */
    login(username, password) {
        const usuarios = db.getData('usuarios');
        const user = usuarios.find(u =>
            u.username === username &&
            u.password === password &&
            u.activo === true
        );

        if (user) {
            // Get user profile
            const perfil = db.getById('perfiles', user.perfil_id);
            const departamento = db.getById('departamentos', user.departamento_id);

            this.currentUser = {
                ...user,
                perfil: perfil,
                departamento: departamento
            };

            // Save session
            this.saveSession();
            return { success: true, user: this.currentUser };
        }

        return { success: false, message: 'Usuario o contraseña incorrectos' };
    }

    /**
     * Logout user
     */
    logout() {
        this.currentUser = null;
        localStorage.removeItem('conserout_session');
        window.location.href = 'index.html';
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Check if user has permission
     */
    hasPermission(permission) {
        if (!this.currentUser || !this.currentUser.perfil) {
            return false;
        }

        const permisos = this.currentUser.perfil.permisos;

        // Admin has all permissions
        if (permisos.includes('all')) {
            return true;
        }

        return permisos.includes(permission);
    }

    /**
     * Save session to localStorage
     */
    saveSession() {
        if (this.currentUser) {
            localStorage.setItem('conserout_session', JSON.stringify(this.currentUser));
        }
    }

    /**
     * Load session from localStorage
     */
    loadSession() {
        const session = localStorage.getItem('conserout_session');
        if (session) {
            this.currentUser = JSON.parse(session);
        }
    }

    /**
     * Require authentication (redirect to login if not authenticated)
     */
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }

    /**
     * Require specific permission
     */
    requirePermission(permission) {
        if (!this.hasPermission(permission)) {
            showToast('No tienes permisos para realizar esta acción', 'danger');
            return false;
        }
        return true;
    }
}

// Create global auth instance
const auth = new Auth();
