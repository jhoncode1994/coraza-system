require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function consultasComunes() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Probando diferentes consultas...\n');
    
    // Consulta básica SIN LIMIT
    const result1 = await client.query('SELECT COUNT(*) FROM users');
    console.log(`📊 COUNT(*): ${result1.rows[0].count}`);
    
    // Consulta con LIMIT 100
    const result2 = await client.query('SELECT * FROM users LIMIT 100');
    console.log(`📋 LIMIT 100: ${result2.rows.length} filas`);
    
    // Últimos 10 IDs
    const result3 = await client.query('SELECT id FROM users ORDER BY id DESC LIMIT 10');
    console.log('🆔 Últimos 10 IDs:', result3.rows.map(r => r.id));
    
    // Primeros 10 IDs
    const result4 = await client.query('SELECT id FROM users ORDER BY id ASC LIMIT 10');
    console.log('🆔 Primeros 10 IDs:', result4.rows.map(r => r.id));
    
    // Usuarios por página (simulando paginación)
    const result5 = await client.query('SELECT COUNT(*) FROM users WHERE id >= 500');
    console.log(`📄 Usuarios con ID >= 500: ${result5.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

consultasComunes();
