-- Script para agregar género a las tallas de botas
-- Ejecutar en la base de datos PostgreSQL (Neon)

-- 1. Agregar columna de género a la tabla de tallas
ALTER TABLE tallas_disponibles 
ADD COLUMN IF NOT EXISTS genero VARCHAR(1) CHECK (genero IN ('M', 'F', NULL));

-- 2. Agregar columna de género a entrega_dotacion para registrar el género entregado
ALTER TABLE entrega_dotacion 
ADD COLUMN IF NOT EXISTS genero_talla VARCHAR(1) CHECK (genero_talla IN ('M', 'F', NULL));

-- 3. Agregar índice para mejorar búsquedas por género
CREATE INDEX IF NOT EXISTS idx_tallas_genero ON tallas_disponibles(genero);
CREATE INDEX IF NOT EXISTS idx_entrega_genero ON entrega_dotacion(genero_talla);

-- 4. Insertar tallas 34 y 35 para botas (si no existen)
-- Primero verificamos qué productos son botas
-- Asumiendo que los códigos de botas contienen 'BOTA' o similar

-- Insertar tallas 34 Mujer para todas las botas existentes
INSERT INTO tallas_disponibles (inventario_id, talla, cantidad, genero)
SELECT 
    id,
    '34',
    0,
    'F'
FROM supply_inventory 
WHERE UPPER(codigo) LIKE '%BOTA%'
AND id NOT IN (
    SELECT inventario_id 
    FROM tallas_disponibles 
    WHERE talla = '34' AND genero = 'F'
)
ON CONFLICT DO NOTHING;

-- Insertar tallas 34 Hombre para todas las botas existentes
INSERT INTO tallas_disponibles (inventario_id, talla, cantidad, genero)
SELECT 
    id,
    '34',
    0,
    'M'
FROM supply_inventory 
WHERE UPPER(codigo) LIKE '%BOTA%'
AND id NOT IN (
    SELECT inventario_id 
    FROM tallas_disponibles 
    WHERE talla = '34' AND genero = 'M'
)
ON CONFLICT DO NOTHING;

-- Insertar tallas 35 Mujer para todas las botas existentes
INSERT INTO tallas_disponibles (inventario_id, talla, cantidad, genero)
SELECT 
    id,
    '35',
    0,
    'F'
FROM supply_inventory 
WHERE UPPER(codigo) LIKE '%BOTA%'
AND id NOT IN (
    SELECT inventario_id 
    FROM tallas_disponibles 
    WHERE talla = '35' AND genero = 'F'
)
ON CONFLICT DO NOTHING;

-- Insertar tallas 35 Hombre para todas las botas existentes
INSERT INTO tallas_disponibles (inventario_id, talla, cantidad, genero)
SELECT 
    id,
    '35',
    0,
    'M'
FROM supply_inventory 
WHERE UPPER(codigo) LIKE '%BOTA%'
AND id NOT IN (
    SELECT inventario_id 
    FROM tallas_disponibles 
    WHERE talla = '35' AND genero = 'M'
)
ON CONFLICT DO NOTHING;

-- 5. Actualizar tallas existentes de botas con género por defecto
-- Las tallas pequeñas (34-39) por defecto serán Femeninas
UPDATE tallas_disponibles 
SET genero = 'F'
WHERE genero IS NULL 
AND talla IN ('34', '35', '36', '37', '38', '39')
AND inventario_id IN (
    SELECT id FROM supply_inventory WHERE UPPER(codigo) LIKE '%BOTA%'
);

-- Las tallas grandes (40+) por defecto serán Masculinas
UPDATE tallas_disponibles 
SET genero = 'M'
WHERE genero IS NULL 
AND CAST(talla AS INTEGER) >= 40
AND inventario_id IN (
    SELECT id FROM supply_inventory WHERE UPPER(codigo) LIKE '%BOTA%'
);

-- 6. Verificar resultados
SELECT 
    si.codigo,
    si.nombre,
    td.talla,
    td.genero,
    td.cantidad
FROM tallas_disponibles td
JOIN supply_inventory si ON td.inventario_id = si.id
WHERE UPPER(si.codigo) LIKE '%BOTA%'
ORDER BY si.codigo, 
         CASE WHEN td.genero = 'F' THEN 1 ELSE 2 END,
         CAST(td.talla AS INTEGER);

-- 7. Comentarios para referencia
COMMENT ON COLUMN tallas_disponibles.genero IS 'Género de la talla: M=Masculino, F=Femenino, NULL=Sin especificar';
COMMENT ON COLUMN entrega_dotacion.genero_talla IS 'Género de la talla entregada: M=Masculino, F=Femenino';