const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function universalCleanProblematicRecords() {
  try {
    const client = await pool.connect();
    
    console.log('=== LIMPIEZA UNIVERSAL DE REGISTROS PROBLEMÁTICOS ===');
    
    // Buscar TODOS los registros con códigos problemáticos (múltiples guiones)
    const problematicResult = await client.query(`
      SELECT id, code, name, category, talla, quantity 
      FROM supply_inventory 
      WHERE code ~ '.*-.*-.*'
      ORDER BY name, code
    `);
    
    console.log(`Total de registros problemáticos encontrados: ${problematicResult.rows.length}`);
    
    if (problematicResult.rows.length === 0) {
      console.log('✅ No se encontraron registros problemáticos. El sistema está limpio.');
      client.release();
      await pool.end();
      return;
    }
    
    // Iniciar transacción
    await client.query('BEGIN');
    
    let processedCount = 0;
    let mergedCount = 0;
    let updatedCount = 0;
    
    for (const record of problematicResult.rows) {
      console.log(`\n📦 Procesando: ${record.name} - ID ${record.id}`);
      console.log(`   Código problemático: "${record.code}" -> Talla: "${record.talla}"`);
      
      // Extraer código base (primera parte antes del primer guión)
      const baseCode = record.code.split('-')[0];
      const correctCode = `${baseCode}-${record.talla}`;
      
      console.log(`   Código correcto: "${correctCode}"`);
      
      // Verificar si ya existe un registro con el código correcto
      const existingCheck = await client.query(
        'SELECT id, quantity FROM supply_inventory WHERE code = $1 AND id != $2',
        [correctCode, record.id]
      );
      
      if (existingCheck.rows.length > 0) {
        const existingRecord = existingCheck.rows[0];
        console.log(`   ⚠️  Ya existe registro con código "${correctCode}" (ID: ${existingRecord.id})`);
        
        // Fusionar cantidades si el registro problemático tiene stock
        if (record.quantity > 0) {
          const newQuantity = existingRecord.quantity + record.quantity;
          await client.query(
            'UPDATE supply_inventory SET quantity = $1, last_update = CURRENT_TIMESTAMP WHERE id = $2',
            [newQuantity, existingRecord.id]
          );
          console.log(`   🔄 Cantidades fusionadas: ${existingRecord.quantity} + ${record.quantity} = ${newQuantity}`);
        }
        
        // Eliminar el registro problemático
        await client.query('DELETE FROM supply_inventory WHERE id = $1', [record.id]);
        console.log(`   🗑️  Registro problemático eliminado`);
        mergedCount++;
      } else {
        // Actualizar el código del registro problemático
        await client.query(
          'UPDATE supply_inventory SET code = $1, last_update = CURRENT_TIMESTAMP WHERE id = $2',
          [correctCode, record.id]
        );
        console.log(`   ✅ Código actualizado de "${record.code}" a "${correctCode}"`);
        updatedCount++;
      }
      
      processedCount++;
    }
    
    // Confirmar cambios
    await client.query('COMMIT');
    
    console.log('\n=== RESUMEN DE LIMPIEZA ===');
    console.log(`📊 Total de registros procesados: ${processedCount}`);
    console.log(`🔄 Registros fusionados y eliminados: ${mergedCount}`);
    console.log(`✅ Registros actualizados: ${updatedCount}`);
    console.log('🎉 Limpieza completada exitosamente');
    
    // Verificación final
    const finalCheck = await client.query(`
      SELECT COUNT(*) as count 
      FROM supply_inventory 
      WHERE code ~ '.*-.*-.*'
    `);
    
    console.log(`\n🔍 Verificación final: ${finalCheck.rows[0].count} registros problemáticos restantes`);
    
    if (finalCheck.rows[0].count === 0) {
      console.log('✅ Sistema completamente limpio');
    } else {
      console.log('⚠️  Aún quedan registros problemáticos que requieren atención manual');
    }
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    
    // Rollback en caso de error
    try {
      const client = await pool.connect();
      await client.query('ROLLBACK');
      client.release();
      console.log('🔄 Rollback ejecutado exitosamente');
    } catch (rollbackError) {
      console.error('❌ Error en rollback:', rollbackError);
    }
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  universalCleanProblematicRecords();
}

module.exports = { universalCleanProblematicRecords };