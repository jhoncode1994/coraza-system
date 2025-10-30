// Tarea 2: Eliminar Camisa talla 6 Mujer
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function eliminarCamisa6Mujer() {
  console.log('📋 TAREA 2: Eliminar Camisa talla 6 Mujer\n');
  
  try {
    // Verificar si existe y su estado
    const existe = await pool.query(`
      SELECT * FROM supply_inventory 
      WHERE name = 'Camisa' AND talla = '6' AND genero = 'F';
    `);

    if (existe.rows.length === 0) {
      console.log('⚠️ La Camisa talla 6 Mujer no existe en la base de datos.');
      return;
    }

    console.log('📦 CAMISA A ELIMINAR:');
    console.table(existe.rows);

    const camisa = existe.rows[0];

    if (camisa.quantity > 0) {
      console.log(`\n⚠️ ADVERTENCIA: Esta camisa tiene ${camisa.quantity} unidades en stock.`);
      console.log('   Se eliminará de todos modos.');
    }

    // Verificar movimientos asociados
    const movimientos = await pool.query(`
      SELECT COUNT(*) as total FROM inventory_movements WHERE supply_id = $1;
    `, [camisa.id]);

    if (movimientos.rows[0].total > 0) {
      console.log(`\n🗑️ Eliminando ${movimientos.rows[0].total} movimiento(s) de inventario asociados...`);
      await pool.query(`
        DELETE FROM inventory_movements WHERE supply_id = $1;
      `, [camisa.id]);
      console.log('✅ Movimientos eliminados');
    }

    // Verificar entregas asociadas
    const entregas = await pool.query(`
      SELECT COUNT(*) as total FROM entrega_dotacion 
      WHERE elemento = 'Camisa' AND talla = '6' AND (genero_talla = 'F' OR genero_talla IS NULL);
    `);

    if (entregas.rows[0].total > 0) {
      console.log(`\n⚠️ Hay ${entregas.rows[0].total} entrega(s) asociada(s). NO se eliminarán por seguridad.`);
    }

    // Eliminar la camisa
    console.log('\n🗑️ Eliminando Camisa talla 6 Mujer...');
    const result = await pool.query(`
      DELETE FROM supply_inventory 
      WHERE name = 'Camisa' AND talla = '6' AND genero = 'F'
      RETURNING *;
    `);

    console.log('✅ Camisa talla 6 Mujer eliminada exitosamente');

    // Mostrar camisas de mujer actualizadas
    console.log('\n📊 CAMISAS DE MUJER ACTUALIZADAS:');
    const camisasMujer = await pool.query(`
      SELECT code, name, talla, genero, quantity
      FROM supply_inventory
      WHERE name = 'Camisa' AND genero = 'F'
      ORDER BY CAST(talla AS INTEGER);
    `);
    console.table(camisasMujer.rows);
    console.log(`Total camisas mujer: ${camisasMujer.rows.length} (ahora desde talla 8 hasta 18)`);

    // Contar total
    const total = await pool.query('SELECT COUNT(*) as total FROM supply_inventory;');
    console.log(`\n📦 Total elementos en inventario: ${total.rows[0].total}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

eliminarCamisa6Mujer();
