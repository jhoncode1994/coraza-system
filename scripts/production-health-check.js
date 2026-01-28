// Script de Health Check para Producción - Coraza System
// Revisa el estado de la base de datos y métricas importantes

// Cargar variables de entorno
require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runHealthCheck() {
  const client = await pool.connect();
  
  try {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🏥 CORAZA SYSTEM - HEALTH CHECK DE PRODUCCIÓN');
    console.log('📅 Fecha:', new Date().toLocaleString('es-CO'));
    console.log('═══════════════════════════════════════════════════════════════\n');

    // 1. Verificar conexión
    const connectionTest = await client.query('SELECT NOW() as time, version() as pg_version');
    console.log('✅ Conexión a la base de datos: OK');
    console.log('   ⏰ Hora del servidor:', connectionTest.rows[0].time);
    console.log('   🐘 PostgreSQL:', connectionTest.rows[0].pg_version.split(',')[0]);
    
    // 2. Listar todas las tablas
    console.log('\n───────────────────────────────────────────────────────────────');
    console.log('📋 TABLAS EN LA BASE DE DATOS:');
    console.log('───────────────────────────────────────────────────────────────');
    
    const tables = await client.query(`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as size
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    for (const table of tables.rows) {
      const countResult = await client.query(`SELECT COUNT(*) as count FROM "${table.tablename}"`);
      console.log(`   📁 ${table.tablename.padEnd(35)} | ${countResult.rows[0].count.toString().padStart(8)} registros | ${table.size}`);
    }

    // 3. Usuarios del sistema
    console.log('\n───────────────────────────────────────────────────────────────');
    console.log('👥 USUARIOS DEL SISTEMA (auth_users):');
    console.log('───────────────────────────────────────────────────────────────');
    
    try {
      const users = await client.query(`
        SELECT username, role, is_active, created_at, last_login
        FROM auth_users
        ORDER BY created_at DESC
      `);
      
      if (users.rows.length === 0) {
        console.log('   ⚠️ No hay usuarios registrados');
      } else {
        users.rows.forEach(user => {
          const status = user.is_active ? '🟢' : '🔴';
          const lastLogin = user.last_login ? new Date(user.last_login).toLocaleString('es-CO') : 'Nunca';
          console.log(`   ${status} ${user.username.padEnd(20)} | Rol: ${user.role.padEnd(10)} | Último acceso: ${lastLogin}`);
        });
      }
    } catch (e) {
      console.log('   ⚠️ Tabla auth_users no encontrada o error:', e.message);
    }

    // 4. Asociados
    console.log('\n───────────────────────────────────────────────────────────────');
    console.log('👷 ASOCIADOS:');
    console.log('───────────────────────────────────────────────────────────────');
    
    try {
      const associates = await client.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN estado = 'activo' OR estado IS NULL THEN 1 END) as activos,
          COUNT(CASE WHEN estado = 'inactivo' THEN 1 END) as inactivos
        FROM associates
      `);
      
      const row = associates.rows[0];
      console.log(`   📊 Total: ${row.total} | Activos: ${row.activos} | Inactivos: ${row.inactivos || 0}`);
      
      // Últimos 5 asociados registrados
      const recentAssociates = await client.query(`
        SELECT nombre, cedula, area, created_at
        FROM associates
        ORDER BY created_at DESC
        LIMIT 5
      `);
      
      console.log('\n   📝 Últimos 5 asociados registrados:');
      recentAssociates.rows.forEach(a => {
        const fecha = a.created_at ? new Date(a.created_at).toLocaleDateString('es-CO') : 'N/A';
        console.log(`      - ${a.nombre} | CC: ${a.cedula} | Área: ${a.area || 'N/A'} | Fecha: ${fecha}`);
      });
    } catch (e) {
      console.log('   ⚠️ Error al consultar asociados:', e.message);
    }

    // 5. Inventario
    console.log('\n───────────────────────────────────────────────────────────────');
    console.log('📦 INVENTARIO DE DOTACIÓN:');
    console.log('───────────────────────────────────────────────────────────────');
    
    try {
      const inventory = await client.query(`
        SELECT 
          element_name,
          SUM(CASE WHEN movement_type = 'ingreso' THEN quantity ELSE 0 END) as ingresos,
          SUM(CASE WHEN movement_type = 'entrega' THEN quantity ELSE 0 END) as entregas,
          SUM(CASE WHEN movement_type = 'ingreso' THEN quantity ELSE -quantity END) as stock_actual
        FROM inventory_movements
        GROUP BY element_name
        ORDER BY element_name
      `);
      
      console.log('   Elemento'.padEnd(40) + '| Ingresos | Entregas | Stock');
      console.log('   ' + '─'.repeat(65));
      inventory.rows.forEach(item => {
        console.log(`   ${item.element_name.padEnd(38)} | ${item.ingresos.toString().padStart(8)} | ${item.entregas.toString().padStart(8)} | ${item.stock_actual.toString().padStart(5)}`);
      });
    } catch (e) {
      console.log('   ⚠️ Error al consultar inventario:', e.message);
    }

    // 6. Movimientos recientes
    console.log('\n───────────────────────────────────────────────────────────────');
    console.log('🔄 ÚLTIMOS 10 MOVIMIENTOS DE INVENTARIO:');
    console.log('───────────────────────────────────────────────────────────────');
    
    try {
      const movements = await client.query(`
        SELECT 
          element_name,
          movement_type,
          quantity,
          size,
          created_at,
          associate_name
        FROM inventory_movements
        ORDER BY created_at DESC
        LIMIT 10
      `);
      
      movements.rows.forEach(m => {
        const fecha = new Date(m.created_at).toLocaleString('es-CO');
        const tipo = m.movement_type === 'ingreso' ? '📥' : '📤';
        const talla = m.size ? `(${m.size})` : '';
        const asociado = m.associate_name ? `→ ${m.associate_name}` : '';
        console.log(`   ${tipo} ${fecha} | ${m.element_name} ${talla} x${m.quantity} ${asociado}`);
      });
    } catch (e) {
      console.log('   ⚠️ Error al consultar movimientos:', e.message);
    }

    // 7. Entregas de dotación
    console.log('\n───────────────────────────────────────────────────────────────');
    console.log('🎁 RESUMEN DE ENTREGAS DE DOTACIÓN:');
    console.log('───────────────────────────────────────────────────────────────');
    
    try {
      const entregas = await client.query(`
        SELECT 
          COUNT(*) as total_entregas,
          COUNT(DISTINCT associate_id) as asociados_con_entregas,
          MAX(created_at) as ultima_entrega
        FROM supply_deliveries
      `);
      
      const e = entregas.rows[0];
      const ultimaEntrega = e.ultima_entrega ? new Date(e.ultima_entrega).toLocaleString('es-CO') : 'N/A';
      console.log(`   📊 Total entregas: ${e.total_entregas}`);
      console.log(`   👥 Asociados que han recibido dotación: ${e.asociados_con_entregas}`);
      console.log(`   📅 Última entrega: ${ultimaEntrega}`);
    } catch (e) {
      console.log('   ⚠️ Error al consultar entregas:', e.message);
    }

    // 8. Asociados retirados
    console.log('\n───────────────────────────────────────────────────────────────');
    console.log('🚪 ASOCIADOS RETIRADOS:');
    console.log('───────────────────────────────────────────────────────────────');
    
    try {
      const retired = await client.query(`
        SELECT COUNT(*) as total FROM retired_associates
      `);
      console.log(`   📊 Total retirados: ${retired.rows[0].total}`);
      
      const recentRetired = await client.query(`
        SELECT nombre, cedula, area, fecha_retiro, motivo_retiro
        FROM retired_associates
        ORDER BY fecha_retiro DESC
        LIMIT 5
      `);
      
      if (recentRetired.rows.length > 0) {
        console.log('\n   📝 Últimos 5 retiros:');
        recentRetired.rows.forEach(r => {
          const fecha = r.fecha_retiro ? new Date(r.fecha_retiro).toLocaleDateString('es-CO') : 'N/A';
          console.log(`      - ${r.nombre} | CC: ${r.cedula} | Área: ${r.area || 'N/A'} | Fecha: ${fecha}`);
        });
      }
    } catch (e) {
      console.log('   ⚠️ Tabla retired_associates no encontrada o error:', e.message);
    }

    // 9. Estadísticas de base de datos
    console.log('\n───────────────────────────────────────────────────────────────');
    console.log('📈 ESTADÍSTICAS DE LA BASE DE DATOS:');
    console.log('───────────────────────────────────────────────────────────────');
    
    try {
      const dbSize = await client.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size,
               current_database() as db_name
      `);
      console.log(`   💾 Nombre de la BD: ${dbSize.rows[0].db_name}`);
      console.log(`   📦 Tamaño total: ${dbSize.rows[0].size}`);
      
      const indexStats = await client.query(`
        SELECT COUNT(*) as total_indexes
        FROM pg_indexes
        WHERE schemaname = 'public'
      `);
      console.log(`   🗂️ Índices creados: ${indexStats.rows[0].total_indexes}`);
    } catch (e) {
      console.log('   ⚠️ Error al obtener estadísticas:', e.message);
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ HEALTH CHECK COMPLETADO');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error general:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

runHealthCheck();
