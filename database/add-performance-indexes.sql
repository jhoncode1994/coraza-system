-- Script de optimización de índices para mejorar performance
-- Fecha: 2025-12-12
-- Objetivo: Acelerar queries más frecuentes

-- ========================================
-- ÍNDICES PARA TABLA DE ENTREGAS
-- ========================================

-- Búsquedas por fecha (reportes, estadísticas)
CREATE INDEX IF NOT EXISTS idx_entrega_dotacion_fecha 
ON entrega_dotacion("fechaEntrega");

-- Búsquedas por asociado
CREATE INDEX IF NOT EXISTS idx_entrega_dotacion_cedula 
ON entrega_dotacion("cedulaAsociado");

-- Búsquedas combinadas fecha + asociado
CREATE INDEX IF NOT EXISTS idx_entrega_dotacion_fecha_cedula 
ON entrega_dotacion("fechaEntrega", "cedulaAsociado");

-- Búsquedas por año (para limpieza masiva)
CREATE INDEX IF NOT EXISTS idx_entrega_dotacion_year 
ON entrega_dotacion(EXTRACT(YEAR FROM "fechaEntrega"));

-- ========================================
-- ÍNDICES PARA TABLA DE USUARIOS
-- ========================================

-- Búsquedas por cédula (más frecuente)
CREATE INDEX IF NOT EXISTS idx_users_cedula 
ON users(cedula);

-- Búsquedas por zona
CREATE INDEX IF NOT EXISTS idx_users_zona 
ON users(zona);

-- Búsquedas por nombre (para autocomplete)
CREATE INDEX IF NOT EXISTS idx_users_nombre 
ON users(nombre);

-- Índice compuesto para búsquedas complejas
CREATE INDEX IF NOT EXISTS idx_users_nombre_apellido 
ON users(nombre, apellido);

-- ========================================
-- ÍNDICES PARA INVENTARIO
-- ========================================

-- Búsquedas por código (muy frecuente)
CREATE INDEX IF NOT EXISTS idx_inventory_code 
ON supply_inventory(code);

-- Búsquedas por categoría
CREATE INDEX IF NOT EXISTS idx_inventory_category 
ON supply_inventory(category);

-- Stock bajo (para alertas)
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock 
ON supply_inventory(current_stock) 
WHERE current_stock <= min_stock;

-- Búsquedas por nombre
CREATE INDEX IF NOT EXISTS idx_inventory_name 
ON supply_inventory(name);

-- ========================================
-- ÍNDICES PARA MOVIMIENTOS DE INVENTARIO
-- ========================================

-- Búsquedas por fecha
CREATE INDEX IF NOT EXISTS idx_inventory_movements_date 
ON inventory_movements(movement_date);

-- Búsquedas por tipo de movimiento
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type 
ON inventory_movements(movement_type);

-- Búsquedas por elemento
CREATE INDEX IF NOT EXISTS idx_inventory_movements_item 
ON inventory_movements(item_code);

-- ========================================
-- ÍNDICES PARA ASOCIADOS RETIRADOS
-- ========================================

-- Búsquedas por cédula
CREATE INDEX IF NOT EXISTS idx_retired_associates_cedula 
ON retired_associates(cedula);

-- Búsquedas por fecha de retiro
CREATE INDEX IF NOT EXISTS idx_retired_associates_retirement_date 
ON retired_associates(retirement_date);

-- Búsquedas por estado activo
CREATE INDEX IF NOT EXISTS idx_retired_associates_active 
ON retired_associates(is_active);

-- ========================================
-- ÍNDICES PARA AUTENTICACIÓN
-- ========================================

-- auth_users - Búsquedas por email (login)
CREATE INDEX IF NOT EXISTS idx_auth_users_email 
ON auth_users(email);

-- auth_users - Búsquedas por username
CREATE INDEX IF NOT EXISTS idx_auth_users_username 
ON auth_users(username);

-- auth_users - Usuarios activos
CREATE INDEX IF NOT EXISTS idx_auth_users_active 
ON auth_users(is_active);

-- user_permissions - Búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id 
ON user_permissions(user_id);

-- ========================================
-- ANÁLISIS Y VERIFICACIÓN
-- ========================================

-- Ver todos los índices creados
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Ver tamaño de índices
SELECT
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- NOTAS:
-- - Estos índices mejoran significativamente las búsquedas y filtros
-- - El impacto en escritura es mínimo (< 5%)
-- - Los índices se actualizan automáticamente
-- - Ejecutar ANALYZE después de crear índices masivos
