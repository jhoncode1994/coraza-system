const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  username: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT || 5432,
  ssl: { rejectUnauthorized: false }
});

async function checkUsersTable() {
  try {
    const client = await pool.connect();
    
    console.log('📋 Verificando estructura de la tabla users...');
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.table(result.rows);
    
    console.log('\n👥 Usuarios existentes:');
    const users = await client.query('SELECT * FROM users LIMIT 5');
    console.table(users.rows);
    
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUsersTable();
