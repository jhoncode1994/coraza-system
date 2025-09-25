const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkTableStructure() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando estructura de la tabla supply_inventory...\n');
    
    // Obtener información sobre las columnas
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'supply_inventory'
      ORDER BY ordinal_position
    `);
    
    console.log('Columnas en supply_inventory:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Mostrar algunos registros para entender la estructura
    console.log('\n📋 Primeros 5 registros:');
    const sample = await client.query(`
      SELECT * FROM supply_inventory LIMIT 5
    `);
    
    if (sample.rows.length > 0) {
      console.log('Columnas disponibles:', Object.keys(sample.rows[0]));
      sample.rows.forEach((row, index) => {
        console.log(`\nRegistro ${index + 1}:`);
        Object.entries(row).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTableStructure();
