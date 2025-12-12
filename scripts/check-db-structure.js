// Script para verificar la estructura de la base de datos
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkStructure() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando estructura de la base de datos...\n');

    // Verificar tablas existentes
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%user%' OR table_name LIKE '%auth%'
    `);
    
    console.log('📋 Tablas encontradas:');
    tables.rows.forEach(row => console.log(`   - ${row.table_name}`));
    
    // Verificar columnas de cada tabla
    for (const table of tables.rows) {
      console.log(`\n📊 Estructura de ${table.table_name}:`);
      const columns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1
      `, [table.table_name]);
      
      columns.rows.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkStructure();
