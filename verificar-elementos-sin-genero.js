// Verificar si hay más elementos sin género que deberían tenerlo
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function verificarElementosSinGenero() {
  console.log('🔍 Verificando elementos que requieren género...\n');
  
  try {
    // Elementos que DEBERÍAN tener género
    const elementosConGenero = ['Pantalón', 'Camisa', 'Botas'];

    for (const elemento of elementosConGenero) {
      console.log(`\n📦 Verificando: ${elemento}`);
      
      const result = await pool.query(`
        SELECT id, code, name, talla, genero, quantity
        FROM supply_inventory
        WHERE name = $1 AND genero IS NULL
        ORDER BY talla;
      `, [elemento]);

      if (result.rows.length > 0) {
        console.log(`❌ ${result.rows.length} ${elemento}(es) sin género:`);
        console.table(result.rows);
      } else {
        console.log(`✅ Todos los ${elemento}s tienen género asignado`);
      }
    }

    // Resumen general
    console.log('\n📊 RESUMEN GENERAL:');
    const resumen = await pool.query(`
      SELECT 
        name,
        genero,
        COUNT(*) as cantidad,
        MIN(talla) as talla_min,
        MAX(talla) as talla_max,
        SUM(quantity) as stock_total
      FROM supply_inventory
      WHERE name IN ('Pantalón', 'Camisa', 'Botas')
      GROUP BY name, genero
      ORDER BY name, genero;
    `);
    console.table(resumen.rows);

    console.log('\n✅ Verificación completada');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verificarElementosSinGenero();
