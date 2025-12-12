const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixAndCreatePermissions() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Corrigiendo foreign key...\n');

    // Eliminar la foreign key incorrecta
    await client.query(`
      ALTER TABLE user_permissions 
      DROP CONSTRAINT IF EXISTS user_permissions_user_id_fkey
    `);
    console.log('✅ Foreign key anterior eliminada');

    // Crear la foreign key correcta hacia auth_users
    await client.query(`
      ALTER TABLE user_permissions 
      ADD CONSTRAINT user_permissions_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
    `);
    console.log('✅ Foreign key corregida hacia auth_users');

    // Insertar permisos para el usuario gerencia (ID 3)
    await client.query(`
      INSERT INTO user_permissions (
        user_id, 
        can_view_inventory, 
        can_edit_inventory, 
        can_view_associates, 
        can_edit_associates, 
        can_make_deliveries, 
        can_view_reports, 
        can_manage_users,
        created_at,
        updated_at
      )
      VALUES (3, true, false, true, false, false, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE SET
        can_view_inventory = true,
        can_edit_inventory = false,
        can_view_associates = true,
        can_edit_associates = false,
        can_make_deliveries = false,
        can_view_reports = true,
        can_manage_users = false,
        updated_at = CURRENT_TIMESTAMP
    `);
    console.log('✅ Permisos de gerencia creados\n');

    // Verificar
    const verify = await client.query(`
      SELECT 
        au.username,
        au.email,
        au.role,
        up.*
      FROM auth_users au
      JOIN user_permissions up ON au.id = up.user_id
      WHERE au.id = 3
    `);

    if (verify.rows.length > 0) {
      const user = verify.rows[0];
      console.log('✨ Usuario de gerencia configurado:\n');
      console.log('📧 Email: gerencia@coraza.com');
      console.log('🔑 Contraseña: gerencia123');
      console.log('\n🛡️  Permisos:');
      console.log(`   Ver inventario: ${user.can_view_inventory}`);
      console.log(`   Editar inventario: ${user.can_edit_inventory}`);
      console.log(`   Ver asociados: ${user.can_view_associates}`);
      console.log(`   Editar asociados: ${user.can_edit_associates}`);
      console.log(`   Realizar entregas: ${user.can_make_deliveries}`);
      console.log(`   Ver reportes: ${user.can_view_reports}`);
      console.log(`   Gestionar usuarios: ${user.can_manage_users}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixAndCreatePermissions()
  .then(() => {
    console.log('\n✅ Proceso completado');
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });
