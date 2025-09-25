const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkTableStructure() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando estructura de supply_inventory...');
    
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'supply_inventory'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Columnas en supply_inventory:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    console.log('\n🔍 Verificando estructura de entrega_dotacion...');
    
    const result2 = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'entrega_dotacion'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Columnas en entrega_dotacion:');
    result2.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
  } catch (error) {
    console.error('❌ Error verificando estructura:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTableStructure();