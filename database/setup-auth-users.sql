-- Script SQL para agregar usuarios con sistema de roles y permisos
-- Ejecutar en la base de datos PostgreSQL (Neon)

-- 1. Crear tabla de usuarios de autenticación si no existe
CREATE TABLE IF NOT EXISTS auth_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'delivery_user',
    is_active BOOLEAN DEFAULT true,
    fecha_ingreso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear tabla de permisos si no existe
CREATE TABLE IF NOT EXISTS user_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES auth_users(id) ON DELETE CASCADE,
    can_view_inventory BOOLEAN DEFAULT false,
    can_edit_inventory BOOLEAN DEFAULT false,
    can_view_associates BOOLEAN DEFAULT false,
    can_edit_associates BOOLEAN DEFAULT false,
    can_make_deliveries BOOLEAN DEFAULT false,
    can_view_reports BOOLEAN DEFAULT false,
    can_manage_users BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Insertar usuario administrador
INSERT INTO auth_users (username, email, password_hash, role, fecha_ingreso)
VALUES ('Administrador', 'admin@coraza.com', '$2b$10$rI7S8kXzQj5KqWFO8wQhgeGjJ9vKo.UGjYVZ8YZ8YZ8YZ8YZ8YZ8YZ', 'admin', '2024-01-01 00:00:00')
ON CONFLICT (email) DO NOTHING;

-- 4. Insertar usuario entregador
INSERT INTO auth_users (username, email, password_hash, role, fecha_ingreso)
VALUES ('Usuario Entrega', 'entregador@coraza.com', '$2b$10$rI7S8kXzQj5KqWFO8wQhgeGjJ9vKo.UGjYVZ8YZ8YZ8YZ8YZ8YZ8YZ', 'delivery_user', '2024-01-15 00:00:00')
ON CONFLICT (email) DO NOTHING;

-- 5. Insertar permisos para administrador
INSERT INTO user_permissions (
    user_id, 
    can_view_inventory, 
    can_edit_inventory, 
    can_view_associates, 
    can_edit_associates, 
    can_make_deliveries, 
    can_view_reports, 
    can_manage_users
)
SELECT 
    id, 
    true, 
    true, 
    true, 
    true, 
    true, 
    true, 
    true
FROM auth_users 
WHERE email = 'admin@coraza.com'
AND NOT EXISTS (
    SELECT 1 FROM user_permissions WHERE user_id = auth_users.id
);

-- 6. Insertar permisos para usuario entregador
INSERT INTO user_permissions (
    user_id, 
    can_view_inventory, 
    can_edit_inventory, 
    can_view_associates, 
    can_edit_associates, 
    can_make_deliveries, 
    can_view_reports, 
    can_manage_users
)
SELECT 
    id, 
    true, 
    false, 
    true, 
    false, 
    true, 
    false, 
    false
FROM auth_users 
WHERE email = 'entregador@coraza.com'
AND NOT EXISTS (
    SELECT 1 FROM user_permissions WHERE user_id = auth_users.id
);

-- 7. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email);
CREATE INDEX IF NOT EXISTS idx_auth_users_username ON auth_users(username);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);

-- 8. Verificar que los datos se insertaron correctamente
SELECT 
    au.id,
    au.username,
    au.email,
    au.role,
    au.fecha_ingreso,
    up.can_view_inventory,
    up.can_edit_inventory,
    up.can_view_associates,
    up.can_edit_associates,
    up.can_make_deliveries,
    up.can_view_reports,
    up.can_manage_users
FROM auth_users au
LEFT JOIN user_permissions up ON au.id = up.user_id
ORDER BY au.id;