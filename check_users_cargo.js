const { Pool } = require('pg');

const pool = new Pool({
  host: 'ep-solitary-scene-adpyw2k4-pooler.c-2.us-east-1.aws.neon.tech',
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_expMyzc2PY1o',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

async function checkUsersCargo() {
  try {
    console.log('🔍 VERIFICANDO CAMPO CARGO EN USUARIOS');
    console.log('===================================\n');
    
    // Verificar estructura de la tabla users
    console.log('📋 Estructura de la tabla users:');
    const structure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    structure.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // Verificar datos actuales
    console.log('\n📊 Datos actuales en la tabla users:');
    const users = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    
    if (users.rows.length === 0) {
      console.log('   No hay usuarios en la tabla');
    } else {
      users.rows.forEach((user, index) => {
        console.log(`\n   Usuario ${index + 1}:`);
        console.log(`   - ID: ${user.id}`);
        console.log(`   - Nombre: ${user.nombre} ${user.apellido}`);
        console.log(`   - Cédula: ${user.cedula}`);
        console.log(`   - Zona: ${user.zona}`);
        console.log(`   - Cargo: ${user.cargo || 'NULL/VACÍO'}`);
        console.log(`   - Fecha ingreso: ${user.fecha_ingreso}`);
        console.log(`   - Creado: ${user.created_at}`);
      });
    }
    
    console.log('\n🎯 ANÁLISIS:');
    const usersWithCargo = users.rows.filter(user => user.cargo && user.cargo.trim() !== '');
    const usersWithoutCargo = users.rows.filter(user => !user.cargo || user.cargo.trim() === '');
    
    console.log(`   Total usuarios: ${users.rows.length}`);
    console.log(`   Con cargo: ${usersWithCargo.length}`);
    console.log(`   Sin cargo: ${usersWithoutCargo.length}`);
    
    if (usersWithoutCargo.length > 0) {
      console.log('\n⚠️  USUARIOS SIN CARGO:');
      usersWithoutCargo.forEach(user => {
        console.log(`   - ${user.nombre} ${user.apellido} (ID: ${user.id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsersCargo();
