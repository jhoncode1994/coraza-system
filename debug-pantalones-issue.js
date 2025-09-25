/**
 * Script para diagnosticar el problema de tallas en pantalones
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_expMyzc2PY1o@ep-solitary-scene-adpyw2k4-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function debugPantalonesIssue() {
  console.log('🔍 DIAGNÓSTICO DEL PROBLEMA DE PANTALONES');
  console.log('========================================');
  
  const client = await pool.connect();
  
  try {
    // 1. Ver todos los pantalones en la base
    console.log('1. 📊 Revisando todos los registros de pantalones:');
    const pantalones = await client.query(`
      SELECT code, name, talla, quantity, minimum_quantity, category
      FROM supply_inventory 
      WHERE name ILIKE '%pantalon%' OR code ILIKE '%pan%'
      ORDER BY name, talla
    `);
    
    console.log(`   Total registros encontrados: ${pantalones.rows.length}`);
    pantalones.rows.forEach(row => {
      console.log(`   📦 ${row.code} | ${row.name} | Talla: ${row.talla || 'NULL'} | Stock: ${row.quantity} | Categoría: ${row.category}`);
    });
    
    // 2. Calcular stock total
    const stockTotal = pantalones.rows.reduce((sum, row) => sum + (row.quantity || 0), 0);
    console.log(`   💰 Stock total calculado: ${stockTotal} unidades`);
    
    // 3. Simular diferentes consultas de available-sizes
    console.log('\n2. 🔍 Simulando consultas available-sizes:');
    
    const consultas = [
      { elemento: 'pantalon', categoria: 'uniforme' },
      { elemento: 'pantalon', categoria: 'dotacion' },
      { elemento: 'PAN', categoria: 'uniforme' },
      { elemento: 'Pantalón', categoria: 'uniforme' }
    ];
    
    for (const consulta of consultas) {
      console.log(`\n   🔎 Probando: elemento='${consulta.elemento}', categoría='${consulta.categoria}'`);
      
      const result = await client.query(`
        SELECT DISTINCT talla, quantity, code, name
        FROM supply_inventory 
        WHERE code ILIKE $1 
          AND category = $2 
          AND talla IS NOT NULL 
          AND quantity > 0
        ORDER BY talla
      `, [`${consulta.elemento}%`, consulta.categoria]);
      
      console.log(`   📊 Resultados: ${result.rows.length} tallas encontradas`);
      if (result.rows.length > 0) {
        result.rows.forEach(row => {
          console.log(`      ✅ Talla ${row.talla}: ${row.quantity} unidades (${row.code})`);
        });
      } else {
        console.log('      ❌ No se encontraron tallas disponibles');
      }
    }
    
    // 4. Verificar nombres exactos usados en frontend
    console.log('\n3. 🔍 Verificando nombres exactos para frontend:');
    const nombresUnicos = await client.query(`
      SELECT DISTINCT name, category, COUNT(*) as variantes
      FROM supply_inventory 
      WHERE name ILIKE '%pantalon%'
      GROUP BY name, category
      ORDER BY name
    `);
    
    console.log('   📋 Nombres únicos de pantalones:');
    nombresUnicos.rows.forEach(row => {
      console.log(`      "${row.name}" (${row.category}) - ${row.variantes} variantes`);
    });
    
    // 5. Verificar si el problema es en el código base
    console.log('\n4. 🔍 Analizando códigos base para matching:');
    const codigosUnicos = await client.query(`
      SELECT DISTINCT 
        LEFT(code, POSITION('-' in code || code) - 1) as codigo_base,
        COUNT(*) as total_tallas
      FROM supply_inventory 
      WHERE name ILIKE '%pantalon%'
        AND code LIKE '%-%'
      GROUP BY LEFT(code, POSITION('-' in code || code) - 1)
      ORDER BY codigo_base
    `);
    
    if (codigosUnicos.rows.length > 0) {
      console.log('   📊 Códigos base encontrados:');
      codigosUnicos.rows.forEach(row => {
        console.log(`      ${row.codigo_base}: ${row.total_tallas} tallas`);
      });
    } else {
      console.log('   ❌ No se encontraron códigos con formato base-talla');
    }
    
    // 6. Probar la consulta exacta que debería usar el frontend
    console.log('\n5. 🎯 Probando consulta exacta del frontend:');
    
    // Asumiendo que el frontend envía el nombre exacto del elemento
    const nombrePantalon = pantalones.rows.length > 0 ? pantalones.rows[0].name : 'Pantalón';
    
    console.log(`   🔎 Buscando con nombre: "${nombrePantalon}"`);
    
    const frontendQuery = await client.query(`
      SELECT code, talla, quantity, name, category
      FROM supply_inventory 
      WHERE name = $1
        AND talla IS NOT NULL 
        AND quantity > 0
      ORDER BY talla
    `, [nombrePantalon]);
    
    console.log(`   📊 Resultados con nombre exacto: ${frontendQuery.rows.length}`);
    if (frontendQuery.rows.length > 0) {
      frontendQuery.rows.forEach(row => {
        console.log(`      ✅ ${row.name} - Talla ${row.talla}: ${row.quantity} unidades (${row.code})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
  }
}

debugPantalonesIssue()
  .then(() => {
    console.log('\n✅ Diagnóstico completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error general:', error);
    process.exit(1);
  });