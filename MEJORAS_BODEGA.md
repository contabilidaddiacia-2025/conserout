# Mejoras al Módulo de Bodega - CONSEROUT

## Resumen de Cambios

Se ha mejorado significativamente el módulo de bodega para permitir el seguimiento detallado de suministros por contrato y generar reportes de distribución.

## Nuevas Funcionalidades

### 1. Salidas de Suministros con Asignación

Ahora al registrar una salida de bodega, puedes especificar:

- **Tipo de Salida:**
  - **Asignación a Contrato**: Envío directo a un contrato específico
  - **Instalación/Cambio en Equipo**: Uso en un equipo instalado (automáticamente vincula al contrato del equipo)
  - **Otro Uso**: Para usos generales

- **Selección de Destino:**
  - Si es asignación a contrato: selecciona el contrato destino
  - Si es para equipo: selecciona el equipo específico
  - El sistema automáticamente vincula el equipo a su contrato

- **Información Adicional:**
  - Referencia/Descripción del movimiento
  - Observaciones adicionales

### 2. Historial Mejorado

El historial de movimientos ahora muestra:

- **Para Salidas:**
  - 📄 Contrato destino con nombre del cliente
  - 🖨️ Equipo específico (si aplica) con modelo y número de serie
  - Tipo de salida
  - Observaciones adicionales

- **Información Visual:**
  - Código de colores (verde para entradas, rojo para salidas)
  - Formato de timeline con fechas
  - Detalles completos de cada movimiento

### 3. Reporte de Distribución por Suministro

Nuevo botón "Generar Reporte" en el historial que muestra:

- **Distribución por Contrato:**
  - Total de unidades enviadas a cada contrato
  - Cliente asociado
  - Detalles de cada movimiento
  - Equipo específico si aplica

- **Resumen Ejecutivo:**
  - Número de contratos atendidos
  - Total de salidas
  - Cantidad de movimientos

### 4. Reporte General de Bodega por Contrato

Nuevo módulo de reportes que permite:

- **Filtros:**
  - Por contrato específico o todos
  - Rango de fechas

- **Vista Consolidada:**
  - Agrupación por contrato
  - Listado de todos los suministros enviados
  - Cantidades totales por suministro
  - Número de movimientos

- **Exportación:**
  - Botón para exportar a PDF (preparado para implementación futura)

## Flujo de Uso

### Registrar Salida con Contrato

1. Ir a **Bodega**
2. Click en botón **"Salida"** del suministro
3. Seleccionar **"Asignación a Contrato"** en Tipo de Salida
4. Seleccionar el contrato destino
5. Ingresar cantidad y referencia
6. Agregar observaciones si es necesario
7. Click en **"Registrar Salida"**

### Ver Distribución de un Suministro

1. En **Bodega**, click en **"Historial"** del suministro
2. Ver movimientos con detalles de contratos y equipos
3. Click en **"Generar Reporte"** para ver distribución consolidada
4. Opcionalmente exportar a PDF

### Ver Reporte General por Contrato

1. Ir a módulo de **Reportes**
2. Seleccionar **"Reporte de Bodega"** (si está en el menú)
3. Filtrar por contrato y/o fechas
4. Ver distribución de todos los suministros por contrato

## Beneficios

✅ **Trazabilidad Completa**: Saber exactamente dónde se envió cada suministro  
✅ **Control por Contrato**: Seguimiento de consumos por cliente  
✅ **Reportería Detallada**: Informes listos para facturación y auditoría  
✅ **Vinculación Automática**: Los equipos automáticamente vinculan al contrato  
✅ **Historial Completo**: Registro detallado de cada movimiento  

## Datos Registrados

Cada movimiento de salida ahora incluye:

```javascript
{
  suministro_id: number,
  tipo_movimiento: 'salida',
  cantidad: number,
  fecha: date,
  usuario_id: number,
  referencia: string,
  observaciones: string,
  tipo_salida: 'contrato' | 'equipo' | 'otro',
  contrato_id: number,      // Contrato destino
  equipo_id: number          // Equipo específico (opcional)
}
```

## Próximos Pasos Sugeridos

1. Implementar exportación real a PDF con librería jsPDF
2. Agregar gráficos de distribución por contrato
3. Alertas de consumo excesivo por contrato
4. Proyección de necesidades futuras basado en histórico
