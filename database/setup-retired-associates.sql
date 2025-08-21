-- Script para aplicar las nuevas tablas de asociados retirados
-- Ejecutar este script en la base de datos PostgreSQL

\echo 'Creando tablas para asociados retirados...'

-- Tabla para asociados retirados
CREATE TABLE IF NOT EXISTS retired_associates (
    id SERIAL PRIMARY KEY,
    associate_id INTEGER NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    cedula VARCHAR(20) UNIQUE NOT NULL,
    zona INTEGER NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100),
    retired_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    retired_reason TEXT,
    retired_by INTEGER, -- ID del usuario que procesó el retiro
    original_creation_date TIMESTAMP,
    FOREIGN KEY (retired_by) REFERENCES users(id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_retired_associates_cedula ON retired_associates(cedula);
CREATE INDEX IF NOT EXISTS idx_retired_associates_zone ON retired_associates(zona);
CREATE INDEX IF NOT EXISTS idx_retired_associates_date ON retired_associates(retired_date);

-- Tabla para mantener el historial de dotaciones de asociados retirados
CREATE TABLE IF NOT EXISTS retired_associate_supply_history (
    id SERIAL PRIMARY KEY,
    retired_associate_id INTEGER NOT NULL,
    original_delivery_id INTEGER,
    elemento VARCHAR(200) NOT NULL,
    cantidad INTEGER NOT NULL,
    delivered_at TIMESTAMP,
    signature_data TEXT,
    observaciones TEXT,
    retired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (retired_associate_id) REFERENCES retired_associates(id) ON DELETE CASCADE
);

-- Índice para el historial de retirados
CREATE INDEX IF NOT EXISTS idx_retired_history_associate ON retired_associate_supply_history(retired_associate_id);
CREATE INDEX IF NOT EXISTS idx_retired_history_date ON retired_associate_supply_history(delivered_at);

\echo 'Tablas creadas exitosamente!'

-- Verificar que las tablas se crearon correctamente
SELECT 'retired_associates' as tabla, count(*) as registros FROM retired_associates
UNION ALL
SELECT 'retired_associate_supply_history' as tabla, count(*) as registros FROM retired_associate_supply_history;

\echo 'Verificación completada. Sistema listo para manejar asociados retirados.'
