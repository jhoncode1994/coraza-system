# 📋 MEJORAS PENDIENTES - CORAZA SYSTEM

## Estado: ⏸️ EN PAUSA (Pendiente ejecución en horario no productivo)

**Fecha de Revisión:** 26 de Enero 2026  
**Revisado por:** GitHub Copilot

---

## 🎯 RESUMEN EJECUTIVO

| # | Mejora | Tiempo Est. | Prioridad | Estado |
|---|--------|-------------|-----------|--------|
| 1 | Índices de Base de Datos | 10 min | 🔴 ALTA | ⏳ Pendiente |
| 2 | Consolidar Tablas de Usuarios | 30 min | 🟡 MEDIA | ⏳ Pendiente |
| 3 | Columnas Nuevas en Users | 20 min | 🟢 BAJA | ⏳ Pendiente |
| 4 | Lazy Loading en Angular | 2 hrs | 🟡 MEDIA | 📅 Futuro |
| 5 | Paginación en Backend | 2 hrs | 🟡 MEDIA | 📅 Futuro |
| 6 | Implementación PWA | 4+ hrs | 🟢 BAJA | 📅 Futuro |

---

## 📌 MEJORA 1: ÍNDICES DE BASE DE DATOS

### ¿Qué es?
Los índices son estructuras de datos que aceleran las consultas SQL, similar a un índice en un libro que permite encontrar información rápidamente sin leer todo el contenido.

### ¿Por qué es necesaria?
Actualmente la base de datos tiene **1,806 registros** y creciendo. Sin índices, cada consulta debe revisar TODOS los registros (full table scan). Con índices, las consultas van directamente a los datos necesarios.

### Índices a crear:

| Índice | Tabla | Propósito |
|--------|-------|-----------|
| `idx_entrega_dotacion_userid` | entrega_dotacion | Buscar entregas de un asociado específico |
| `idx_supply_inventory_code_unique` | supply_inventory | Buscar productos por código |
| `idx_supply_inventory_category_filter` | supply_inventory | Filtrar productos por categoría |
| `idx_inventory_movements_supply_id` | inventory_movements | Ver historial de un producto |
| `idx_inventory_movements_created_at` | inventory_movements | Ordenar movimientos por fecha |

### Beneficio esperado:
- Consultas **50-80% más rápidas**
- Mejor rendimiento al filtrar y buscar
- Reportes más ágiles

### Cómo ejecutar:
```bash
node scripts/apply-pending-improvements.js
```

---

## 📌 MEJORA 2: CONSOLIDAR TABLAS DE USUARIOS

### ¿Qué es?
Actualmente existen DOS tablas de usuarios administrativos:
- `auth_users` (3 registros)
- `admin_users` (5 registros)

### ¿Por qué es necesaria?
Tener dos tablas para lo mismo genera:
- Confusión sobre cuál usar
- Posibles inconsistencias de datos
- Código duplicado para manejar ambas

### Estado actual:
| Tabla | Usuarios |
|-------|----------|
| auth_users | 3 |
| admin_users | 5 |

### Acción requerida:
1. Decidir cuál tabla mantener (recomendado: `admin_users`)
2. Migrar datos de `auth_users` → `admin_users`
3. Actualizar código para usar solo una tabla
4. Eliminar tabla obsoleta

### ⚠️ IMPORTANTE:
Esta mejora requiere análisis adicional antes de ejecutar. No incluida en el script automático.

---

## 📌 MEJORA 3: COLUMNAS NUEVAS EN USERS

### ¿Qué es?
Agregar campos adicionales a la tabla `users` para mejor gestión de asociados.

### ¿Por qué es necesaria?
Permite:
- Marcar asociados como inactivos sin eliminarlos
- Tener información de contacto
- Mejor reportería

### Columnas a agregar:

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `estado` | VARCHAR(20) | 'activo', 'inactivo', 'licencia', 'retirado' |
| `email` | VARCHAR(255) | Email de contacto |
| `telefono` | VARCHAR(20) | Teléfono de contacto |

