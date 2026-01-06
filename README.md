# CONSEROUT - Sistema de Gestión de Outsourcing de Impresión

Sistema web completo para gestión de servicios de outsourcing que permite administrar clientes, contratos, técnicos, equipos (hasta 400 por contrato), consumibles, servicios y generar reportes detallados con tracking mensual de contadores.

## 🚀 Características Principales

### ✅ Sistema de Autenticación
- 3 perfiles de usuario: Administrador, Gestor, Técnico
- Control de permisos por perfil
- Gestión de sesiones

### ✅ Dashboard Interactivo
- Métricas en tiempo real (contratos, equipos, valores)
- Gráficos de consumo mensual
- Distribución de equipos por marca
- Tabla de contratos activos

### ✅ Gestión de Contratos
- CRUD completo de contratos
- Asignación de clientes
- Gestión de tarifas
- Seguimiento de equipos por contrato

### ✅ Sistema de Contadores (CRÍTICO)
- Registro individual de contadores
- Registro masivo por contrato
- Cálculo automático de consumo
- Historial completo de lecturas
- Soporte para hasta 400 equipos por contrato

### ✅ Reportería Avanzada
- Reporte de consumo mensual con filtros por fecha
- Reporte de equipos por contrato
- Cálculo de valores de cobro
- Exportación a PDF/Excel (en desarrollo)

## 📁 Estructura del Proyecto

```
GRAVY/
├── index.html                    # Página de login
├── dashboard.html                # Dashboard principal
├── css/
│   ├── main.css                 # Sistema de diseño
│   ├── components.css           # Componentes reutilizables
│   └── modules.css              # Estilos de módulos
├── js/
│   ├── database.js              # Capa de datos (localStorage)
│   ├── auth.js                  # Autenticación
│   ├── utils.js                 # Utilidades
│   ├── app.js                   # Core de la aplicación
│   ├── dashboard.js             # Lógica del dashboard
│   └── modules/
│       ├── contadores.js        # Módulo de contadores
│       └── reportes.js          # Módulo de reportes
└── README.md                    # Este archivo
```

## 🔧 Cómo Ejecutar Localmente

### Opción 1: Abrir directamente en el navegador
1. Navega a la carpeta `GRAVY`
2. Haz doble clic en `index.html`
3. El sistema se abrirá en tu navegador predeterminado

### Opción 2: Usar un servidor local (Recomendado)

#### Con Node.js (si está instalado):
```bash
cd C:\Users\TECNICO\Desktop\GRAVY
npx -y http-server ./ -p 8080
```
Luego abre: http://localhost:8080

#### Con Python (si está instalado):
```bash
cd C:\Users\TECNICO\Desktop\GRAVY
python -m http.server 8080
```
Luego abre: http://localhost:8080

#### Con Visual Studio Code:
1. Abre la carpeta `GRAVY` en VS Code
2. Instala la extensión "Live Server"
3. Click derecho en `index.html` → "Open with Live Server"

## 👤 Credenciales de Acceso

### Administrador
- **Usuario:** admin
- **Contraseña:** admin123
- **Permisos:** Acceso total al sistema

### Gestor
- **Usuario:** gestor
- **Contraseña:** gestor123
- **Permisos:** Clientes, contratos, reportes, equipos, cobros

### Técnico
- **Usuario:** tecnico
- **Contraseña:** tecnico123
- **Permisos:** Servicios, contadores, consultas

## 📊 Flujo de Uso Principal

### 1. Gestión de Contratos
1. Login con usuario admin o gestor
2. Ir a "Contratos" en el menú lateral
3. Crear nuevo contrato con cliente
4. Asignar equipos al contrato

### 2. Registro de Contadores (Caso de Uso Crítico)
1. Ir a "Registro de Contadores"
2. Seleccionar contrato y mes
3. Para cada equipo:
   - Ingresar contador actual
   - El sistema calcula automáticamente el consumo
   - Guardar lectura
4. Ver historial de cada equipo

### 3. Generación de Reportes
1. Ir a "Reportes"
2. Seleccionar tipo de reporte:
   - **Consumo Mensual**: Ver consumo por período
   - **Equipos por Contrato**: Lista completa de equipos
3. Aplicar filtros (fecha, contrato)
4. Generar y exportar reporte

## 🌐 Despliegue en la Web

### Opción 1: GitHub Pages (Gratis)
1. Crea un repositorio en GitHub
2. Sube todos los archivos de la carpeta `GRAVY`
3. Ve a Settings → Pages
4. Selecciona la rama `main` como fuente
5. Tu sitio estará en: `https://tuusuario.github.io/nombre-repo`

### Opción 2: Netlify (Gratis)
1. Ve a https://www.netlify.com
2. Arrastra la carpeta `GRAVY` al área de deploy
3. Tu sitio estará disponible en minutos
4. URL: `https://nombre-aleatorio.netlify.app`

### Opción 3: Vercel (Gratis)
1. Ve a https://vercel.com
2. Importa el proyecto desde GitHub o sube directamente
3. Deploy automático
4. URL: `https://nombre-proyecto.vercel.app`

### Opción 4: Hosting Tradicional
1. Sube todos los archivos vía FTP a tu hosting
2. Asegúrate de que `index.html` esté en la raíz
3. Accede a tu dominio

## 🔄 Migración a Backend Real

El sistema está diseñado para ser escalable. Para migrar a un backend real:

### 1. Reemplazar `database.js`
Actualmente usa `localStorage`. Reemplazar con llamadas a API:

```javascript
// Ejemplo de migración
class Database {
  async getData(table) {
    const response = await fetch(`/api/${table}`);
    return await response.json();
  }
  
  async insert(table, data) {
    const response = await fetch(`/api/${table}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  }
  // ... más métodos
}
```

### 2. Backend Recomendado
- **Node.js + Express + PostgreSQL**
- **PHP + Laravel + MySQL**
- **Python + Django + PostgreSQL**

### 3. Estructura de Base de Datos
El esquema está documentado en `database.js`. Incluye:
- 20+ tablas relacionales
- Índices para optimización
- Relaciones entre entidades

## 📦 Datos de Demostración

El sistema incluye datos de ejemplo:
- 2 clientes
- 2 contratos vigentes
- 4 equipos
- 6 marcas de impresoras
- Lecturas de contadores de ejemplo
- Suministros en bodega

## 🎨 Características de Diseño

- **Tema oscuro premium** con glassmorphism
- **Responsive** para móviles y tablets
- **Animaciones suaves** y micro-interacciones
- **Gráficos interactivos** con Chart.js
- **Tipografía moderna** (Inter font)

## 🔐 Seguridad

- Validación de formularios
- Control de permisos por perfil
- Sanitización de inputs
- Sesiones con timeout

## 📝 Próximas Funcionalidades

- [ ] Módulo de clientes completo
- [ ] Gestión de bodega
- [ ] Módulo de cobros
- [ ] Instalaciones y mantenimientos
- [ ] Exportación real a PDF/Excel
- [ ] Notificaciones push
- [ ] Modo offline con sincronización

## 🐛 Solución de Problemas

### El sistema no carga
- Verifica que todos los archivos CSS y JS estén en sus carpetas
- Abre la consola del navegador (F12) para ver errores

### Los datos no se guardan
- Verifica que el navegador permita localStorage
- No uses modo incógnito

### Los gráficos no se muestran
- Verifica la conexión a internet (Chart.js se carga desde CDN)
- Revisa la consola del navegador

## 📧 Soporte

Para soporte o consultas sobre el sistema, contacta al administrador.

## 📄 Licencia

Sistema propietario - Todos los derechos reservados © 2024 CONSEROUT
