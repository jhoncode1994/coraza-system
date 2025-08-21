// check-database-tables.js - Script para revisar las tablas de la base de datos
require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function checkTables() {
  console.log('🔍 Revisando tablas en la base de datos...\n');
  
  try {
    // Obtener lista de todas las tablas
    const tablesResult = await pool.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('📋 TABLAS ENCONTRADAS:');
    console.log('========================');
    
    for (const table of tablesResult.rows) {
      console.log(`\n🗂️  TABLA: ${table.table_name.toUpperCase()}`);
      
      // Obtener estructura de cada tabla
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position;
      `, [table.table_name]);
      
      console.log('   Columnas:');
      columnsResult.rows.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? '* REQUERIDO' : ''}`);
      });
      
      // Contar registros
      const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table.table_name};`);
      console.log(`   📊 Registros: ${countResult.rows[0].count}`);
      
      // Descripción de cada tabla
      switch(table.table_name) {
        case 'users':
          console.log('   📝 Propósito: Almacena información de los asociados activos de la cooperativa');
          break;
        case 'supply_inventory':
          console.log('   📝 Propósito: Inventario de elementos de dotación (camisas, pantalones, etc.)');
          break;
        case 'entrega_dotacion':
          console.log('   📝 Propósito: Registro de entregas de dotación realizadas a asociados');
          break;
        case 'retired_associates':
          console.log('   📝 Propósito: Asociados que se han retirado de la cooperativa (NUEVA)');
          break;
        case 'retired_associate_supply_history':
          console.log('   📝 Propósito: Historial de dotaciones de asociados retirados (NUEVA)');
          break;
        default:
          console.log('   📝 Propósito: Tabla del sistema');
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMEN:');
    console.log(`Total de tablas: ${tablesResult.rows.length}`);
    
    // Mostrar relaciones importantes
    console.log('\n🔗 RELACIONES ENTRE TABLAS:');
    console.log('- users ← entrega_dotacion (asociados activos con sus entregas)');
    console.log('- retired_associates ← retired_associate_supply_history (asociados retirados con su historial)');
    console.log('- supply_inventory (inventario independiente para control de stock)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTables();
