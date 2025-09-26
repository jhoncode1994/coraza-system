const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkAllElementsWithSizes() {
  try {
    const client = await pool.connect();
    
    console.log('=== VERIFICANDO TODOS LOS ELEMENTOS QUE PODRÍAN REQUERIR TALLAS ===');
    
    // Elementos que según la configuración requieren tallas
    const elementsWithSizes = ['botas', 'camisa', 'chaqueta', 'overol', 'pantalon'];
    
    for (const element of elementsWithSizes) {
      console.log(`\n--- VERIFICANDO: ${element.toUpperCase()} ---`);
      
      // Buscar registros base (sin talla)
      const baseResult = await client.query(`
        SELECT id, code, name, category, quantity 
        FROM supply_inventory 
        WHERE LOWER(name) LIKE '%${element}%' AND talla IS NULL
        ORDER BY name
      `);
      
      console.log(`  Registros base encontrados: ${baseResult.rows.length}`);
      baseResult.rows.forEach(row => {
        console.log(`    ID: ${row.id}, Código: "${row.code}", Nombre: "${row.name}", Stock: ${row.quantity}`);
      });
      
      // Buscar registros con talla
      const tallaResult = await client.query(`
        SELECT id, code, name, category, talla, quantity 
        FROM supply_inventory 
        WHERE LOWER(name) LIKE '%${element}%' AND talla IS NOT NULL
        ORDER BY talla
      `);
      
      console.log(`  Registros con talla encontrados: ${tallaResult.rows.length}`);
      tallaResult.rows.forEach(row => {
        console.log(`    ID: ${row.id}, Código: "${row.code}", Talla: "${row.talla}", Stock: ${row.quantity}`);
      });
      
      // Verificar si hay códigos problemáticos para este elemento
      const problematicResult = await client.query(`
        SELECT id, code, name, talla 
        FROM supply_inventory 
        WHERE LOWER(name) LIKE '%${element}%' AND code ~ '.*-.*-.*'
        ORDER BY code
      `);
      
      if (problematicResult.rows.length > 0) {
        console.log(`  ❌ CÓDIGOS PROBLEMÁTICOS DETECTADOS: ${problematicResult.rows.length}`);
        problematicResult.rows.forEach(row => {
          console.log(`    ⚠️  ID: ${row.id}, Código problemático: "${row.code}", Talla: "${row.talla}"`);
        });
      } else {
        console.log(`  ✅ No hay códigos problemáticos para ${element}`);
      }
    }
    
    // También verificar elementos con categorías especiales
    console.log('\n=== VERIFICANDO CATEGORÍAS ESPECIALES ===');
    const specialCategories = ['uniforme', 'calzado'];
    
    for (const category of specialCategories) {
      console.log(`\n--- CATEGORÍA: ${category.toUpperCase()} ---`);
      
      const categoryResult = await client.query(`
        SELECT id, code, name, category, talla, quantity,
               CASE WHEN code ~ '.*-.*-.*' THEN true ELSE false END as is_problematic
        FROM supply_inventory 
        WHERE LOWER(category) = '${category}'
        ORDER BY name, talla
      `);
      
      console.log(`  Total de registros: ${categoryResult.rows.length}`);
      
      const problematic = categoryResult.rows.filter(row => row.is_problematic);
      const correct = categoryResult.rows.filter(row => !row.is_problematic);
      
      if (problematic.length > 0) {
        console.log(`  ❌ REGISTROS PROBLEMÁTICOS: ${problematic.length}`);
        problematic.forEach(row => {
          console.log(`    ⚠️  "${row.code}" - ${row.name} (Talla: ${row.talla})`);
        });
      }
      
      if (correct.length > 0) {
        console.log(`  ✅ REGISTROS CORRECTOS: ${correct.length}`);
        correct.forEach(row => {
          console.log(`    "${row.code}" - ${row.name} (Talla: ${row.talla || 'N/A'})`);
        });
      }
    }
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAllElementsWithSizes();