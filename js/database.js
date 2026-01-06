/**
 * CONSEROUT - Database Layer
 * Manages all data operations using localStorage
 */

class Database {
    constructor() {
        this.initializeDatabase();
    }

    /**
     * Initialize database with default data if empty
     */
    initializeDatabase() {
        // Check if database exists
        if (!localStorage.getItem('conserout_initialized')) {
            this.seedDatabase();
            localStorage.setItem('conserout_initialized', 'true');
        }
    }

    /**
     * Seed database with initial data
     */
    seedDatabase() {
        // Perfiles
        this.setData('perfiles', [
            { id: 1, nombre: 'Administrador', permisos: ['all'] },
            { id: 2, nombre: 'Gestor', permisos: ['clientes', 'contratos', 'reportes', 'equipos', 'cobros'] },
            { id: 3, nombre: 'Técnico', permisos: ['servicios', 'equipos_view', 'contadores'] }
        ]);

        // Departamentos
        this.setData('departamentos', [
            { id: 1, nombre: 'Administración', descripcion: 'Departamento administrativo' },
            { id: 2, nombre: 'Operaciones', descripcion: 'Departamento de operaciones' },
            { id: 3, nombre: 'Técnico', descripcion: 'Departamento técnico' }
        ]);

        // Usuarios (password: admin123, gestor123, tecnico123)
        this.setData('usuarios', [
            {
                id: 1,
                username: 'admin',
                password: 'admin123',
                nombre: 'Administrador Sistema',
                email: 'admin@conserout.com',
                perfil_id: 1,
                departamento_id: 1,
                activo: true
            },
            {
                id: 2,
                username: 'gestor',
                password: 'gestor123',
                nombre: 'Juan Pérez',
                email: 'jperez@conserout.com',
                perfil_id: 2,
                departamento_id: 2,
                activo: true
            },
            {
                id: 3,
                username: 'tecnico',
                password: 'tecnico123',
                nombre: 'Carlos Ramírez',
                email: 'cramirez@conserout.com',
                perfil_id: 3,
                departamento_id: 3,
                activo: true
            }
        ]);

        // Tipos de equipo
        this.setData('tipos_equipo', [
            { id: 1, nombre: 'Impresora' },
            { id: 2, nombre: 'Multifuncional' },
            { id: 3, nombre: 'Scanner' },
            { id: 4, nombre: 'Plotter' }
        ]);

        // Marcas
        this.setData('marcas', [
            { id: 1, nombre: 'HP' },
            { id: 2, nombre: 'Canon' },
            { id: 3, nombre: 'Epson' },
            { id: 4, nombre: 'Brother' },
            { id: 5, nombre: 'Xerox' },
            { id: 6, nombre: 'Ricoh' }
        ]);

        // Modelos
        this.setData('modelos', [
            { id: 1, marca_id: 1, nombre: 'LaserJet Pro M404dn', tipo_equipo_id: 1 },
            { id: 2, marca_id: 1, nombre: 'LaserJet Pro MFP M428fdw', tipo_equipo_id: 2 },
            { id: 3, marca_id: 2, nombre: 'imageRUNNER 2625i', tipo_equipo_id: 2 },
            { id: 4, marca_id: 3, nombre: 'EcoTank L3250', tipo_equipo_id: 2 },
            { id: 5, marca_id: 4, nombre: 'HL-L2350DW', tipo_equipo_id: 1 },
            { id: 6, marca_id: 5, nombre: 'VersaLink C405', tipo_equipo_id: 2 }
        ]);

        // Tipos de impresión
        this.setData('tipos_impresion', [
            { id: 1, nombre: 'Láser' },
            { id: 2, nombre: 'Tinta' },
            { id: 3, nombre: 'Matriz de Punto' }
        ]);

        // Tamaños de impresión
        this.setData('tamanos_impresion', [
            { id: 1, nombre: 'A4' },
            { id: 2, nombre: 'Carta' },
            { id: 3, nombre: 'Oficio' },
            { id: 4, nombre: 'A3' }
        ]);

        // Tipos de mantenimiento
        this.setData('tipos_mantenimiento', [
            { id: 1, nombre: 'Preventivo' },
            { id: 2, nombre: 'Correctivo' }
        ]);

        // Tipos de suministro
        this.setData('tipos_suministro', [
            { id: 1, nombre: 'Toner' },
            { id: 2, nombre: 'Tinta' },
            { id: 3, nombre: 'Papel' },
            { id: 4, nombre: 'Repuesto' }
        ]);

        // Suministros
        this.setData('suministros', [
            { id: 1, tipo_suministro_id: 1, nombre: 'Toner HP 58A Negro', codigo: 'CF258A', stock_minimo: 5 },
            { id: 2, tipo_suministro_id: 1, nombre: 'Toner Canon 051', codigo: 'CRG051', stock_minimo: 5 },
            { id: 3, tipo_suministro_id: 2, nombre: 'Tinta Epson 664 Negro', codigo: 'T664120', stock_minimo: 10 },
            { id: 4, tipo_suministro_id: 3, nombre: 'Papel A4 75g', codigo: 'PAP-A4-75', stock_minimo: 50 }
        ]);

        // Clientes
        this.setData('clientes', [
            {
                id: 1,
                nombre: 'Empresa ABC S.A.',
                rut: '76.123.456-7',
                direccion: 'Av. Principal 123, Santiago',
                telefono: '+56 2 2345 6789',
                email: 'contacto@empresaabc.cl',
                contacto: 'María González',
                estado: 'activo'
            },
            {
                id: 2,
                nombre: 'Corporación XYZ Ltda.',
                rut: '77.987.654-3',
                direccion: 'Calle Comercio 456, Valparaíso',
                telefono: '+56 32 234 5678',
                email: 'info@corpxyz.cl',
                contacto: 'Pedro Sánchez',
                estado: 'activo'
            }
        ]);

        // Contratos
        this.setData('contratos', [
            {
                id: 1,
                cliente_id: 1,
                numero_contrato: 'CONT-2024-001',
                fecha_inicio: '2024-01-01',
                fecha_fin: '2024-12-31',
                estado: 'vigente',
                valor_total: 12000000,
                descripcion: 'Contrato de outsourcing de impresión - 50 equipos'
            },
            {
                id: 2,
                cliente_id: 2,
                numero_contrato: 'CONT-2024-002',
                fecha_inicio: '2024-03-01',
                fecha_fin: '2025-02-28',
                estado: 'vigente',
                valor_total: 8500000,
                descripcion: 'Contrato de outsourcing de impresión - 30 equipos'
            }
        ]);

        // Tarifas de contrato
        this.setData('tarifas_contrato', [
            { id: 1, contrato_id: 1, tipo_servicio: 'Impresión B/N', valor_unitario: 5 },
            { id: 2, contrato_id: 1, tipo_servicio: 'Impresión Color', valor_unitario: 15 },
            { id: 3, contrato_id: 2, tipo_servicio: 'Impresión B/N', valor_unitario: 6 },
            { id: 4, contrato_id: 2, tipo_servicio: 'Impresión Color', valor_unitario: 18 }
        ]);

        // Técnicos asignados a contratos
        this.setData('tecnicos_contrato', [
            { id: 1, contrato_id: 1, tecnico_id: 3 },
            { id: 2, contrato_id: 2, tecnico_id: 3 }
        ]);

        // Equipos
        this.setData('equipos', [
            {
                id: 1,
                contrato_id: 1,
                modelo_id: 1,
                numero_serie: 'HP123456789',
                estado: 'instalado',
                ubicacion: 'Piso 3 - Administración',
                fecha_instalacion: '2024-01-15'
            },
            {
                id: 2,
                contrato_id: 1,
                modelo_id: 2,
                numero_serie: 'HP987654321',
                estado: 'instalado',
                ubicacion: 'Piso 2 - Finanzas',
                fecha_instalacion: '2024-01-15'
            },
            {
                id: 3,
                contrato_id: 1,
                modelo_id: 3,
                numero_serie: 'CAN456789123',
                estado: 'sin_instalar',
                ubicacion: 'Bodega',
                fecha_instalacion: null
            },
            {
                id: 4,
                contrato_id: 2,
                modelo_id: 4,
                numero_serie: 'EPS789123456',
                estado: 'instalado',
                ubicacion: 'Recepción',
                fecha_instalacion: '2024-03-10'
            }
        ]);

        // Contadores de equipos
        this.setData('contadores_equipos', [
            {
                id: 1,
                equipo_id: 1,
                fecha_lectura: '2024-01-15',
                contador_actual: 0,
                contador_anterior: 0,
                consumo: 0,
                usuario_registro_id: 3
            },
            {
                id: 2,
                equipo_id: 1,
                fecha_lectura: '2024-02-15',
                contador_actual: 1250,
                contador_anterior: 0,
                consumo: 1250,
                usuario_registro_id: 3
            },
            {
                id: 3,
                equipo_id: 2,
                fecha_lectura: '2024-01-15',
                contador_actual: 5000,
                contador_anterior: 5000,
                consumo: 0,
                usuario_registro_id: 3
            },
            {
                id: 4,
                equipo_id: 2,
                fecha_lectura: '2024-02-15',
                contador_actual: 6800,
                contador_anterior: 5000,
                consumo: 1800,
                usuario_registro_id: 3
            }
        ]);

        // Bodega
        this.setData('bodega', [
            { id: 1, suministro_id: 1, cantidad: 25, ubicacion: 'Estante A1', fecha_ingreso: '2024-01-10' },
            { id: 2, suministro_id: 2, cantidad: 18, ubicacion: 'Estante A2', fecha_ingreso: '2024-01-10' },
            { id: 3, suministro_id: 3, cantidad: 45, ubicacion: 'Estante B1', fecha_ingreso: '2024-01-10' },
            { id: 4, suministro_id: 4, cantidad: 120, ubicacion: 'Estante C1', fecha_ingreso: '2024-01-10' }
        ]);

        // Servicios
        this.setData('servicios', []);
        this.setData('mantenimientos', []);
        this.setData('instalaciones', []);
        this.setData('cambios_consumibles', []);
        this.setData('movimientos_bodega', []);
        this.setData('cobros', []);
        this.setData('notificaciones', []);
        this.setData('hitos_contrato', []);
    }

    /**
     * Get data from localStorage
     */
    getData(table) {
        const data = localStorage.getItem(`conserout_${table}`);
        return data ? JSON.parse(data) : [];
    }

    /**
     * Set data to localStorage
     */
    setData(table, data) {
        localStorage.setItem(`conserout_${table}`, JSON.stringify(data));
    }

    /**
     * Get single record by ID
     */
    getById(table, id) {
        const data = this.getData(table);
        return data.find(item => item.id === parseInt(id));
    }

    /**
     * Get records by field value
     */
    getBy(table, field, value) {
        const data = this.getData(table);
        return data.filter(item => item[field] === value);
    }

    /**
     * Insert new record
     */
    insert(table, record) {
        const data = this.getData(table);
        const newId = data.length > 0 ? Math.max(...data.map(item => item.id)) + 1 : 1;
        const newRecord = { id: newId, ...record };
        data.push(newRecord);
        this.setData(table, data);
        return newRecord;
    }

    /**
     * Update existing record
     */
    update(table, id, updates) {
        const data = this.getData(table);
        const index = data.findIndex(item => item.id === parseInt(id));
        if (index !== -1) {
            data[index] = { ...data[index], ...updates };
            this.setData(table, data);
            return data[index];
        }
        return null;
    }

    /**
     * Delete record
     */
    delete(table, id) {
        const data = this.getData(table);
        const filtered = data.filter(item => item.id !== parseInt(id));
        this.setData(table, filtered);
        return filtered.length < data.length;
    }

