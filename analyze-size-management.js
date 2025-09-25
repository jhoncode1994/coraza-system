const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function analyzeSizeManagement() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 ANÁLISIS COMPLETO DEL SISTEMA DE GESTIÓN DE TALLAS');
    console.log('===================================================\n');
    
    // 1. Análisis de estructura actual
    console.log('📊 1. ESTRUCTURA ACTUAL DE ELEMENTOS CON TALLAS:');
    const elementsWithSizes = await client.query(`
      SELECT 
        code,
        name,
        category,
        talla,
        quantity,
        minimum_quantity,
        unit_price
      FROM supply_inventory 
      WHERE talla IS NOT NULL
      ORDER BY code, CAST(talla AS INTEGER) 
    `);
    
    console.log(`Total elementos con tallas: ${elementsWithSizes.rows.length}`);
    
    // Agrupar por código base
    const groupedElements = {};
    elementsWithSizes.rows.forEach(row => {
      const baseCode = row.code.split('-')[0];
      if (!groupedElements[baseCode]) {
        groupedElements[baseCode] = {
          name: row.name,
          category: row.category,
          unit_price: row.unit_price,
          sizes: []
        };
      }
      groupedElements[baseCode].sizes.push({
        talla: row.talla,
        code: row.code,
        quantity: row.quantity,
        minimum_quantity: row.minimum_quantity
      });
    });
    
    console.log('\nElementos agrupados por código base:');
    Object.entries(groupedElements).forEach(([baseCode, data]) => {
      console.log(`\n${baseCode} - ${data.name} (${data.category})`);
      console.log(`  Precio unitario: $${data.unit_price || 'No definido'}`);
      console.log('  Tallas disponibles:');
      data.sizes.forEach(size => {
        const status = size.quantity > 0 ? '✅' : '⚠️';
        console.log(`    ${status} Talla ${size.talla}: ${size.quantity}/${size.minimum_quantity} (${size.code})`);
      });
    });
    
    // 2. Análisis de problemas potenciales
    console.log('\n\n🔍 2. ANÁLISIS DE PROBLEMAS POTENCIALES:');
    
    // Verificar códigos inconsistentes
    const inconsistentCodes = elementsWithSizes.rows.filter(row => {
      const baseCode = row.code.split('-')[0];
      const expectedCode = `${baseCode}-${row.talla}`;
      return row.code !== expectedCode;
    });
    
    if (inconsistentCodes.length > 0) {
      console.log('❌ Códigos inconsistentes encontrados:');
      inconsistentCodes.forEach(row => {
        const baseCode = row.code.split('-')[0];
        const expectedCode = `${baseCode}-${row.talla}`;
        console.log(`  - ${row.code} debería ser ${expectedCode}`);
      });
    } else {
      console.log('✅ Todos los códigos son consistentes');
    }
    
    // Verificar elementos sin stock
    const outOfStock = elementsWithSizes.rows.filter(row => row.quantity <= 0);
    if (outOfStock.length > 0) {
      console.log(`\n⚠️  Elementos sin stock: ${outOfStock.length}`);
      outOfStock.forEach(row => {
        console.log(`  - ${row.code} (Talla ${row.talla}): ${row.quantity} unidades`);
      });
    } else {
      console.log('\n✅ Todos los elementos tienen stock disponible');
    }
    
    // Verificar elementos con stock bajo
    const lowStock = elementsWithSizes.rows.filter(row => 
      row.quantity > 0 && row.quantity <= row.minimum_quantity
    );
    if (lowStock.length > 0) {
      console.log(`\n⚠️  Elementos con stock bajo: ${lowStock.length}`);
      lowStock.forEach(row => {
        console.log(`  - ${row.code} (Talla ${row.talla}): ${row.quantity}/${row.minimum_quantity} unidades`);
      });
    }
    
    // 3. Verificar eficiencia del sistema
    console.log('\n\n⚡ 3. ANÁLISIS DE EFICIENCIA:');
    
    // Verificar si hay elementos base sin eliminar
    const baseElements = await client.query(`
      SELECT code, name, category, talla
      FROM supply_inventory
      WHERE talla IS NULL
    `);
    
    if (baseElements.rows.length > 0) {
      console.log(`\n❌ Elementos base encontrados que podrían causar confusión: ${baseElements.rows.length}`);
      baseElements.rows.forEach(row => {
        // Verificar si este elemento base tiene versiones con tallas
        const hasVersionsWithSizes = elementsWithSizes.rows.some(sized => 
          sized.code.startsWith(row.code + '-')
        );
        if (hasVersionsWithSizes) {
          console.log(`  - ${row.code} - ${row.name} (DEBERÍA ELIMINARSE - tiene versiones con tallas)`);
        } else {
          console.log(`  - ${row.code} - ${row.name} (válido - no tiene versiones con tallas)`);
        }
      });
    } else {
      console.log('✅ No hay elementos base que causen confusión');
    }
    
    // 4. Probar el endpoint de tallas disponibles
    console.log('\n\n🌐 4. VERIFICACIÓN DEL ENDPOINT DE TALLAS:');
    
    for (const [baseCode, data] of Object.entries(groupedElements)) {
      try {
        const fetch = require('node-fetch');
        const response = await fetch(`http://localhost:3000/api/supply-inventory/available-sizes/${baseCode}/${data.category}`);
        
        if (response.ok) {
          const apiData = await response.json();
          const expectedSizes = data.sizes
            .filter(size => size.quantity > 0)
            .map(size => size.talla)
            .sort();
          const actualSizes = apiData.available_sizes.sort();
          
          const sizesMatch = JSON.stringify(expectedSizes) === JSON.stringify(actualSizes);
          
          if (sizesMatch) {
            console.log(`  ✅ ${baseCode}: API devuelve tallas correctas [${actualSizes.join(', ')}]`);
          } else {
            console.log(`  ❌ ${baseCode}: Discrepancia en tallas`);
            console.log(`     Esperado: [${expectedSizes.join(', ')}]`);
            console.log(`     Recibido: [${actualSizes.join(', ')}]`);
          }
        } else {
          console.log(`  ❌ ${baseCode}: Error en API (${response.status})`);
        }
      } catch (error) {
        console.log(`  ⚠️  ${baseCode}: No se pudo probar API - servidor no disponible`);
      }
    }
    
    // 5. Recomendaciones de mejora
    console.log('\n\n💡 5. RECOMENDACIONES DE MEJORA:');
    
    const recommendations = [];
    
    if (inconsistentCodes.length > 0) {
      recommendations.push('Corregir códigos inconsistentes');
    }
    
    if (outOfStock.length > 0) {
      recommendations.push('Reabastecer elementos sin stock');
    }
    
    if (lowStock.length > 0) {
      recommendations.push('Revisar elementos con stock bajo');
    }
    
    // Verificar si faltan precios
    const missingPrices = elementsWithSizes.rows.filter(row => !row.unit_price);
    if (missingPrices.length > 0) {
      recommendations.push('Definir precios unitarios faltantes');
    }
    
    if (recommendations.length > 0) {
      recommendations.forEach(rec => console.log(`  - ${rec}`));
    } else {
      console.log('  ✅ El sistema está funcionando óptimamente');
    }
    
    // 6. Resumen ejecutivo
    console.log('\n\n📋 6. RESUMEN EJECUTIVO:');
    console.log(`✅ Total elementos con tallas: ${elementsWithSizes.rows.length}`);
    console.log(`✅ Códigos base diferentes: ${Object.keys(groupedElements).length}`);
    console.log(`✅ Elementos con stock: ${elementsWithSizes.rows.filter(r => r.quantity > 0).length}`);
    console.log(`⚠️  Elementos sin stock: ${outOfStock.length}`);
    console.log(`⚠️  Elementos con stock bajo: ${lowStock.length}`);
    console.log(`${inconsistentCodes.length === 0 ? '✅' : '❌'} Consistencia de códigos: ${inconsistentCodes.length === 0 ? 'Perfecta' : 'Requiere corrección'}`);
    
  } catch (error) {
    console.error('❌ Error en análisis:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  analyzeSizeManagement();
}

module.exports = { analyzeSizeManagement };