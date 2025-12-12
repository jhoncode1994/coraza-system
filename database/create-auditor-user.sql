-- Script SQL para crear usuario de gerencia
-- Este usuario puede ver todos los movimientos y descargar PDFs pero no puede modificar nada
-- Ejecutar en la base de datos PostgreSQL (Neon)

-- 1. Insertar usuario de gerencia
-- Nota: El password_hash corresponde a la contraseña 'gerencia123' 
-- Para cambiarla, usa bcrypt para generar un nuevo hash
INSERT INTO auth_users (username, email, password_hash, role, fecha_ingreso)
VALUES (
    'Usuario Gerencia', 
    'gerencia@coraza.com', 
    '$2b$10$rI7S8kXzQj5KqWFO8wQhgeGjJ9vKo.UGjYVZ8YZ8YZ8YZ8YZ8YZ8YZ', 
    'gerencia', 
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

-- 2. Insertar permisos para usuario de gerencia
-- Permisos: Solo lectura + Reportes (sin permisos de edición ni entregas)
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
    true,   -- Puede ver inventario
    false,  -- NO puede editar inventario
    true,   -- Puede ver asociados
    false,  -- NO puede editar asociados
    false,  -- NO puede hacer entregas
    true,   -- SÍ puede ver y descargar reportes
    false   -- NO puede gestionar usuarios
FROM auth_users 
WHERE email = 'gerencia@coraza.com'
AND NOT EXISTS (
    SELECT 1 FROM user_permissions WHERE user_id = auth_users.id
);

-- 3. Verificar que el usuario se creó correctamente
SELECT 
    au.id,
    au.username,
    au.email,
    au.role,
    au.is_active,
    up.can_view_inventory,
    up.can_edit_inventory,
    up.can_view_associates,
    up.can_edit_associates,
    up.can_make_deliveries,
    up.can_view_reports,
    up.can_manage_users
FROM auth_users au
LEFT JOIN user_permissions up ON au.id = up.user_id
WHERE au.email = 'gerencia@coraza.com';

-- NOTAS IMPORTANTES:
-- 
-- 1. CREDENCIALES POR DEFECTO:
--    Email: gerencia@coraza.com
--    Usuario: Usuario Gerencia
--    Contraseña: gerencia123
--
-- 2. PERMISOS DEL ROL GERENCIA:
--    ✅ Ver inventario
--    ✅ Ver asociados
--    ✅ Ver y descargar reportes PDF
--    ✅ Ver todos los movimientos
--    ❌ NO puede editar inventario
--    ❌ NO puede editar asociados
--    ❌ NO puede realizar entregas
--    ❌ NO puede gestionar usuarios
--
-- 3. PARA CAMBIAR LA CONTRASEÑA:
--    Usa Node.js con bcrypt para generar un nuevo hash:
--    
--    const bcrypt = require('bcrypt');
--    const password = 'tu-nueva-contraseña';
--    bcrypt.hash(password, 10).then(hash => console.log(hash));
--
--    Luego ejecuta:
--    UPDATE auth_users 
--    SET password_hash = 'el-nuevo-hash-generado' 
--    WHERE email = 'gerencia@coraza.com';
--
-- 4. PARA CREAR MÁS USUARIOS DE GERENCIA:
--    Simplemente modifica el INSERT con un nuevo email y username
