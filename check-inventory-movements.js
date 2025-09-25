const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkInventoryMovementsTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando estructura de inventory_movements...\n');
    
    // Verificar si la tabla existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'inventory_movements'
      );
    `);
    
    console.log('Tabla inventory_movements existe:', tableExists.rows[0].exists);
    
    if (tableExists.rows[0].exists) {
      // Obtener estructura de columnas
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'inventory_movements'
        ORDER BY ordinal_position
      `);
      
      console.log('\nColumnas en inventory_movements:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
      
      // Mostrar algunos registros si existen
      const sampleCount = await client.query('SELECT COUNT(*) FROM inventory_movements');
      console.log(`\nTotal de registros: ${sampleCount.rows[0].count}`);
      
      if (parseInt(sampleCount.rows[0].count) > 0) {
        const sample = await client.query('SELECT * FROM inventory_movements LIMIT 3');
        console.log('\nPrimeros registros:');
        sample.rows.forEach((row, index) => {
          console.log(`\nRegistro ${index + 1}:`);
          Object.entries(row).forEach(([key, value]) => {
            console.log(`  ${key}: ${value}`);
          });
        });
      }
    } else {
      console.log('❌ La tabla inventory_movements no existe');
      
      console.log('\n🛠️  Creando tabla inventory_movements...');
      await client.query(`
        CREATE TABLE inventory_movements (
          id SERIAL PRIMARY KEY,
          supply_id VARCHAR(255) NOT NULL,
          movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN ('ENTRADA', 'SALIDA')),
          quantity INTEGER NOT NULL,
          reason TEXT,
          usuario VARCHAR(255) DEFAULT 'Sistema',
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      
      console.log('✅ Tabla inventory_movements creada exitosamente');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkInventoryMovementsTable();