// check-entrega-dotacion-table.js - Verificar si existe la tabla entrega_dotacion
require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function checkEntregaDotacionTable() {
  console.log('🔍 Verificando tabla entrega_dotacion...\n');
  
  try {
    // Verificar si existe la tabla entrega_dotacion
    const tableExistsResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'entrega_dotacion'
      );
    `);
    
    const tableExists = tableExistsResult.rows[0].exists;
    
    if (tableExists) {
      console.log('✅ La tabla entrega_dotacion YA EXISTE');
      
      // Mostrar estructura
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'entrega_dotacion' 
        ORDER BY ordinal_position;
      `);
      
      console.log('\n📋 Estructura actual:');
      columnsResult.rows.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? '* REQUERIDO' : ''}`);
      });
      
      // Contar registros
      const countResult = await pool.query('SELECT COUNT(*) as count FROM entrega_dotacion;');
      console.log(`\n📊 Registros actuales: ${countResult.rows[0].count}`);
      
      // Mostrar algunos registros de ejemplo si existen
      if (countResult.rows[0].count > 0) {
        const sampleResult = await pool.query('SELECT * FROM entrega_dotacion LIMIT 3;');
        console.log('\n📝 Ejemplos de registros:');
        sampleResult.rows.forEach((row, index) => {
          console.log(`${index + 1}. Usuario ID: ${row.userId || row.user_id}, Elemento: ${row.elemento}, Cantidad: ${row.cantidad}, Fecha: ${row.fechaEntrega || row.fecha_entrega}`);
        });
      }
      
    } else {
      console.log('❌ La tabla entrega_dotacion NO EXISTE');
      console.log('\n🛠️  Necesitamos crearla para el flujo completo:');
      console.log('   ASOCIADOS ACTIVOS (users) → ENTREGAS (entrega_dotacion) → HISTORIAL');
      console.log('   ASOCIADOS RETIRADOS (retired_associates) → HISTORIAL RETIRADOS (retired_associate_supply_history)');
      
      console.log('\n📝 Estructura sugerida para entrega_dotacion:');
      console.log('   - id (PRIMARY KEY)');
      console.log('   - userId (FK hacia users)');
      console.log('   - elemento (nombre del artículo)');
      console.log('   - cantidad (número de unidades)');
      console.log('   - fechaEntrega (fecha de la entrega)');
      console.log('   - firmaDigital (firma del asociado)');
      console.log('   - observaciones (notas adicionales)');
      console.log('   - created_at, updated_at');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkEntregaDotacionTable();
