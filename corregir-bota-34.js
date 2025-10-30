// Corregir bota 34 sin género
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function corregirBota34() {
  console.log('🔧 Corrigiendo bota talla 34 sin género...\n');
  
  try {
    // 1. Verificar estado actual
    const actual = await pool.query(`
      SELECT id, code, name, talla, genero, quantity
      FROM supply_inventory
      WHERE name = 'Botas' AND talla = '34'
      ORDER BY genero NULLS FIRST;
    `);

    console.log('📊 ESTADO ACTUAL:');
    console.table(actual.rows);

    const botaSinGenero = actual.rows.find(b => b.genero === null);
    const botaMujer = actual.rows.find(b => b.genero === 'F');
    const botaHombre = actual.rows.find(b => b.genero === 'M');

    if (!botaSinGenero) {
      console.log('\n✅ No hay botas sin género. Todo está correcto.');
      return;
    }

    console.log(`\n⚠️ Encontrada bota sin género con ${botaSinGenero.quantity} unidades`);
    console.log('💡 Decisión: Transferir todas las unidades a Botas Mujer (F)');
    console.log('   (Ya que el rango de mujer es 34-39 y hombre empieza en 34)');

    // 2. Preguntar confirmación (simulada - en este caso automática)
    console.log('\n🔄 Transferencia:');
    console.log(`   - Botas 34 sin género (ID ${botaSinGenero.id}): ${botaSinGenero.quantity} → 0 unidades`);
    console.log(`   - Botas 34 Mujer (ID ${botaMujer.id}): ${botaMujer.quantity} → ${botaMujer.quantity + botaSinGenero.quantity} unidades`);

    // 3. Transferir stock
    const nuevaCantidadMujer = botaMujer.quantity + botaSinGenero.quantity;
    
    await pool.query(`
      UPDATE supply_inventory
      SET quantity = $1, last_update = CURRENT_TIMESTAMP
      WHERE id = $2;
    `, [nuevaCantidadMujer, botaMujer.id]);

    console.log(`\n✅ Stock transferido a Botas 34 Mujer`);

    // 4. Eliminar movimientos asociados
    console.log('\n🗑️ Eliminando movimientos de inventario asociados...');
    const movimientos = await pool.query(`
      DELETE FROM inventory_movements
      WHERE supply_id = $1
      RETURNING *;
    `, [botaSinGenero.id]);

    console.log(`✅ ${movimientos.rows.length} movimiento(s) eliminado(s)`);

    // 5. Eliminar bota sin género
    console.log('\n🗑️ Eliminando bota sin género...');
    await pool.query(`
      DELETE FROM supply_inventory
      WHERE id = $1;
    `, [botaSinGenero.id]);

    console.log('✅ Bota sin género eliminada');

    // 6. Verificar resultado final
    console.log('\n📊 ESTADO FINAL:');
    const final = await pool.query(`
      SELECT id, code, name, talla, genero, quantity,
             CASE 
               WHEN genero = 'F' THEN 'Mujer'
               WHEN genero = 'M' THEN 'Hombre'
               ELSE 'Sin género'
             END as tipo
      FROM supply_inventory
      WHERE name = 'Botas' AND talla = '34'
      ORDER BY genero;
    `);
    console.table(final.rows);

    // 7. Verificar total de elementos
    const total = await pool.query('SELECT COUNT(*) as total FROM supply_inventory;');
    console.log(`\n📦 Total de elementos en inventario: ${total.rows[0].total}`);

    if (total.rows[0].total === '73') {
      console.log('✅ ¡Perfecto! Inventario correcto con 73 elementos');
    } else {
      console.log(`⚠️ Atención: Se esperaban 73 elementos, hay ${total.rows[0].total}`);
    }

    console.log('\n✅ ¡Corrección completada exitosamente!');
    console.log('💡 Ahora al agregar stock a Botas 34 Mujer, se agregará correctamente');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

corregirBota34();
