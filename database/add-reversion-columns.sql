-- Migración: Agregar columnas para marcar entregas como revertidas
-- Fecha: 2025-11-06

-- Agregar columna de estado
ALTER TABLE entrega_dotacion 
ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'revertida'));

-- Agregar columna de fecha de reversión
ALTER TABLE entrega_dotacion 
ADD COLUMN IF NOT EXISTS revertida_fecha TIMESTAMP;

-- Agregar columna de quién revirtió
ALTER TABLE entrega_dotacion 
ADD COLUMN IF NOT EXISTS revertida_por VARCHAR(100);

-- Agregar columna de motivo de reversión
ALTER TABLE entrega_dotacion 
ADD COLUMN IF NOT EXISTS motivo_reversion TEXT;

-- Crear índice para búsquedas por estado
CREATE INDEX IF NOT EXISTS idx_entrega_dotacion_estado ON entrega_dotacion(estado);

-- Actualizar entregas existentes a estado 'activa'
UPDATE entrega_dotacion 
SET estado = 'activa' 
WHERE estado IS NULL;

COMMENT ON COLUMN entrega_dotacion.estado IS 'Estado de la entrega: activa o revertida';
COMMENT ON COLUMN entrega_dotacion.revertida_fecha IS 'Fecha en que se revirtió la entrega';
COMMENT ON COLUMN entrega_dotacion.revertida_por IS 'Usuario que revirtió la entrega';
COMMENT ON COLUMN entrega_dotacion.motivo_reversion IS 'Motivo por el cual se revirtió la entrega';
