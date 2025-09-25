const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_expMyzc2PY1o@ep-solitary-scene-adpyw2k4-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
});

async function cleanDatabase() {
  try {
    await client.connect();
    console.log('🧹 INICIANDO LIMPIEZA DE BASE DE DATOS...\n');

    // ⚠️ CONFIGURACIÓN DE LIMPIEZA ⚠️
    const CLEAN_CONFIG = {
      // DATOS DE OPERACIÓN (recomendado limpiar)
      entrega_dotacion: true,          // ✅ Limpiar entregas de dotación
      inventory_movements: true,       // ✅ Limpiar movimientos de inventario
      
      // DATOS MAESTROS (¡CUIDADO!)
      users: false,                    // ❌ NO limpiar usuarios (712 registros)
      supply_inventory: false,         // ❌ NO limpiar inventario maestro (17 items)
      admin_users: false,              // ❌ NO limpiar usuarios admin (2 usuarios)
      
      // TABLAS VACÍAS (seguro limpiar)
      retired_associate_supply_history: true,  // ✅ Ya está vacía
      retired_associates: true,                // ✅ Ya está vacía
    };

    console.log('📋 CONFIGURACIÓN DE LIMPIEZA:');
    console.log('═══════════════════════════════════');
    Object.entries(CLEAN_CONFIG).forEach(([table, willClean]) => {
      const status = willClean ? '🗑️  LIMPIAR' : '🔒 MANTENER';
      console.log(`${status} - ${table.toUpperCase()}`);
    });
    console.log('═══════════════════════════════════\n');

    // Realizar la limpieza
    await client.query('BEGIN');
    
    for (const [tableName, shouldClean] of Object.entries(CLEAN_CONFIG)) {
      if (shouldClean) {
        try {
          // Contar registros antes
          const countBefore = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          const recordsBefore = parseInt(countBefore.rows[0].count);
          
          if (recordsBefore > 0) {
            // Limpiar la tabla
            await client.query(`DELETE FROM ${tableName}`);
            
            // Reset del auto-increment si existe una columna id
            try {
              await client.query(`ALTER SEQUENCE ${tableName}_id_seq RESTART WITH 1`);
            } catch (seqError) {
              // No hay problema si no existe la secuencia
            }
            
            console.log(`✅ ${tableName.toUpperCase()}: ${recordsBefore} registros eliminados`);
          } else {
            console.log(`ℹ️  ${tableName.toUpperCase()}: ya estaba vacía`);
          }
        } catch (error) {
          console.log(`❌ Error limpiando ${tableName}: ${error.message}`);
        }
      }
    }

    await client.query('COMMIT');
    console.log('\n🎉 LIMPIEZA COMPLETADA EXITOSAMENTE');
    
    // Mostrar estado final
    console.log('\n📊 ESTADO FINAL DE LA BASE DE DATOS:');
    console.log('════════════════════════════════════');
    
    const tablesResult = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    for (const table of tablesResult.rows) {
      const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
      const recordCount = countResult.rows[0].count;
      console.log(`📋 ${table.table_name.toUpperCase()}: ${recordCount} registros`);
    }

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error durante la limpieza:', error.message);
  } finally {
    await client.end();
  }
}

// ⚠️ ADVERTENCIA DE SEGURIDAD ⚠️
console.log('⚠️  ADVERTENCIA: OPERACIÓN DE LIMPIEZA DE BASE DE DATOS ⚠️');
console.log('Esta operación eliminará datos de forma PERMANENTE.');
console.log('Revisa la configuración antes de continuar.\n');

// Ejecutar limpieza
cleanDatabase();