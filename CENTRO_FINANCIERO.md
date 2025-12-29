# 💰 Centro Financiero - BingoVE

## 📋 Descripción

El Centro Financiero es el sistema completo de gestión monetaria de BingoVE. Proporciona visibilidad total sobre transacciones, configuración de precios, análisis financiero en tiempo real, visualizaciones avanzadas y herramientas de búsqueda y filtrado profesionales.

---

## ✨ Características Implementadas

### **FASE 1: Base Completa** ✅
- 🏺 **Monitor en Tiempo Real**: La Hoya, Caja Total, Utilidad Neta
- 📊 **Resumen del Día**: Ingresos, Egresos, Balance
- 📋 **Historial de Transacciones**: Últimas 20 operaciones
- ⚙️ **Configuración Editable**: Precios, premios y porcentajes

### **FASE 2: Visualización Avanzada** ✅
- 📈 **Gráfico de Flujo de Caja**: Últimos 7 días (Ingresos vs Egresos)
- 🥧 **Gráfico de Distribución**: Visualización de La Hoya, Premios y Utilidad
- 📥 **Exportar a CSV**: Descarga el historial completo
- 🎨 **Gráficos Interactivos**: Tooltips y animaciones profesionales

### **FASE 3: Filtros y Búsqueda Avanzada** ✅
- 🔍 **Búsqueda por Texto**: Buscar en descripciones y usuarios
- 📅 **Filtro por Fechas**: Rango personalizado (desde - hasta)
- 🏷️ **Filtro por Tipo**: Todos / Ingresos / Egresos
- 📂 **Filtro por Categoría**: Ventas / Premios / Ajustes
- 🔄 **Ordenamiento**: Por fecha o monto (ascendente/descendente)
- 📄 **Paginación**: Navegar entre páginas de 20 transacciones
- 🧹 **Limpiar Filtros**: Resetear todos los filtros con un clic
- 📊 **Contador de Resultados**: Ver total de transacciones encontradas

---

## 🚀 Cómo Usar

### **Usar los Filtros**

1. **Abrir Panel de Filtros**:
   - Haz clic en "Mostrar Filtros" en el historial de transacciones
   - Verás un panel expandible con todas las opciones

2. **Buscar por Texto**:
   - Escribe en el campo de búsqueda
   - Busca por nombre de usuario, descripción, etc.
   - Los resultados se actualizan automáticamente

3. **Filtrar por Tipo**:
   - Selecciona "Ingresos" para ver solo entradas de dinero
   - Selecciona "Egresos" para ver solo salidas
   - "Todos" muestra ambos

4. **Filtrar por Categoría**:
   - **Venta de Cartones**: Solo compras de usuarios
   - **Pago de Premios**: Solo premios pagados a ganadores
   - **Reset de Hoya**: Cierres semanales
   - **Ajuste del Sistema**: Correcciones manuales

5. **Filtrar por Fechas**:
   - Selecciona fecha "Desde" y "Hasta"
   - Útil para ver transacciones de un período específico
   - Ejemplo: Ver todas las transacciones de diciembre

6. **Ordenar Resultados**:
   - **Por Fecha**: Más recientes primero o más antiguos primero
   - **Por Monto**: Montos más altos o más bajos primero

7. **Limpiar Filtros**:
   - Haz clic en "Limpiar" para resetear todos los filtros
   - Vuelve a mostrar todas las transacciones

### **Navegar entre Páginas**

1. Si hay más de 20 transacciones, verás botones de paginación
2. Usa las flechas `←` y `→` para navegar
3. El contador muestra: "Mostrando 1-20 de 150 transacciones"

---

## 📊 Ejemplos de Uso

### **Caso 1: Buscar un pago específico**
```
1. Abre "Mostrar Filtros"
2. Escribe el nombre del usuario en "Buscar"
3. Selecciona "Ingresos" en Tipo
4. Selecciona "Venta de Cartones" en Categoría
5. Verás solo los pagos de ese usuario
```

### **Caso 2: Ver premios pagados en diciembre**
```
1. Abre "Mostrar Filtros"
2. Selecciona "Egresos" en Tipo
3. Selecciona "Pago de Premios" en Categoría
4. Desde: 01/12/2025
5. Hasta: 31/12/2025
6. Verás todos los premios del mes
```

### **Caso 3: Encontrar la transacción más grande**
```
1. Abre "Mostrar Filtros"
2. Ordenar por: "Monto"
3. Orden: "Descendente"
4. La primera transacción será la más grande
```

---

## 🎨 Interfaz de Filtros

### **Panel Colapsable**
```
┌────────────────────────────────────────┐
│ [🔍 Mostrar Filtros] [Activos]  3 resultados │
│                                        │
│ ┌────────────────────────────────────┐│
│ │ Buscar: [___________________]      ││
│ │                                    ││
│ │ Tipo: [Todos ▼]  Categoría: [Todas ▼] ││
│ │ Ordenar: [Fecha ▼]  Orden: [Desc ▼]   ││
│ │                                    ││
│ │ Desde: [📅 01/12/2025]             ││
│ │ Hasta: [📅 31/12/2025]             ││
│ └────────────────────────────────────┘│
└────────────────────────────────────────┘
```

### **Paginación**
```
┌────────────────────────────────────────┐
│ Mostrando 21-40 de 150 transacciones  │
│                                        │
│        [←]  Página 2 de 8  [→]        │
└────────────────────────────────────────┘
```

---

## 🔧 Funciones Técnicas

### **getFilteredTransactions()**
Obtiene transacciones con filtros múltiples y paginación.

```typescript
const result = await getFilteredTransactions({
    type: 'income',
    category: 'ticket_sale',
    searchText: 'Juan',
    startDate: new Date('2025-12-01'),
    endDate: new Date('2025-12-31'),
    sortBy: 'amount',
    sortOrder: 'desc',
    page: 1,
    pageSize: 20
});

// Retorna:
// {
//   transactions: [...],
//   total: 150,
//   hasMore: true
// }
```

---

## 📈 Mejoras de Rendimiento

1. **Filtrado en Cliente**: Los filtros se aplican después de obtener datos para respuesta instantánea
2. **Paginación Eficiente**: Solo se cargan 20 transacciones a la vez
3. **Búsqueda Optimizada**: Búsqueda case-insensitive en descripciones
4. **Estado Persistente**: Los filtros se mantienen al cambiar de página

---

## 🎯 Casos de Uso Avanzados

### **Auditoría Financiera**
```
1. Filtrar por rango de fechas del mes
2. Exportar a CSV
3. Enviar a contador
```

### **Análisis de Ventas**
```
1. Filtrar solo "Ingresos"
2. Ordenar por "Monto" descendente
3. Ver quiénes compraron más cartones
```

### **Control de Gastos**
```
1. Filtrar solo "Egresos"
2. Ver total de premios pagados
3. Comparar con ingresos
```

---

## ⚠️ Notas Importantes

1. **Filtros Combinables**: Puedes usar múltiples filtros simultáneamente
2. **Búsqueda Inteligente**: No distingue mayúsculas/minúsculas
3. **Paginación Automática**: Solo aparece si hay más de 20 resultados
4. **Contador en Tiempo Real**: Muestra resultados encontrados al instante
5. **Estado Visual**: Badge "Activos" indica que hay filtros aplicados

---

## 🐛 Solución de Problemas

### **No aparecen resultados**
- Verifica que los filtros no sean demasiado restrictivos
- Haz clic en "Limpiar" para resetear
- Revisa las fechas seleccionadas

### **La búsqueda no encuentra nada**
- Verifica la ortografía
- Intenta con menos palabras
- Usa solo parte del nombre

### **La paginación no funciona**
- Refresca la página
- Verifica que haya más de 20 transacciones
- Revisa la consola por errores

---

## 📞 Próximas Mejoras (Fase 4+)

- [ ] Filtros guardados (presets)
- [ ] Exportar solo resultados filtrados
- [ ] Búsqueda por monto (rango)
- [ ] Filtros avanzados (AND/OR)
- [ ] Autocompletado en búsqueda
- [ ] Resaltar términos de búsqueda

---

**Última actualización**: 27 de diciembre de 2025  
**Versión**: 3.0.0 (Fase 3 Completa)  
**Estado**: ✅ Producción
