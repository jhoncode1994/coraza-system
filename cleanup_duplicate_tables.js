const { Pool } = require('pg');

const pool = new Pool({
  host: 'ep-solitary-scene-adpyw2k4-pooler.c-2.us-east-1.aws.neon.tech',
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_expMyzc2PY1o',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

async function cleanupDuplicateTables() {
  try {
    console.log('🧹 LIMPIEZA DE TABLAS DUPLICADAS');
    console.log('===============================\n');
    
    // Verificar que entregas_dotacion esté vacía antes de eliminar
    console.log('1. Verificando que entregas_dotacion esté vacía...');
    const count = await pool.query('SELECT COUNT(*) as count FROM entregas_dotacion');
    console.log(`   Registros en entregas_dotacion: ${count.rows[0].count}`);
    
    if (count.rows[0].count > 0) {
      console.log('❌ ERROR: entregas_dotacion contiene datos. No se puede eliminar automáticamente.');
      console.log('   Debes migrar los datos manualmente antes de eliminar la tabla.');
      return;
    }
    
    // Eliminar la tabla vacía entregas_dotacion
    console.log('\n2. Eliminando tabla duplicada entregas_dotacion...');
    await pool.query('DROP TABLE IF EXISTS entregas_dotacion CASCADE');
    console.log('✅ Tabla entregas_dotacion eliminada exitosamente');
    
    // Verificar que entrega_dotacion sigue existiendo con sus datos
    console.log('\n3. Verificando tabla principal entrega_dotacion...');
    const mainTableCount = await pool.query('SELECT COUNT(*) as count FROM entrega_dotacion');
    console.log(`✅ entrega_dotacion mantiene ${mainTableCount.rows[0].count} registros`);
    
    // Mostrar estructura final
    console.log('\n4. Estructura final de entrega_dotacion:');
    const structure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'entrega_dotacion'
      ORDER BY ordinal_position;
    `);
    
    structure.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    console.log('\n✅ LIMPIEZA COMPLETADA');
    console.log('✅ Tabla unificada: entrega_dotacion');
    console.log('✅ Tabla eliminada: entregas_dotacion');
    console.log('✅ Datos preservados: Sí');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error.message);
  } finally {
    await pool.end();
  }
}

cleanupDuplicateTables();
