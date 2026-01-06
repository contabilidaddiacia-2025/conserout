# Sistema de Permisos por Perfil - CONSEROUT

## Resumen

Se ha implementado un sistema completo de control de acceso basado en roles (RBAC) que filtra los menús y valida el acceso a módulos según el perfil del usuario.

## Perfiles y Permisos

### 👑 Administrador
**Acceso**: TOTAL - Ve y puede hacer TODO

**Módulos Disponibles**:
- ✅ **Nivel 1 - Mantenimiento**: Tipos de Equipo, Marcas, Usuarios, Departamentos
- ✅ **Nivel 2 - Operación**: Clientes, Contratos, Equipos, Bodega, Cobros
- ✅ **Nivel 3 - Servicios**: Contadores, Cambio Consumibles, Instalaciones, Mantenimientos
- ✅ **Nivel 4 - Reportería**: Todos los reportes
- ✅ **Nivel 5 - Notificaciones**: Avisos y alertas

**Uso**: Configuración del sistema, gestión de usuarios, supervisión completa

---

### 📊 Gestor
**Acceso**: OPERACIONAL Y REPORTES - Gestión del negocio sin configuración del sistema

**Módulos Disponibles**:
- ❌ **Nivel 1 - Mantenimiento**: NO tiene acceso
- ✅ **Nivel 2 - Operación**: Clientes, Contratos, Equipos, Bodega, Cobros
- ✅ **Nivel 3 - Servicios**: Contadores, Cambio Consumibles, Instalaciones, Mantenimientos
- ✅ **Nivel 4 - Reportería**: Todos los reportes
- ✅ **Nivel 5 - Notificaciones**: Avisos y alertas

**Uso**: Gestión diaria, supervisión de técnicos, reportes de negocio

---

### 🔧 Técnico
**Acceso**: SERVICIOS OPERATIVOS - Solo lo necesario para su trabajo de campo

**Módulos Disponibles**:
- ❌ **Nivel 1 - Mantenimiento**: NO tiene acceso
- ❌ **Nivel 2 - Operación**: NO tiene acceso (excepto vista de equipos)
- ✅ **Nivel 3 - Servicios**: Contadores, Cambio Consumibles, Instalaciones, Mantenimientos
- ❌ **Nivel 4 - Reportería**: NO tiene acceso
- ✅ **Nivel 5 - Notificaciones**: Avisos y alertas (sus asignaciones)

**Uso**: Registro de contadores, cambios de consumibles, instalaciones, mantenimientos

---

## Comparación de Accesos

| Módulo | Admin | Gestor | Técnico |
|--------|-------|--------|---------|
| **Dashboard** | ✅ | ✅ | ✅ |
| **Tipos de Equipo** | ✅ | ❌ | ❌ |
| **Usuarios** | ✅ | ❌ | ❌ |
| **Clientes** | ✅ | ✅ | ❌ |
| **Contratos** | ✅ | ✅ | ❌ |
| **Equipos** | ✅ | ✅ | 👁️ Solo vista |
| **Bodega** | ✅ | ✅ | ❌ |
| **Contadores** | ✅ | ✅ | ✅ |
| **Cambio Consumibles** | ✅ | ✅ | ✅ |
| **Instalaciones** | ✅ | ✅ | ✅ |
| **Mantenimientos** | ✅ | ✅ | ✅ |
| **Reportes** | ✅ | ✅ | ❌ |
| **Notificaciones** | ✅ | ✅ | ✅ |

## Funcionamiento Técnico

### 1. Filtrado de Menú

Al cargar el dashboard:
```javascript
// Automáticamente oculta elementos del menú sin permiso
filterMenuByPermissions();
```

**Resultado**:
- Técnico NO ve: Clientes, Contratos, Bodega, Reportes
- Gestor NO ve: Usuarios, Tipos de Equipo, Marcas
- Admin ve TODO

### 2. Validación de Acceso

Al intentar cargar un módulo:
```javascript
if (!validateModuleAccess(moduleName)) {
    showToast('No tienes permisos para acceder a este módulo', 'danger');
    return false;
}
```

**Protección**:
- Aunque alguien intente acceder por URL
- Aunque alguien manipule el HTML
- El sistema valida permisos en el backend (JavaScript)

### 3. Configuración de Permisos

Archivo: `js/permissions.js`

```javascript
const MENU_PERMISSIONS = {
    'clientes': ['Administrador', 'Gestor'],
    'contadores': ['Administrador', 'Gestor', 'Técnico'],
    // ... etc
};
```

## Ejemplos de Uso

### Escenario 1: Técnico intenta ver Clientes

1. Técnico inicia sesión
2. Menú NO muestra opción "Clientes"
3. Si intenta acceder directamente: ❌ "No tienes permisos"

### Escenario 2: Gestor gestiona operaciones

1. Gestor inicia sesión
2. Ve: Clientes, Contratos, Equipos, Bodega
3. Puede crear contratos, asignar equipos
4. NO ve: Usuarios, Configuración del sistema

### Escenario 3: Admin configura sistema

1. Admin inicia sesión
2. Ve TODO el menú completo
3. Puede crear usuarios, configurar tipos de equipo
4. Acceso total sin restricciones

## Credenciales de Prueba

```
Administrador:
- Usuario: admin
- Password: admin123
- Acceso: TOTAL

Gestor:
- Usuario: gestor
- Password: gestor123
- Acceso: Operacional + Reportes

Técnico:
- Usuario: tecnico
- Password: tecnico123
- Acceso: Solo Servicios
```

## Personalización

### Agregar nuevo módulo

1. Definir permiso en `permissions.js`:
```javascript
const MENU_PERMISSIONS = {
    'nuevo-modulo': ['Administrador', 'Gestor'],
    // ...
};
```

2. Agregar al menú en `dashboard.html`:
```html
<a href="#" class="nav-item" data-module="nuevo-modulo">
    <span class="nav-item-icon">🆕</span>
    <span>Nuevo Módulo</span>
</a>
```

3. El sistema automáticamente:
   - Oculta para técnicos
   - Muestra para admin y gestor
   - Valida acceso

### Modificar permisos de un perfil

Editar `js/database.js`:
```javascript
{
    id: 2,
    nombre: 'Gestor',
    permisos: [
        'dashboard',
        'clientes',
        'contratos',
        // Agregar más aquí
    ]
}
```

## Beneficios

✅ **Seguridad**: Solo ven lo que deben ver  
✅ **Simplicidad**: Menú limpio según rol  
✅ **Escalabilidad**: Fácil agregar nuevos módulos  
✅ **Mantenibilidad**: Permisos centralizados  
✅ **UX Mejorada**: Menos confusión para usuarios  

## Notas Importantes

1. **Secciones Vacías**: Si una sección no tiene módulos visibles, se oculta automáticamente
2. **Dashboard**: Todos los perfiles ven el dashboard (personalizado según datos)
3. **Notificaciones**: Todos reciben notificaciones relevantes a su rol
4. **Futuro**: Preparado para migración a backend con JWT/tokens

## Migración a Backend

Cuando migres a backend real:

1. Permisos se validan en servidor
2. JWT incluye permisos del usuario
3. API rechaza requests sin permiso
4. Frontend solo oculta UI (no es seguridad real)

```javascript
// Ejemplo futuro con API
async function validateModuleAccess(moduleName) {
    const response = await fetch('/api/permissions/check', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ module: moduleName })
    });
    return response.ok;
}
```
