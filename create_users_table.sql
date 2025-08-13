-- Crear tabla de usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    cedula VARCHAR(20) NOT NULL UNIQUE,
    zona INTEGER NOT NULL,
    fecha_ingreso DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsquedas frecuentes por cédula
CREATE INDEX idx_usuarios_cedula ON usuarios(cedula);

-- Índice para filtrado por zona
CREATE INDEX idx_usuarios_zona ON usuarios(zona);

-- Comentarios para documentar la tabla
COMMENT ON TABLE usuarios IS 'Tabla para almacenar la información de usuarios del sistema Coraza';
COMMENT ON COLUMN usuarios.id IS 'Identificador único autoincremental';
COMMENT ON COLUMN usuarios.nombre IS 'Nombre del usuario';
COMMENT ON COLUMN usuarios.apellido IS 'Apellido del usuario';
COMMENT ON COLUMN usuarios.cedula IS 'Número de cédula (identificación) del usuario. Debe ser único';
COMMENT ON COLUMN usuarios.zona IS 'Zona asignada al usuario';
COMMENT ON COLUMN usuarios.fecha_ingreso IS 'Fecha en que el usuario ingresó al sistema';
COMMENT ON COLUMN usuarios.created_at IS 'Fecha y hora de creación del registro';
COMMENT ON COLUMN usuarios.updated_at IS 'Fecha y hora de última actualización del registro';

-- Datos de ejemplo iniciales (opcional)
INSERT INTO usuarios (nombre, apellido, cedula, zona, fecha_ingreso) VALUES
('Juan', 'Pérez', '1234567890', 1, '2025-07-15'),
('María', 'López', '0987654321', 2, '2025-08-01');

-- Función trigger para actualizar automáticamente el timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar el timestamp cada vez que un registro se actualiza
CREATE TRIGGER update_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