    /**
     * Query with filters
     */
    query(table, filters = {}) {
        let data = this.getData(table);

        Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
                data = data.filter(item => {
                    if (typeof filters[key] === 'object' && filters[key].operator) {
                        const { operator, value } = filters[key];
                        switch (operator) {
                            case 'like':
                                return String(item[key]).toLowerCase().includes(String(value).toLowerCase());
                            case 'gte':
                                return item[key] >= value;
                            case 'lte':
                                return item[key] <= value;
                            case 'in':
                                return value.includes(item[key]);
                            default:
                                return item[key] === value;
                        }
                    }
                    return item[key] === filters[key];
                });
            }
        });

        return data;
    }

    /**
     * Get next ID for a table
     */
    getNextId(table) {
        const data = this.getData(table);
        return data.length > 0 ? Math.max(...data.map(item => item.id)) + 1 : 1;
    }

    /**
     * Clear all data (for testing)
     */
    clearAll() {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('conserout_'));
        keys.forEach(key => localStorage.removeItem(key));
    }

    /**
     * Export data as JSON
     */
    exportData() {
        const tables = [
            'perfiles', 'departamentos', 'usuarios', 'tipos_equipo', 'marcas', 'modelos',
            'tipos_impresion', 'tamanos_impresion', 'tipos_mantenimiento', 'tipos_suministro',
            'suministros', 'clientes', 'contratos', 'tarifas_contrato', 'tecnicos_contrato',
            'equipos', 'contadores_equipos', 'bodega', 'servicios', 'mantenimientos',
            'instalaciones', 'cambios_consumibles', 'movimientos_bodega', 'cobros',
            'notificaciones', 'hitos_contrato'
        ];

        const exportData = {};
        tables.forEach(table => {
            exportData[table] = this.getData(table);
        });

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Import data from JSON
     */
    importData(jsonData) {
        const data = JSON.parse(jsonData);
        Object.keys(data).forEach(table => {
            this.setData(table, data[table]);
        });
    }
}

// Create global database instance
const db = new Database();
