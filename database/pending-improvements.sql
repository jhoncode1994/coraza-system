-- ============================================================
-- SCRIPT DE MEJORAS - CORAZA SYSTEM
-- Ejecutar en horario no productivo
-- Fecha preparación: 26 de Enero 2026
-- ============================================================

-- ============================================================
-- 1. CREAR ÍNDICES FALTANTES (5 índices)
-- Tiempo estimado: 1-2 minutos
-- Riesgo: NINGUNO (solo mejora performance)
-- ============================================================

-- Índice para buscar entregas por usuario (acelera historial de entregas)
CREATE INDEX IF NOT EXISTS idx_entrega_dotacion_userid 
ON entrega_dotacion("userId");

-- Índice para buscar productos por código
CREATE INDEX IF NOT EXISTS idx_supply_inventory_code_unique 
ON supply_inventory(code);

-- Índice para filtrar productos por categoría
CREATE INDEX IF NOT EXISTS idx_supply_inventory_category_filter 
ON supply_inventory(category);

-- Índice para buscar movimientos por producto
CREATE INDEX IF NOT EXISTS idx_inventory_movements_supply_id 
ON inventory_movements(supply_id);

-- Índice para filtrar movimientos por fecha
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at 
ON inventory_movements(created_at DESC);

-- ============================================================
-- 2. AGREGAR COLUMNAS A TABLA USERS (Opcional)
-- Tiempo estimado: 30 segundos
-- Riesgo: NINGUNO (columnas opcionales)
-- ============================================================

-- Columna para estado del asociado (activo/inactivo/licencia)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'activo';

-- Columna para email del asociado
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Columna para teléfono del asociado
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS telefono VARCHAR(20);

-- ============================================================
-- 3. VERIFICAR RESULTADOS
-- ============================================================

-- Ver todos los índices creados
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Ver estructura actualizada de users
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;
