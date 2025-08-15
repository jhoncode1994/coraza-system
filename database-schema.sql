-- Create users table for Coraza System
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    position VARCHAR(100),
    department VARCHAR(100),
    hire_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO users (first_name, last_name, email, position, department) VALUES 
('Juan', 'Pérez', 'juan.perez@coraza.com', 'Desarrollador', 'IT'),
('María', 'González', 'maria.gonzalez@coraza.com', 'Analista', 'Finanzas'),
('Carlos', 'López', 'carlos.lopez@coraza.com', 'Gerente', 'Operaciones'),
('Ana', 'Martínez', 'ana.martinez@coraza.com', 'Diseñadora', 'Marketing')
ON CONFLICT (email) DO NOTHING;

-- Create supply inventory table
CREATE TABLE IF NOT EXISTS supply_inventory (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    quantity INTEGER DEFAULT 0,
    minimum_quantity INTEGER DEFAULT 10,
    unit_price DECIMAL(10,2),
    description TEXT,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample supply data
INSERT INTO supply_inventory (code, name, category, quantity, minimum_quantity, unit_price, description) VALUES 
('UNI-001', 'Camisa Polo Azul', 'uniforme', 25, 10, 45000, 'Camisa polo azul marino talla M'),
('UNI-002', 'Pantalón Cargo Negro', 'uniforme', 15, 8, 75000, 'Pantalón cargo negro talla 32'),
('ACC-001', 'Gorra Corporativa', 'accesorios', 30, 15, 25000, 'Gorra con logo corporativo'),
('ACC-002', 'Corbata Azul', 'accesorios', 20, 10, 35000, 'Corbata azul marino'),
('UNI-003', 'Chaqueta Corporativa', 'uniforme', 8, 5, 120000, 'Chaqueta formal corporativa')
ON CONFLICT (code) DO NOTHING;
