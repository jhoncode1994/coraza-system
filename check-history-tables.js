const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkHistoryTables() {
  const client = await pool.connect();
  
  try {
    console.log('=== VERIFICANDO TABLAS DE HISTORIAL ===\n');
    
    // 1. Verificar estructura de entrega_dotacion
    console.log('1. Estructura de entrega_dotacion:');
    const entregaStructure = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'entrega_dotacion'
      ORDER BY ordinal_position
    `);
    console.table(entregaStructure.rows);
    
    // 2. Verificar contenido de entrega_dotacion
    console.log('\n2. Contenido de entrega_dotacion:');
    const entregaData = await client.query('SELECT * FROM entrega_dotacion LIMIT 10');
    console.log(`Total registros en entrega_dotacion: ${entregaData.rowCount}`);
    if (entregaData.rows.length > 0) {
      console.log('Primeros registros:');
      console.table(entregaData.rows);
    }
    
    // 3. Verificar estructura de retired_associate_supply_history
    console.log('\n3. Estructura de retired_associate_supply_history:');
    try {
      const retiredStructure = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'retired_associate_supply_history'
        ORDER BY ordinal_position
      `);
      console.table(retiredStructure.rows);
      
      // 4. Verificar contenido de retired_associate_supply_history
      console.log('\n4. Contenido de retired_associate_supply_history:');
      const retiredData = await client.query('SELECT * FROM retired_associate_supply_history');
      console.log(`Total registros en retired_associate_supply_history: ${retiredData.rowCount}`);
      if (retiredData.rows.length > 0) {
        console.log('Registros:');
        console.table(retiredData.rows);
      }
    } catch (error) {
      console.log('La tabla retired_associate_supply_history no existe o no es accesible');
      console.log('Error:', error.message);
    }
    
    // 5. Verificar retired_associates
    console.log('\n5. Asociados retirados:');
    try {
      const retiredAssociates = await client.query('SELECT * FROM retired_associates');
      console.log(`Total asociados retirados: ${retiredAssociates.rowCount}`);
      if (retiredAssociates.rows.length > 0) {
        console.table(retiredAssociates.rows);
      }
    } catch (error) {
      console.log('Error accediendo a retired_associates:', error.message);
    }
    
  } catch (error) {
    console.error('Error general:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

checkHistoryTables();
