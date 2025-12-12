// Script para crear usuario de gerencia en la base de datos
// Ejecutar con: node scripts/create-auditor-user.js

const bcrypt = require('bcrypt');
const { Pool } = require('pg');

// Configuración de la base de datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createGerenciaUser() {
  const client = await pool.connect();
  
  try {
    console.log('🔐 Creando usuario de gerencia...\n');

    // 1. Generar hash de la contraseña
    const password = 'gerencia123';
    const passwordHash = await bcrypt.hash(password, 10);
    
    console.log('✅ Hash de contraseña generado');

    // 2. Verificar si el usuario ya existe
    const checkUser = await client.query(
      'SELECT id, email FROM auth_users WHERE email = $1',
      ['gerencia@coraza.com']
    );

    let userId;

    if (checkUser.rows.length > 0) {
      console.log('⚠️  Usuario de gerencia ya existe, actualizando...');
      userId = checkUser.rows[0].id;
      
      // Actualizar usuario existente
      await client.query(
        `UPDATE auth_users 
         SET username = $1, password_hash = $2, role = $3, is_active = true, updated_at = CURRENT_TIMESTAMP
         WHERE email = $4`,
        ['Usuario Gerencia', passwordHash, 'gerencia', 'gerencia@coraza.com']
      );
    } else {
      // Insertar nuevo usuario
      const insertUser = await client.query(
        `INSERT INTO auth_users (username, email, password_hash, role, fecha_ingreso, is_active)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, true)
         RETURNING id`,
        ['Usuario Gerencia', 'gerencia@coraza.com', passwordHash, 'gerencia']
      );
      userId = insertUser.rows[0].id;
      console.log('✅ Usuario de gerencia creado');
    }

    // 3. Verificar si los permisos ya existen
    const checkPermissions = await client.query(
      'SELECT id FROM user_permissions WHERE user_id = $1',
      [userId]
    );

    if (checkPermissions.rows.length > 0) {
      // Actualizar permisos existentes
      await client.query(
        `UPDATE user_permissions
         SET can_view_inventory = true,
             can_edit_inventory = false,
             can_view_associates = true,
             can_edit_associates = false,
             can_make_deliveries = false,
             can_view_reports = true,
             can_manage_users = false,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1`,
        [userId]
      );
      console.log('✅ Permisos actualizados');
    } else {
      // Insertar nuevos permisos
      await client.query(
        `INSERT INTO user_permissions (
          user_id, 
          can_view_inventory, 
          can_edit_inventory, 
          can_view_associates, 
          can_edit_associates, 
          can_make_deliveries, 
          can_view_reports, 
          can_manage_users
        )
        VALUES ($1, true, false, true, false, false, true, false)`,
        [userId]
      );
      console.log('✅ Permisos creados');
    }

    // 4. Verificar que todo está correcto
    const verifyUser = await client.query(
      `SELECT 
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
      WHERE au.email = 'gerencia@coraza.com'`
    );

    if (verifyUser.rows.length > 0) {
      const user = verifyUser.rows[0];
      console.log('\n✨ Usuario de gerencia configurado exitosamente:\n');
      console.log('📋 Información del usuario:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Usuario: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Rol: ${user.role}`);
      console.log(`   Activo: ${user.is_active ? 'Sí' : 'No'}`);
      console.log('\n🔑 Credenciales de acceso:');
      console.log(`   Email: gerencia@coraza.com`);
      console.log(`   Contraseña: gerencia123`);
      console.log('\n🛡️  Permisos:');
      console.log(`   ✅ Ver inventario: ${user.can_view_inventory ? 'Sí' : 'No'}`);
      console.log(`   ${user.can_edit_inventory ? '✅' : '❌'} Editar inventario: ${user.can_edit_inventory ? 'Sí' : 'No'}`);
      console.log(`   ✅ Ver asociados: ${user.can_view_associates ? 'Sí' : 'No'}`);
      console.log(`   ${user.can_edit_associates ? '✅' : '❌'} Editar asociados: ${user.can_edit_associates ? 'Sí' : 'No'}`);
      console.log(`   ${user.can_make_deliveries ? '✅' : '❌'} Realizar entregas: ${user.can_make_deliveries ? 'Sí' : 'No'}`);
      console.log(`   ✅ Ver reportes: ${user.can_view_reports ? 'Sí' : 'No'}`);
      console.log(`   ${user.can_manage_users ? '✅' : '❌'} Gestionar usuarios: ${user.can_manage_users ? 'Sí' : 'No'}`);
      console.log('\n💡 Este usuario puede ver todos los movimientos y descargar PDFs para auditoría.');
      console.log('💡 NO puede realizar modificaciones, entregas ni gestionar usuarios.\n');
    }

  } catch (error) {
    console.error('❌ Error al crear usuario de gerencia:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar script
createGerenciaUser()
  .then(() => {
    console.log('✅ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en el script:', error);
    process.exit(1);
  });
