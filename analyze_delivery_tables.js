const { Pool } = require('pg');

const pool = new Pool({
  host: 'ep-solitary-scene-adpyw2k4-pooler.c-2.us-east-1.aws.neon.tech',
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_expMyzc2PY1o',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

async function analyzeDeliveryTables() {
  try {
    console.log('🔍 ANÁLISIS DE TABLAS DE ENTREGAS');
    console.log('================================\n');
    
    // Tabla entrega_dotacion (camelCase - usada en server.js)
    console.log('📋 Tabla: entrega_dotacion (camelCase)');
    console.log('--------------------------------------');
    const entregaDotacion = await pool.query('SELECT * FROM entrega_dotacion ORDER BY created_at DESC');
    console.log(`📊 Registros: ${entregaDotacion.rows.length}`);
    if (entregaDotacion.rows.length > 0) {
      console.log('📝 Datos de ejemplo:');
      entregaDotacion.rows.forEach((row, index) => {
        if (index < 3) {
          console.log(`   ${index + 1}. Usuario: ${row.userId}, Elemento: ${row.elemento}, Fecha: ${row.fechaEntrega}`);
        }
      });
    }
    
    console.log('\n📋 Tabla: entregas_dotacion (snake_case)');
    console.log('----------------------------------------');
    const entregasDotacion = await pool.query('SELECT * FROM entregas_dotacion ORDER BY created_at DESC');
    console.log(`📊 Registros: ${entregasDotacion.rows.length}`);
    if (entregasDotacion.rows.length > 0) {
      console.log('📝 Datos de ejemplo:');
      entregasDotacion.rows.forEach((row, index) => {
        if (index < 3) {
          console.log(`   ${index + 1}. Usuario: ${row.userid}, Elemento: ${row.elemento}, Fecha: ${row.fechaentrega}`);
        }
      });
    }
    
    console.log('\n🎯 ANÁLISIS Y RECOMENDACIONES:');
    console.log('============================');
    
    if (entregaDotacion.rows.length > 0 && entregasDotacion.rows.length === 0) {
      console.log('✅ USAR: entrega_dotacion (tiene datos)');
      console.log('❌ ELIMINAR: entregas_dotacion (vacía)');
      console.log('📝 ACCIÓN: Actualizar entregaDotacionService.ts para usar entrega_dotacion');
    } else if (entregasDotacion.rows.length > 0 && entregaDotacion.rows.length === 0) {
      console.log('✅ USAR: entregas_dotacion (tiene datos)');
      console.log('❌ ELIMINAR: entrega_dotacion (vacía)');
      console.log('📝 ACCIÓN: Actualizar server.js para usar entregas_dotacion');
    } else if (entregaDotacion.rows.length > 0 && entregasDotacion.rows.length > 0) {
      console.log('⚠️  AMBAS TIENEN DATOS - requiere migración');
      console.log('📝 ACCIÓN: Migrar datos de una tabla a otra antes de eliminar');
    } else {
      console.log('✅ AMBAS ESTÁN VACÍAS');
      console.log('📝 ACCIÓN: Eliminar una y estandarizar en una sola');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

analyzeDeliveryTables();
