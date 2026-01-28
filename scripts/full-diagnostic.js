// Script de Diagnóstico Completo - Coraza System
require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fullDiagnostic() {
  const client = await pool.connect();
  
  try {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║        🏥 CORAZA SYSTEM - DIAGNÓSTICO DE PRODUCCIÓN          ║');
    console.log('║                    ' + new Date().toLocaleString('es-CO').padEnd(35) + '  ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');

    // ═══════════════════════════════════════════════════════════════
    // SECCIÓN 1: ESTADO DE LA BASE DE DATOS
    // ═══════════════════════════════════════════════════════════════
    console.log('┌───────────────────────────────────────────────────────────────┐');
    console.log('│ 1️⃣  ESTADO DE LA BASE DE DATOS                                │');
    console.log('└───────────────────────────────────────────────────────────────┘');

    const dbInfo = await client.query(`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as db_size,
        current_database() as db_name,
        version() as pg_version
    `);
    console.log(`   📦 Base de datos: ${dbInfo.rows[0].db_name}`);
    console.log(`   💾 Tamaño: ${dbInfo.rows[0].db_size}`);
    console.log(`   🐘 PostgreSQL: ${dbInfo.rows[0].pg_version.split(' on ')[0]}`);

    // Contar registros por tabla
    const tableCounts = await client.query(`
      SELECT 
        relname as table_name,
        n_live_tup as row_count
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY n_live_tup DESC
    `);
    
    console.log('\n   📊 Registros por tabla:');
    let totalRecords = 0;
    for (const t of tableCounts.rows) {
      const actualCount = await client.query(`SELECT COUNT(*) as c FROM "${t.table_name}"`);
      const count = parseInt(actualCount.rows[0].c);
      totalRecords += count;
      const bar = '█'.repeat(Math.min(Math.ceil(count / 50), 20));
      console.log(`      ${t.table_name.padEnd(35)} ${count.toString().padStart(6)} ${bar}`);
    }
    console.log(`      ${'─'.repeat(45)}`);
    console.log(`      ${'TOTAL'.padEnd(35)} ${totalRecords.toString().padStart(6)}`);

    // ═══════════════════════════════════════════════════════════════
    // SECCIÓN 2: USUARIOS DEL SISTEMA
    // ═══════════════════════════════════════════════════════════════
    console.log('\n┌───────────────────────────────────────────────────────────────┐');
    console.log('│ 2️⃣  USUARIOS DEL SISTEMA (auth_users)                         │');
    console.log('└───────────────────────────────────────────────────────────────┘');

    const authUsers = await client.query(`
      SELECT username, email, role, is_active, created_at
      FROM auth_users ORDER BY id
    `);
    
    authUsers.rows.forEach(u => {
      const status = u.is_active ? '🟢 Activo' : '🔴 Inactivo';
      const created = new Date(u.created_at).toLocaleDateString('es-CO');
      console.log(`   ${status} | ${u.username.padEnd(20)} | ${u.role.padEnd(15)} | Creado: ${created}`);
    });

    // ═══════════════════════════════════════════════════════════════
    // SECCIÓN 3: ASOCIADOS (users)
    // ═══════════════════════════════════════════════════════════════
    console.log('\n┌───────────────────────────────────────────────────────────────┐');
    console.log('│ 3️⃣  ASOCIADOS REGISTRADOS (users)                             │');
    console.log('└───────────────────────────────────────────────────────────────┘');

    const usersCount = await client.query('SELECT COUNT(*) as total FROM users');
    const usersByZone = await client.query(`
      SELECT zona, COUNT(*) as cantidad 
      FROM users GROUP BY zona ORDER BY zona
    `);
    
    console.log(`   📊 Total de asociados: ${usersCount.rows[0].total}`);
    console.log('\n   Por zona:');
    usersByZone.rows.forEach(z => {
      console.log(`      Zona ${z.zona}: ${z.cantidad} asociados`);
    });

    // Últimos 5 asociados registrados
    const recentUsers = await client.query(`
      SELECT id, nombre, apellido, cedula, zona, cargo, fecha_ingreso
      FROM users ORDER BY created_at DESC LIMIT 5
    `);
    
    console.log('\n   📝 Últimos 5 asociados registrados:');
    recentUsers.rows.forEach(u => {
      const fecha = new Date(u.fecha_ingreso).toLocaleDateString('es-CO');
      console.log(`      • ${u.nombre} ${u.apellido} | CC: ${u.cedula} | Zona: ${u.zona} | Cargo: ${u.cargo || 'N/A'} | Ingreso: ${fecha}`);
    });

    // ═══════════════════════════════════════════════════════════════
    // SECCIÓN 4: INVENTARIO DE DOTACIÓN
    // ═══════════════════════════════════════════════════════════════
    console.log('\n┌───────────────────────────────────────────────────────────────┐');
    console.log('│ 4️⃣  INVENTARIO DE DOTACIÓN (supply_inventory)                 │');
    console.log('└───────────────────────────────────────────────────────────────┘');

    const inventoryStats = await client.query(`
      SELECT 
        COUNT(*) as total_items,
        SUM(quantity) as total_stock,
        COUNT(CASE WHEN quantity <= minimum_quantity THEN 1 END) as low_stock_items
      FROM supply_inventory
    `);
    
    console.log(`   📦 Total items en inventario: ${inventoryStats.rows[0].total_items}`);
    console.log(`   📊 Stock total: ${inventoryStats.rows[0].total_stock || 0} unidades`);
    console.log(`   ⚠️ Items con stock bajo: ${inventoryStats.rows[0].low_stock_items || 0}`);

    // Inventario por categoría
    const byCategory = await client.query(`
      SELECT category, COUNT(*) as items, SUM(quantity) as stock
      FROM supply_inventory
      GROUP BY category
      ORDER BY stock DESC
    `);
    
    console.log('\n   Por categoría:');
    byCategory.rows.forEach(c => {
      console.log(`      ${c.category.padEnd(25)} | ${c.items} items | ${c.stock || 0} unidades`);
    });

    // Items con stock bajo
    const lowStock = await client.query(`
      SELECT name, code, quantity, minimum_quantity, talla, genero
      FROM supply_inventory
      WHERE quantity <= minimum_quantity
      ORDER BY quantity
      LIMIT 10
    `);
    
    if (lowStock.rows.length > 0) {
      console.log('\n   ⚠️ ALERTA: Items con stock bajo o agotado:');
      lowStock.rows.forEach(i => {
        const talla = i.talla ? ` (${i.talla})` : '';
        const genero = i.genero ? ` [${i.genero}]` : '';
        console.log(`      🔴 ${i.name}${talla}${genero}: ${i.quantity}/${i.minimum_quantity}`);
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // SECCIÓN 5: ENTREGAS DE DOTACIÓN
    // ═══════════════════════════════════════════════════════════════
    console.log('\n┌───────────────────────────────────────────────────────────────┐');
    console.log('│ 5️⃣  ENTREGAS DE DOTACIÓN (entrega_dotacion)                   │');
    console.log('└───────────────────────────────────────────────────────────────┘');

    const entregaStats = await client.query(`
      SELECT 
        COUNT(*) as total_entregas,
        COUNT(DISTINCT "userId") as asociados_atendidos,
        SUM(cantidad) as items_entregados,
        MIN("fechaEntrega") as primera_entrega,
        MAX("fechaEntrega") as ultima_entrega,
        COUNT(firma_url) as entregas_firmadas
      FROM entrega_dotacion
    `);
    
    const e = entregaStats.rows[0];
    console.log(`   📊 Total entregas registradas: ${e.total_entregas}`);
    console.log(`   👥 Asociados que han recibido dotación: ${e.asociados_atendidos}`);
    console.log(`   📦 Items totales entregados: ${e.items_entregados}`);
    console.log(`   ✍️ Entregas con firma: ${e.entregas_firmadas} (${((e.entregas_firmadas / e.total_entregas) * 100).toFixed(1)}%)`);
    console.log(`   📅 Primera entrega: ${e.primera_entrega ? new Date(e.primera_entrega).toLocaleDateString('es-CO') : 'N/A'}`);
    console.log(`   📅 Última entrega: ${e.ultima_entrega ? new Date(e.ultima_entrega).toLocaleDateString('es-CO') : 'N/A'}`);

    // Top elementos entregados
    const topElements = await client.query(`
      SELECT elemento, SUM(cantidad) as total_entregado, COUNT(*) as num_entregas
      FROM entrega_dotacion
      GROUP BY elemento
      ORDER BY total_entregado DESC
      LIMIT 10
    `);
    
    console.log('\n   🏆 Top 10 elementos más entregados:');
    topElements.rows.forEach((el, i) => {
      console.log(`      ${(i+1).toString().padStart(2)}. ${el.elemento.padEnd(35)} ${el.total_entregado} unidades (${el.num_entregas} entregas)`);
    });

    // Últimas 5 entregas
    const recentDeliveries = await client.query(`
      SELECT 
        ed.elemento, ed.cantidad, ed.talla, ed."fechaEntrega",
        u.nombre, u.apellido
      FROM entrega_dotacion ed
      JOIN users u ON ed."userId" = u.id
      ORDER BY ed."fechaEntrega" DESC
      LIMIT 5
    `);
    
    console.log('\n   📝 Últimas 5 entregas:');
    recentDeliveries.rows.forEach(d => {
      const fecha = new Date(d.fechaEntrega).toLocaleDateString('es-CO');
      const talla = d.talla ? ` (${d.talla})` : '';
      console.log(`      • ${fecha} | ${d.nombre} ${d.apellido} → ${d.elemento}${talla} x${d.cantidad}`);
    });

    // ═══════════════════════════════════════════════════════════════
    // SECCIÓN 6: MOVIMIENTOS DE INVENTARIO
    // ═══════════════════════════════════════════════════════════════
    console.log('\n┌───────────────────────────────────────────────────────────────┐');
    console.log('│ 6️⃣  MOVIMIENTOS DE INVENTARIO (inventory_movements)           │');
    console.log('└───────────────────────────────────────────────────────────────┘');

    const movStats = await client.query(`
      SELECT 
        movement_type,
        COUNT(*) as cantidad,
        SUM(quantity) as total_unidades
      FROM inventory_movements
      GROUP BY movement_type
    `);
    
    movStats.rows.forEach(m => {
      const emoji = m.movement_type === 'ingreso' ? '📥' : '📤';
      console.log(`   ${emoji} ${m.movement_type.padEnd(15)} | ${m.cantidad} movimientos | ${m.total_unidades} unidades`);
    });

    // Últimos movimientos
    const recentMovements = await client.query(`
      SELECT 
        im.movement_type, im.quantity, im.reason, im.created_at,
        si.name as elemento
      FROM inventory_movements im
      LEFT JOIN supply_inventory si ON im.supply_id = si.id
      ORDER BY im.created_at DESC
      LIMIT 5
    `);
    
    console.log('\n   📝 Últimos 5 movimientos:');
    recentMovements.rows.forEach(m => {
      const fecha = new Date(m.created_at).toLocaleDateString('es-CO');
      const emoji = m.movement_type === 'ingreso' ? '📥' : '📤';
      console.log(`      ${emoji} ${fecha} | ${m.elemento || 'N/A'} | ${m.quantity} unidades | ${m.reason}`);
    });

    // ═══════════════════════════════════════════════════════════════
    // SECCIÓN 7: ASOCIADOS RETIRADOS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n┌───────────────────────────────────────────────────────────────┐');
    console.log('│ 7️⃣  ASOCIADOS RETIRADOS (retired_associates)                  │');
    console.log('└───────────────────────────────────────────────────────────────┘');

    const retiredCount = await client.query('SELECT COUNT(*) as total FROM retired_associates');
    console.log(`   📊 Total retirados: ${retiredCount.rows[0].total}`);

    if (parseInt(retiredCount.rows[0].total) > 0) {
      const recentRetired = await client.query(`
        SELECT nombre, apellido, cedula, zona, retired_date, retired_reason
        FROM retired_associates
        ORDER BY retired_date DESC
        LIMIT 5
      `);
      
      console.log('\n   📝 Últimos retiros:');
      recentRetired.rows.forEach(r => {
        const fecha = r.retired_date ? new Date(r.retired_date).toLocaleDateString('es-CO') : 'N/A';
        console.log(`      • ${r.nombre} ${r.apellido} | CC: ${r.cedula} | Zona: ${r.zona} | Fecha: ${fecha}`);
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // SECCIÓN 8: ANÁLISIS DE RENDIMIENTO
    // ═══════════════════════════════════════════════════════════════
    console.log('\n┌───────────────────────────────────────────────────────────────┐');
    console.log('│ 8️⃣  ANÁLISIS DE RENDIMIENTO                                   │');
    console.log('└───────────────────────────────────────────────────────────────┘');

    // Índices
    const indexCount = await client.query(`
      SELECT COUNT(*) as total FROM pg_indexes WHERE schemaname = 'public'
    `);
    console.log(`   🗂️ Índices creados: ${indexCount.rows[0].total}`);

    // Entregas por mes (últimos 6 meses)
    const monthlyDeliveries = await client.query(`
      SELECT 
        TO_CHAR("fechaEntrega", 'YYYY-MM') as mes,
        COUNT(*) as entregas,
        SUM(cantidad) as items
      FROM entrega_dotacion
      WHERE "fechaEntrega" >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR("fechaEntrega", 'YYYY-MM')
      ORDER BY mes DESC
    `);
    
    if (monthlyDeliveries.rows.length > 0) {
      console.log('\n   📈 Entregas por mes (últimos 6 meses):');
      monthlyDeliveries.rows.forEach(m => {
        const bar = '█'.repeat(Math.min(Math.ceil(m.entregas / 10), 20));
        console.log(`      ${m.mes} | ${m.entregas.toString().padStart(4)} entregas | ${m.items.toString().padStart(5)} items ${bar}`);
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // RESUMEN FINAL
    // ═══════════════════════════════════════════════════════════════
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                    📋 RESUMEN EJECUTIVO                       ║');
    console.log('╠═══════════════════════════════════════════════════════════════╣');
    console.log(`║  ✅ Base de datos: Operativa                                  ║`);
    console.log(`║  👥 Usuarios sistema: ${authUsers.rows.length} configurados                             ║`);
    console.log(`║  👷 Asociados: ${usersCount.rows[0].total} registrados                                  ║`);
    console.log(`║  📦 Items inventario: ${inventoryStats.rows[0].total_items}                                       ║`);
    console.log(`║  🎁 Entregas totales: ${e.total_entregas}                                       ║`);
    console.log(`║  ⚠️ Items stock bajo: ${inventoryStats.rows[0].low_stock_items || 0}                                         ║`);
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

fullDiagnostic();
