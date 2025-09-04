require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function verificarUsuarios() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando usuarios en la base de datos...\n');
    
    // Contar total de usuarios
    const countResult = await client.query('SELECT COUNT(*) as total FROM users');
    const totalUsuarios = countResult.rows[0].total;
    
    console.log(`📊 TOTAL DE USUARIOS: ${totalUsuarios}\n`);
    
    // Obtener los últimos 20 usuarios insertados
    const lastUsersResult = await client.query(`
      SELECT id, nombre, apellido, cedula, zona, cargo, fecha_ingreso, created_at
      FROM users 
      ORDER BY id DESC 
      LIMIT 20
    `);
    
    console.log('📋 ÚLTIMOS 20 USUARIOS INSERTADOS:');
    console.log('ID | Nombre | Apellido | Cédula | Zona | Cargo | Fecha Ingreso | Creado');
    console.log('---|--------|----------|--------|------|-------|---------------|--------');
    
    lastUsersResult.rows.forEach(user => {
      console.log(`${user.id} | ${user.nombre} | ${user.apellido} | ${user.cedula} | ${user.zona} | ${user.cargo} | ${user.fecha_ingreso} | ${user.created_at}`);
    });
    
    // Verificar rango de IDs
    const rangeResult = await client.query(`
      SELECT MIN(id) as min_id, MAX(id) as max_id 
      FROM users
    `);
    
    console.log(`\n📈 RANGO DE IDs: ${rangeResult.rows[0].min_id} - ${rangeResult.rows[0].max_id}`);
    
    // Contar usuarios por fecha de creación reciente
    const recentResult = await client.query(`
      SELECT DATE(created_at) as fecha, COUNT(*) as cantidad
      FROM users 
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY fecha DESC
    `);
    
    console.log('\n📅 USUARIOS INSERTADOS POR FECHA (últimos 7 días):');
    recentResult.rows.forEach(row => {
      console.log(`${row.fecha}: ${row.cantidad} usuarios`);
    });
    
  } catch (error) {
    console.error('❌ Error verificando usuarios:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

verificarUsuarios();
