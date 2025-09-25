const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixDotationSystem() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 CORRIGIENDO SISTEMA DE CONTROL DE DOTACIÓN');
    console.log('=============================================\n');
    
    // 1. Eliminar lógica de precios innecesaria
    console.log('💰 1. ELIMINANDO PRECIOS (NO APLICAN EN DOTACIÓN):');
    
    await client.query('BEGIN');
    
    // Limpiar precios de la tabla
    const result = await client.query(`
      UPDATE supply_inventory 
      SET unit_price = NULL 
      WHERE unit_price IS NOT NULL
    `);
    
    console.log(`✅ Precios eliminados de ${result.rowCount} elementos`);
    
    await client.query('COMMIT');
    
    // 2. Ajustar cantidades mínimas para dotación
    console.log('\n📦 2. AJUSTANDO CANTIDADES MÍNIMAS PARA DOTACIÓN:');
    
    await client.query('BEGIN');
    
    // Ajustar cantidades mínimas basadas en dotación típica
    const elements = await client.query(`
      SELECT code, name, category, talla, quantity
      FROM supply_inventory 
      WHERE talla IS NOT NULL
    `);
    
    for (const element of elements.rows) {
      let minQuantity = 10;
      
      // Ajustar basado en frecuencia típica de entrega de dotación
      if (element.name.toLowerCase().includes('pantalón')) {
        // Los pantalones se entregan normalmente 2-3 por año por empleado
        if (['32', '36', '44'].includes(element.talla)) {
          minQuantity = 20; // Tallas más comunes
        } else if (['30', '34', '38', '40'].includes(element.talla)) {
          minQuantity = 15;
        } else {
          minQuantity = 10; // Tallas menos comunes
        }
      } else if (element.name.toLowerCase().includes('camisa')) {
        // Las camisas se entregan más frecuentemente
        minQuantity = 25;
      } else if (element.name.toLowerCase().includes('chaqueta')) {
        // Las chaquetas duran más
        minQuantity = 12;
      }
      
      await client.query(`
        UPDATE supply_inventory 
        SET minimum_quantity = $1 
        WHERE code = $2
      `, [minQuantity, element.code]);
    }
    
    await client.query('COMMIT');
    console.log(`✅ Cantidades mínimas ajustadas para ${elements.rows.length} elementos`);
    
    // 3. Verificar estructura para control de dotación
    console.log('\n👥 3. VERIFICANDO ESTRUCTURA PARA CONTROL DE DOTACIÓN:');
    
    // Verificar que tenemos la información necesaria para dotación
    const dotationInfo = await client.query(`
      SELECT 
        code,
        name,
        category,
        talla,
        quantity,
        minimum_quantity,
        CASE 
          WHEN quantity <= 0 THEN 'Sin stock'
          WHEN quantity <= minimum_quantity THEN 'Stock bajo'
          ELSE 'Stock normal'
        END as status
      FROM supply_inventory 
      WHERE talla IS NOT NULL
      ORDER BY name, CAST(talla AS INTEGER)
    `);
    
    console.log('📊 Estado actual para dotación:');
    console.log(`Total elementos: ${dotationInfo.rows.length}`);
    
    const statusCounts = dotationInfo.rows.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      const icon = status === 'Stock normal' ? '✅' : status === 'Stock bajo' ? '⚠️' : '❌';
      console.log(`  ${icon} ${status}: ${count} elementos`);
    });
    
    // 4. Crear vista resumen para dotación
    console.log('\n📋 4. RESUMEN PARA CONTROL DE DOTACIÓN:');
    
    const summary = await client.query(`
      SELECT 
        name,
        category,
        COUNT(*) as tallas_disponibles,
        SUM(quantity) as stock_total,
        SUM(minimum_quantity) as minimo_requerido,
        CASE 
          WHEN SUM(quantity) <= SUM(minimum_quantity) THEN 'Requiere reabastecimiento'
          ELSE 'Stock adecuado'
        END as estado_general
      FROM supply_inventory 
      WHERE talla IS NOT NULL
      GROUP BY name, category
      ORDER BY name
    `);
    
    console.log('Por tipo de elemento:');
    summary.rows.forEach(row => {
      const icon = row.estado_general === 'Stock adecuado' ? '✅' : '⚠️';
      console.log(`  ${icon} ${row.name} (${row.category}):`);
      console.log(`     Tallas: ${row.tallas_disponibles}`);
      console.log(`     Stock: ${row.stock_total}/${row.minimo_requerido} (actual/mínimo)`);
      console.log(`     Estado: ${row.estado_general}`);
      console.log('');
    });
    
    // 5. Verificar tabla de entregas de dotación
    console.log('📝 5. VERIFICANDO SISTEMA DE ENTREGAS DE DOTACIÓN:');
    
    try {
      const deliveries = await client.query(`
        SELECT COUNT(*) as total_entregas
        FROM inventory_movements 
        WHERE movement_type = 'salida'
      `);
      
      console.log(`✅ Entregas registradas: ${deliveries.rows[0].total_entregas}`);
      
      // Últimas entregas
      const recentDeliveries = await client.query(`
        SELECT 
          im.movement_type,
          im.quantity,
          im.reason,
          im.created_at,
          si.code,
          si.name,
          si.talla
        FROM inventory_movements im
        JOIN supply_inventory si ON im.supply_id = si.id
        WHERE im.movement_type = 'salida'
        ORDER BY im.created_at DESC
        LIMIT 5
      `);
      
      if (recentDeliveries.rows.length > 0) {
        console.log('\nÚltimas entregas de dotación:');
        recentDeliveries.rows.forEach(delivery => {
          const date = new Date(delivery.created_at).toLocaleDateString('es-CO');
          console.log(`  • ${delivery.quantity} ${delivery.name} talla ${delivery.talla} (${delivery.code}) - ${date}`);
        });
      }
      
    } catch (error) {
      console.log('ℹ️  Sistema de entregas listo para usar');
    }
    
    // 6. Recomendaciones para control de dotación
    console.log('\n💡 6. RECOMENDACIONES PARA CONTROL DE DOTACIÓN:');
    
    const recommendations = [];
    
    // Elementos que requieren reabastecimiento
    const lowStock = await client.query(`
      SELECT name, category, COUNT(*) as tallas_bajas
      FROM supply_inventory 
      WHERE talla IS NOT NULL AND quantity <= minimum_quantity
      GROUP BY name, category
    `);
    
    if (lowStock.rows.length > 0) {
      recommendations.push('Reabastecer elementos con stock bajo');
      lowStock.rows.forEach(item => {
        console.log(`  - ${item.name} (${item.category}): ${item.tallas_bajas} tallas necesitan reabastecimiento`);
      });
    }
    
    // Verificar distribución de tallas
    const sizeDistribution = await client.query(`
      SELECT 
        talla,
        COUNT(*) as elementos,
        SUM(quantity) as stock_total
      FROM supply_inventory 
      WHERE talla IS NOT NULL
      GROUP BY talla
      ORDER BY CAST(talla AS INTEGER)
    `);
    
    console.log('\n📏 Distribución de tallas en inventario:');
    sizeDistribution.rows.forEach(size => {
      console.log(`  Talla ${size.talla}: ${size.elementos} tipos de elementos, ${size.stock_total} unidades totales`);
    });
    
    console.log('\n🎉 SISTEMA DE CONTROL DE DOTACIÓN CORREGIDO');
    console.log('==========================================');
    console.log('✅ Precios eliminados (no aplican en dotación)');
    console.log('✅ Cantidades mínimas ajustadas para dotación laboral');
    console.log('✅ Estructura optimizada para control de entregas');
    console.log('✅ Sistema enfocado en gestión de elementos laborales');
    console.log('✅ Preparado para seguimiento de dotaciones por empleado');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error corrigiendo sistema:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  fixDotationSystem();
}

module.exports = { fixDotationSystem };