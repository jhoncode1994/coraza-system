const { Pool } = require('pg');

const pool = new Pool({
  host: 'ep-solitary-scene-adpyw2k4-pooler.c-2.us-east-1.aws.neon.tech',
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_expMyzc2PY1o',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

async function fixExistingUser() {
  try {
    console.log('🔧 CORRIGIENDO USUARIO SIN CARGO');
    console.log('===============================\n');
    
    // Buscar el usuario sin cargo
    console.log('1. Buscando usuario sin cargo...');
    const userWithoutCargo = await pool.query(
      'SELECT * FROM users WHERE cargo IS NULL OR cargo = \'\' ORDER BY created_at DESC LIMIT 1'
    );
    
    if (userWithoutCargo.rows.length === 0) {
      console.log('✅ No hay usuarios sin cargo');
      return;
    }
    
    const user = userWithoutCargo.rows[0];
    console.log(`   Usuario encontrado: ${user.nombre} ${user.apellido} (ID: ${user.id})`);
    console.log(`   Cargo actual: ${user.cargo || 'NULL/VACÍO'}`);
    
    // Preguntar al usuario qué cargo asignar
    console.log('\n2. ¿Qué cargo quieres asignar a este usuario?');
    console.log('   Opciones sugeridas: vigilante, presidente, secretario, tesorero, vocal');
    console.log('   Se asignará "vigilante" como valor por defecto...\n');
    
    // Actualizar con cargo por defecto
    const defaultCargo = 'vigilante';
    const updateResult = await pool.query(
      'UPDATE users SET cargo = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [defaultCargo, user.id]
    );
    
    const updatedUser = updateResult.rows[0];
    console.log('✅ Usuario actualizado exitosamente:');
    console.log(`   - Nombre: ${updatedUser.nombre} ${updatedUser.apellido}`);
    console.log(`   - Cargo: ${updatedUser.cargo}`);
    console.log(`   - Actualizado: ${updatedUser.updated_at}`);
    
    // Verificar estado final
    console.log('\n3. Verificando todos los usuarios...');
    const allUsers = await pool.query('SELECT id, nombre, apellido, cargo FROM users ORDER BY id');
    
    allUsers.rows.forEach(u => {
      const cargoStatus = u.cargo ? '✅' : '❌';
      console.log(`   ${cargoStatus} ID: ${u.id} | ${u.nombre} ${u.apellido} | Cargo: ${u.cargo || 'NULL'}`);
    });
    
    console.log('\n✅ CORRECCIÓN COMPLETADA');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixExistingUser();