### Cómo ejecutar:
```bash
node scripts/apply-pending-improvements.js
```

---

## 📌 MEJORA 4: LAZY LOADING EN ANGULAR

### ¿Qué es?
Técnica que carga los módulos de Angular solo cuando el usuario los necesita, en lugar de cargar todo al inicio.

### ¿Por qué es necesaria?
Actualmente toda la aplicación se carga de golpe al iniciar:
- Tiempo de carga inicial más largo
- Mayor uso de memoria
- Afecta dispositivos móviles

### Beneficio esperado:
- Reducción **40-60%** en tiempo de carga inicial
- Mejor experiencia en dispositivos móviles
- Menor consumo de datos

### Archivos a modificar:
- `src/app/app-routing.module.ts`
- Crear módulos separados para cada funcionalidad

### ⚠️ NOTA:
Esta mejora requiere reestructuración de código. Tiempo estimado: 2 horas.

---

## 📌 MEJORA 5: PAGINACIÓN EN BACKEND

### ¿Qué es?
En lugar de devolver TODOS los registros de una vez, dividirlos en "páginas" de resultados.

### ¿Por qué es necesaria?
Con 784 asociados y 380 entregas:
- Cargar todo consume memoria
- Tiempos de respuesta lentos
- Saturación de red

### Ejemplo:
```
Antes: GET /api/users → 784 registros (lento)
Después: GET /api/users?page=1&limit=50 → 50 registros (rápido)
```

### Endpoints a modificar:
- `/api/users` - Lista de asociados
- `/api/supply-inventory` - Lista de productos
- `/api/delivery` - Historial de entregas
- `/api/inventory-movements` - Movimientos

### ⚠️ NOTA:
Requiere modificar backend y frontend. Tiempo estimado: 2 horas.

---

## 📌 MEJORA 6: IMPLEMENTACIÓN PWA

### ¿Qué es?
Progressive Web App - Permite que la aplicación web funcione como app nativa en móviles.

### ¿Por qué es necesaria?
- Instalar en pantalla de inicio del teléfono
- Funcionar sin conexión (modo offline)
- Notificaciones push
- Mejor rendimiento

### Estado actual:
- ✅ `manifest.json` existe
- ❌ Service Worker no implementado
- ❌ Estrategias de cache no configuradas

### Archivos necesarios:
- `ngsw-config.json` - Configuración de Service Worker
- Actualizar `angular.json` para PWA
- Configurar estrategias de cache

### ⚠️ NOTA:
Proyecto complejo. Tiempo estimado: 4+ horas. Recomendado como proyecto separado.

---

## 📁 ARCHIVOS CREADOS

| Archivo | Propósito |
|---------|-----------|
| `scripts/apply-pending-improvements.js` | Script para aplicar mejoras 1 y 3 |
| `database/pending-improvements.sql` | SQL directo para mejoras en BD |
| `MEJORAS-PENDIENTES.md` | Este documento |

---

## 🚀 INSTRUCCIONES DE EJECUCIÓN

### Para mejoras 1 y 3 (Índices y Columnas):

```bash
# Navegar al proyecto
cd c:\Users\USUARIO\Documents\coraza-system

# Ejecutar script de mejoras
node scripts/apply-pending-improvements.js
```

### Para mejoras 2, 4, 5, 6:
Requieren análisis y desarrollo adicional. Planificar como tareas separadas.

---

## ✅ VERIFICACIÓN POST-MEJORAS

Después de aplicar las mejoras, verificar:

1. **Índices creados:**
```sql
SELECT indexname FROM pg_indexes WHERE schemaname = 'public';
```

2. **Columnas agregadas:**
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users';
```

3. **Probar la aplicación:**
- Login funciona ✓
- Lista de asociados carga ✓
- Entregas se registran ✓
- Inventario actualiza ✓

---

**Documentado por:** GitHub Copilot  
**Última actualización:** 26 de Enero 2026
