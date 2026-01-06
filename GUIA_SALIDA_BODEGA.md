# Guía de Uso - Salida de Suministros con Asignación a Contrato

## Pasos para Registrar una Salida con Contrato

### 1. Abrir el Formulario de Salida

1. Ve al módulo **Bodega** desde el menú lateral
2. Busca el suministro que deseas registrar la salida
3. Click en el botón **"Salida"** (botón rojo con símbolo -)

### 2. Seleccionar Tipo de Salida

En el formulario que aparece:

1. **Primer campo: "Tipo de Salida"**
   - Este es un campo **OBLIGATORIO**
   - Opciones disponibles:
     - **"Asignación a Contrato"** - Para enviar suministros a un contrato específico
     - **"Instalación/Cambio en Equipo"** - Para usar en un equipo instalado
     - **"Otro Uso"** - Para otros propósitos

2. **Selecciona "Asignación a Contrato"**
   - Al seleccionar esta opción, aparecerá automáticamente un nuevo campo debajo

### 3. Seleccionar el Contrato

Después de seleccionar "Asignación a Contrato":

1. Aparecerá el campo **"Contrato Destino"**
2. Este campo muestra todos los contratos vigentes
3. Formato: `Número de Contrato - Nombre del Cliente`
4. Ejemplo: `CONT-2024-001 - Empresa ABC S.A.`

### 4. Completar el Resto del Formulario

1. **Cantidad**: Número de unidades a enviar
2. **Referencia/Descripción**: Descripción del envío (ej: "Envío mensual enero 2024")
3. **Observaciones** (opcional): Detalles adicionales

### 5. Registrar la Salida

Click en el botón **"Registrar Salida"** (botón rojo)

## Verificación Visual

### ¿Qué deberías ver?

1. **Antes de seleccionar tipo**: Solo ves el campo "Tipo de Salida"
2. **Después de seleccionar "Asignación a Contrato"**: 
   - Aparece el campo "Contrato Destino"
   - El campo tiene un dropdown con todos los contratos vigentes

### Si no ves el campo de contrato:

1. **Verifica que seleccionaste "Asignación a Contrato"** en el primer dropdown
2. **Espera un momento** - el campo debería aparecer inmediatamente
3. **Refresca la página** y vuelve a intentar
4. **Verifica en la consola del navegador** (F12) si hay errores JavaScript

## Ejemplo Completo

```
1. Click en "Salida" del suministro "HP 58A Toner"
2. Seleccionar "Asignación a Contrato" en "Tipo de Salida"
   → Aparece campo "Contrato Destino"
3. Seleccionar "CONT-2024-001 - Empresa ABC S.A."
4. Ingresar cantidad: 5
5. Ingresar referencia: "Envío mensual enero 2024"
6. (Opcional) Observaciones: "Entrega urgente"
7. Click en "Registrar Salida"
```

## Ver el Resultado

Después de registrar:

1. Click en **"Historial"** del mismo suministro
2. Verás el movimiento con:
   - 📄 Contrato: CONT-2024-001 - Empresa ABC S.A.
   - Tipo: Asignación a Contrato
   - Observaciones (si las agregaste)

3. Click en **"Generar Reporte"** para ver distribución completa

## Solución de Problemas

### El campo de contrato no aparece

**Causa**: JavaScript no se está ejecutando correctamente

**Solución**:
1. Abre la consola del navegador (F12)
2. Busca errores en rojo
3. Refresca la página (Ctrl+F5)
4. Intenta de nuevo

### No hay contratos en la lista

**Causa**: No hay contratos vigentes en el sistema

**Solución**:
1. Ve al módulo "Contratos"
2. Verifica que existan contratos con estado "Vigente"
3. Si no hay, crea un nuevo contrato
4. Vuelve a Bodega e intenta de nuevo

### El botón "Registrar Salida" no funciona

**Causa**: Falta completar campos obligatorios

**Solución**:
1. Verifica que seleccionaste un contrato
2. Verifica que ingresaste una cantidad válida
3. Verifica que ingresaste una referencia
4. El formulario mostrará qué campos faltan

## Características Adicionales

### Asignación a Equipo

Si seleccionas "Instalación/Cambio en Equipo":
- Aparece un campo para seleccionar el equipo
- El sistema automáticamente vincula al contrato del equipo
- Útil para cambios de toner, mantenimientos, etc.

### Otro Uso

Si seleccionas "Otro Uso":
- No se requiere seleccionar contrato ni equipo
- Solo necesitas cantidad y referencia
- Útil para usos internos, muestras, etc.
