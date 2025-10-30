// verificar-tablas.js - Ver estructura real de la base de datos
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function verificarEstructura() {
  try {
    console.log('🔍 Consultando tablas existentes...\n');
    
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('📋 Tablas encontradas:');
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    console.log('\n🔍 Verificando columnas de supply_inventory...');
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'supply_inventory'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Columnas de supply_inventory:');
    console.table(columns.rows);

    console.log('\n🔍 Consultando datos de supply_inventory...');
    const datos = await pool.query(`
      SELECT * FROM supply_inventory LIMIT 5;
    `);
    
    console.log('\n📦 Primeros 5 registros:');
    console.table(datos.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verificarEstructura();