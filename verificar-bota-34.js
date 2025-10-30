// Verificar botas talla 34
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function verificarBota34() {
  console.log('🔍 Verificando botas talla 34...\n');
  
  try {
    // Buscar todas las botas talla 34
    const result = await pool.query(`
      SELECT id, code, name, category, talla, genero, quantity
      FROM supply_inventory
      WHERE name = 'Botas' AND talla = '34'
      ORDER BY genero NULLS FIRST;
    `);

    console.log(`📦 Total botas talla 34: ${result.rows.length}\n`);
    console.table(result.rows);

    // Verificar si hay alguna sin género
    const sinGenero = result.rows.filter(r => r.genero === null);
    if (sinGenero.length > 0) {
      console.log(`\n⚠️ PROBLEMA ENCONTRADO: ${sinGenero.length} bota(s) talla 34 sin género:`);
      console.table(sinGenero);

      console.log('\n🔍 Buscando movimientos asociados...');
      for (const bota of sinGenero) {
        const movimientos = await pool.query(`
          SELECT * FROM inventory_movements
          WHERE supply_id = $1;
        `, [bota.id]);
        
        if (movimientos.rows.length > 0) {
          console.log(`\nMovimientos para ID ${bota.id}:`);
          console.table(movimientos.rows);
        }
      }
    } else {
      console.log('\n✅ No hay botas talla 34 sin género');
    }

    // Verificar todas las botas sin género
    console.log('\n🔍 Verificando TODAS las botas sin género...');
    const todasSinGenero = await pool.query(`
      SELECT id, code, name, category, talla, genero, quantity
      FROM supply_inventory
      WHERE name = 'Botas' AND genero IS NULL
      ORDER BY talla;
    `);

    if (todasSinGenero.rows.length > 0) {
      console.log(`\n⚠️ ${todasSinGenero.rows.length} botas sin género encontradas:`);
      console.table(todasSinGenero.rows);
    } else {
      console.log('✅ No hay botas sin género');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verificarBota34();
