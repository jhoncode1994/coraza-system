const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixDatabaseProblems() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Iniciando corrección de problemas en la base de datos...\n');
    
    // 1. Analizar estado actual
    console.log('📊 Estado actual de supply_inventory:');
    const currentInventory = await client.query(`
      SELECT id, code, name, category, talla, quantity 
      FROM supply_inventory 
      ORDER BY code, talla
    `);
    
    console.log('Total de elementos:', currentInventory.rows.length);
    currentInventory.rows.forEach(row => {
      console.log(`ID: ${row.id}, Code: ${row.code}, Name: ${row.name}, Talla: ${row.talla}, Cantidad: ${row.quantity}`);
    });
    
    console.log('\n🔍 Problemas detectados:');
    
    // Detectar elementos con códigos inconsistentes
    const inconsistentElements = currentInventory.rows.filter(row => {
      if (!row.talla) return false;
      const expectedCode = `${row.code.split('-')[0]}-${row.talla}`;
      return row.code !== expectedCode;
    });
    
    console.log('Elementos con códigos inconsistentes:', inconsistentElements.length);
    inconsistentElements.forEach(row => {
      const baseCode = row.code.split('-')[0];
      const expectedCode = `${baseCode}-${row.talla}`;
      console.log(`  ❌ ${row.code} (debería ser ${expectedCode})`);
    });
    
    // Detectar elementos base sin talla
    const baseElements = currentInventory.rows.filter(row => !row.talla);
    console.log('Elementos base sin talla:', baseElements.length);
    baseElements.forEach(row => {
      console.log(`  ℹ️  ${row.code} - ${row.name}`);
    });
    
    console.log('\n🛠️  Aplicando correcciones...\n');
    
    await client.query('BEGIN');
    
    // 2. Corregir códigos inconsistentes
    for (const element of inconsistentElements) {
      const baseCode = element.code.split('-')[0];
      const correctCode = `${baseCode}-${element.talla}`;
      
      console.log(`🔧 Corrigiendo ${element.code} → ${correctCode}`);
      
      await client.query(`
        UPDATE supply_inventory 
        SET code = $1 
        WHERE id = $2
      `, [correctCode, element.id]);
    }
    
    // 3. Eliminar elementos base duplicados si existen elementos con tallas
    for (const baseElement of baseElements) {
      const hasSpecificSizes = currentInventory.rows.some(row => 
        row.code.startsWith(baseElement.code + '-') && row.talla
      );
      
      if (hasSpecificSizes) {
        console.log(`🗑️  Eliminando elemento base duplicado: ${baseElement.code}`);
        await client.query(`
          DELETE FROM supply_inventory 
          WHERE id = $1
        `, [baseElement.id]);
      }
    }
    
    // 4. Agregar cantidades realistas a los elementos
    console.log('📦 Agregando cantidades de stock...');
    
    // Obtener elementos actualizados
    const updatedInventory = await client.query(`
      SELECT id, code, name, category, talla 
      FROM supply_inventory 
      WHERE talla IS NOT NULL
      ORDER BY code
    `);
    
    for (const item of updatedInventory.rows) {
      // Asignar cantidades basadas en el tipo de prenda y talla
      let cantidad = 0;
      
      if (item.category === 'uniforme' && item.name === 'Pantalón') {
        // Para pantalones, tallas más comunes tienen más stock
        if (['32', '36', '44'].includes(item.talla)) {
          cantidad = Math.floor(Math.random() * 50) + 20; // 20-70
        } else {
          cantidad = Math.floor(Math.random() * 20) + 5;  // 5-25
        }
      } else if (item.category === 'uniforme' && item.name === 'Camisa') {
        if (['M', 'L', 'XL'].includes(item.talla)) {
          cantidad = Math.floor(Math.random() * 60) + 30; // 30-90
        } else {
          cantidad = Math.floor(Math.random() * 25) + 10; // 10-35
        }
      } else {
        cantidad = Math.floor(Math.random() * 30) + 15; // 15-45
      }
      
      await client.query(`
        UPDATE supply_inventory 
        SET quantity = $1 
        WHERE id = $2
      `, [cantidad, item.id]);
      
      console.log(`  ✅ ${item.code} (${item.talla}): ${cantidad} unidades`);
    }
    
    await client.query('COMMIT');
    
    console.log('\n✅ Correcciones completadas exitosamente!\n');
    
    // 5. Mostrar estado final
    console.log('📊 Estado final de supply_inventory:');
    const finalInventory = await client.query(`
      SELECT code, name, category, talla, quantity 
      FROM supply_inventory 
      ORDER BY code, talla
    `);
    
    finalInventory.rows.forEach(row => {
      console.log(`${row.code} - ${row.name} (${row.category}) | Talla: ${row.talla} | Stock: ${row.quantity}`);
    });
    
    console.log(`\n🎉 Total elementos en inventario: ${finalInventory.rows.length}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error durante la corrección:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Función para verificar la integridad después de las correcciones
async function verifyIntegrity() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔍 Verificando integridad de la base de datos...\n');
    
    // Verificar que no hay elementos base duplicados
    const duplicateCheck = await client.query(`
      SELECT code, COUNT(*) as count
      FROM supply_inventory
      WHERE talla IS NULL
      GROUP BY code
      HAVING COUNT(*) > 1
    `);
    
    if (duplicateCheck.rows.length > 0) {
      console.log('❌ Elementos base duplicados encontrados:');
      duplicateCheck.rows.forEach(row => {
        console.log(`  ${row.code}: ${row.count} duplicados`);
      });
    } else {
      console.log('✅ No hay elementos base duplicados');
    }
    
    // Verificar códigos consistentes
    const inconsistentCheck = await client.query(`
      SELECT code, talla
      FROM supply_inventory
      WHERE talla IS NOT NULL
      AND code != CONCAT(SPLIT_PART(code, '-', 1), '-', talla)
    `);
    
    if (inconsistentCheck.rows.length > 0) {
      console.log('❌ Códigos inconsistentes encontrados:');
      inconsistentCheck.rows.forEach(row => {
        console.log(`  ${row.code} con talla ${row.talla}`);
      });
    } else {
      console.log('✅ Todos los códigos son consistentes');
    }
    
    // Verificar que todos los elementos tienen stock
    const zeroStockCheck = await client.query(`
      SELECT COUNT(*) as zero_stock_count
      FROM supply_inventory
      WHERE quantity = 0
    `);
    
    console.log(`ℹ️  Elementos con stock 0: ${zeroStockCheck.rows[0].zero_stock_count}`);
    
    // Resumen por categoría
    const categoryStats = await client.query(`
      SELECT category, COUNT(*) as elementos, SUM(quantity) as total_stock
      FROM supply_inventory
      GROUP BY category
      ORDER BY category
    `);
    
    console.log('\n📈 Resumen por categoría:');
    categoryStats.rows.forEach(row => {
      console.log(`  ${row.category}: ${row.elementos} elementos, ${row.total_stock} unidades totales`);
    });
    
  } catch (error) {
    console.error('❌ Error durante verificación:', error.message);
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await fixDatabaseProblems();
    await verifyIntegrity();
  } catch (error) {
    console.error('❌ Error general:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixDatabaseProblems, verifyIntegrity };