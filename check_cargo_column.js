const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: { require: true }
});

async function checkCargoColumn() {
  try {
    console.log('Verificando estructura de la tabla users...');
    
    // Consultar la estructura de la tabla users
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\nColumnas en la tabla users:');
    tableInfo.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    // Verificar si existe la columna cargo
    const cargoColumn = tableInfo.rows.find(row => row.column_name === 'cargo');
    
    if (cargoColumn) {
      console.log('\n✅ La columna "cargo" existe en la tabla users');
      console.log(`   Tipo: ${cargoColumn.data_type}`);
      console.log(`   Permite NULL: ${cargoColumn.is_nullable}`);
      
      // Verificar algunos registros existentes
      const sampleUsers = await pool.query('SELECT id, nombre, apellido, cargo FROM users LIMIT 5');
      console.log('\nPrimeros 5 usuarios con su cargo:');
      sampleUsers.rows.forEach(user => {
        console.log(`- ID ${user.id}: ${user.nombre} ${user.apellido} - Cargo: ${user.cargo || 'NULL'}`);
      });
      
    } else {
      console.log('\n❌ La columna "cargo" NO existe en la tabla users');
      console.log('Se necesita crear la columna cargo');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkCargoColumn();
