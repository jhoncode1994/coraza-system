// Script para verificar mejoras pendientes
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkImprovements() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔍 ANÁLISIS DE MEJORAS PENDIENTES\n');
    console.log('═'.repeat(60));

    // 1. Verificar índices
    console.log('\n1️⃣ ÍNDICES DE BASE DE DATOS');
    const indexes = await client.query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname
    `);
    
    console.log(`   ✅ Índices personalizados encontrados: ${indexes.rows.length}`);
    indexes.rows.forEach(idx => {
      console.log(`      - ${idx.indexname} (${idx.tablename})`);
    });

    // Índices recomendados que podrían faltar
    const recommendedIndexes = [
      'idx_users_cedula',
      'idx_users_zona',
      'idx_entrega_dotacion_fecha',
      'idx_entrega_dotacion_userid',
      'idx_supply_inventory_code',
      'idx_supply_inventory_category',
      'idx_inventory_movements_supply_id',
      'idx_inventory_movements_created_at'
    ];

    const existingIndexNames = indexes.rows.map(i => i.indexname);
    const missingIndexes = recommendedIndexes.filter(idx => !existingIndexNames.includes(idx));
    
    if (missingIndexes.length > 0) {
      console.log(`\n   ⚠️ Índices recomendados que faltan:`);
      missingIndexes.forEach(idx => console.log(`      - ${idx}`));
    }

    // 2. Verificar tablas duplicadas de usuarios
    console.log('\n2️⃣ TABLAS DE USUARIOS');
    const authCount = await client.query('SELECT COUNT(*) FROM auth_users');
    const adminCount = await client.query('SELECT COUNT(*) FROM admin_users');
    
    console.log(`   - auth_users: ${authCount.rows[0].count} registros`);
    console.log(`   - admin_users: ${adminCount.rows[0].count} registros`);
    
    if (parseInt(authCount.rows[0].count) > 0 && parseInt(adminCount.rows[0].count) > 0) {
      console.log(`   ⚠️ Hay datos en ambas tablas - considerar consolidar`);
    }

    // 3. Verificar datos huérfanos o inconsistentes
    console.log('\n3️⃣ INTEGRIDAD DE DATOS');
    
    // Entregas sin usuario válido
    const orphanDeliveries = await client.query(`
      SELECT COUNT(*) FROM entrega_dotacion ed
      LEFT JOIN users u ON ed."userId" = u.id
      WHERE u.id IS NULL
    `);
    console.log(`   - Entregas huérfanas: ${orphanDeliveries.rows[0].count}`);

    // Movimientos sin item de inventario válido
    const orphanMovements = await client.query(`
      SELECT COUNT(*) FROM inventory_movements im
      LEFT JOIN supply_inventory si ON im.supply_id = si.id
      WHERE si.id IS NULL
    `);
    console.log(`   - Movimientos huérfanos: ${orphanMovements.rows[0].count}`);

    // 4. Verificar columnas faltantes útiles
    console.log('\n4️⃣ ESTRUCTURA DE TABLAS');
    
    // Verificar si users tiene columna 'estado' o 'activo'
    const usersColumns = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name IN ('estado', 'activo', 'email', 'telefono')
    `);
    const usersCols = usersColumns.rows.map(c => c.column_name);
    
    console.log(`   - Columnas útiles en users: ${usersCols.join(', ') || 'ninguna adicional'}`);
    
    const missingUserCols = ['estado', 'email', 'telefono'].filter(c => !usersCols.includes(c));
    if (missingUserCols.length > 0) {
      console.log(`   ⚠️ Columnas recomendadas faltantes: ${missingUserCols.join(', ')}`);
    }

    // 5. Estadísticas de performance
    console.log('\n5️⃣ ESTADÍSTICAS DE USO');
    
    const deliveriesByMonth = await client.query(`
      SELECT 
        TO_CHAR("fechaEntrega", 'YYYY-MM') as mes,
        COUNT(*) as total
      FROM entrega_dotacion
      WHERE "fechaEntrega" >= NOW() - INTERVAL '3 months'
      GROUP BY TO_CHAR("fechaEntrega", 'YYYY-MM')
      ORDER BY mes DESC
    `);
    
    console.log('   Entregas últimos 3 meses:');
    deliveriesByMonth.rows.forEach(m => {
      console.log(`      - ${m.mes}: ${m.total} entregas`);
    });

    // Resumen
    console.log('\n' + '═'.repeat(60));
    console.log('\n📋 RESUMEN DE MEJORAS SUGERIDAS:\n');
    
    const improvements = [];
    
    if (missingIndexes.length > 0) {
      improvements.push(`1. Crear ${missingIndexes.length} índices faltantes para mejorar performance`);
    }
    
    if (parseInt(authCount.rows[0].count) > 0 && parseInt(adminCount.rows[0].count) > 0) {
      improvements.push('2. Consolidar tablas auth_users y admin_users');
    }
    
    if (missingUserCols.length > 0) {
      improvements.push(`3. Agregar columnas útiles a users: ${missingUserCols.join(', ')}`);
    }
    
    improvements.push('4. Implementar Lazy Loading en rutas (ya planeado)');
    improvements.push('5. Agregar paginación backend para listas grandes');
    improvements.push('6. Implementar PWA para uso offline');
    
    improvements.forEach(imp => console.log(`   ✨ ${imp}`));
    
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkImprovements();
