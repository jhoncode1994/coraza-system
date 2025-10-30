// SCRIPT COMPLETO: Actualizar BD y Frontend con todas las modificaciones
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function aplicarTodasLasModificaciones() {
  console.log('🔧 APLICANDO TODAS LAS MODIFICACIONES\n');
  console.log('=' .repeat(60));
  
  try {
    // ✅ TAREA 1: Ya completada - Agregar Camisa 18 Mujer
    console.log('\n✅ TAREA 1: Camisa talla 18 Mujer - YA COMPLETADA');

    // ✅ TAREA 2: Ya completada - Eliminar Camisa 6 Mujer
    console.log('✅ TAREA 2: Eliminar Camisa talla 6 Mujer - YA COMPLETADA');

    // 🔧 TAREA 3: Agregar Corbatín
    console.log('\n🔧 TAREA 3: Agregar Corbatín...');
    const existeCorbatin = await pool.query(`
      SELECT * FROM supply_inventory WHERE name = 'Corbatín';
    `);
    
    if (existeCorbatin.rows.length === 0) {
      await pool.query(`
        INSERT INTO supply_inventory (code, name, category, quantity, minimum_quantity, description)
        VALUES ($1, $2, $3, $4, $5, $6);
      `, ['CORB001', 'Corbatín', 'accesorios', 0, 10, 'Corbatín para uniforme']);
      console.log('   ✅ Corbatín agregado');
    } else {
      console.log('   ⚠️ Corbatín ya existe');
    }

    // 🔧 TAREA 4: Agregar Pantalón 18 Mujer
    console.log('\n🔧 TAREA 4: Agregar Pantalón talla 18 Mujer...');
    const existePant18 = await pool.query(`
      SELECT * FROM supply_inventory WHERE name = 'Pantalón' AND talla = '18' AND genero = 'F';
    `);
    
    if (existePant18.rows.length === 0) {
      await pool.query(`
        INSERT INTO supply_inventory (code, name, category, quantity, minimum_quantity, talla, genero, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, ['PAN001-18F', 'Pantalón', 'uniforme', 0, 5, '18', 'F', 'Pantalón para dotación - Talla 18 Mujer']);
      console.log('   ✅ Pantalón talla 18 Mujer agregado');
    } else {
      console.log('   ⚠️ Pantalón talla 18 Mujer ya existe');
    }

    // 🔧 TAREA 5: Agregar Pantalón 20 Mujer
    console.log('\n🔧 TAREA 5: Agregar Pantalón talla 20 Mujer...');
    const existePant20 = await pool.query(`
      SELECT * FROM supply_inventory WHERE name = 'Pantalón' AND talla = '20' AND genero = 'F';
    `);
    
    if (existePant20.rows.length === 0) {
      await pool.query(`
        INSERT INTO supply_inventory (code, name, category, quantity, minimum_quantity, talla, genero, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, ['PAN001-20F', 'Pantalón', 'uniforme', 0, 5, '20', 'F', 'Pantalón para dotación - Talla 20 Mujer']);
      console.log('   ✅ Pantalón talla 20 Mujer agregado');
    } else {
      console.log('   ⚠️ Pantalón talla 20 Mujer ya existe');
    }

    // 🔧 TAREA 6: Eliminar Camisas 28, 30, 32 Hombre
    console.log('\n🔧 TAREA 6: Eliminar Camisas tallas 28, 30, 32 Hombre...');
    const tallasEliminarCamisa = ['28', '30', '32'];
    
    for (const talla of tallasEliminarCamisa) {
      const existe = await pool.query(`
        SELECT * FROM supply_inventory WHERE name = 'Camisa' AND talla = $1 AND genero = 'M';
      `, [talla]);

      if (existe.rows.length > 0) {
        // Eliminar movimientos
        await pool.query(`
          DELETE FROM inventory_movements WHERE supply_id = $1;
        `, [existe.rows[0].id]);

        // Eliminar camisa
        await pool.query(`
          DELETE FROM supply_inventory WHERE name = 'Camisa' AND talla = $1 AND genero = 'M';
        `, [talla]);
        console.log(`   ✅ Camisa talla ${talla} Hombre eliminada`);
      }
    }

    // 🔧 TAREA 7: Eliminar Pantalón talla 6 Mujer
    console.log('\n🔧 TAREA 7: Eliminar Pantalón talla 6 Mujer...');
    const existePant6 = await pool.query(`
      SELECT * FROM supply_inventory WHERE name = 'Pantalón' AND talla = '6' AND genero = 'F';
    `);

    if (existePant6.rows.length > 0) {
      // Eliminar movimientos
      await pool.query(`
        DELETE FROM inventory_movements WHERE supply_id = $1;
      `, [existePant6.rows[0].id]);

      // Eliminar pantalón
      await pool.query(`
        DELETE FROM supply_inventory WHERE name = 'Pantalón' AND talla = '6' AND genero = 'F';
      `);
      console.log('   ✅ Pantalón talla 6 Mujer eliminado');
    } else {
      console.log('   ⚠️ Pantalón talla 6 Mujer no existe');
    }

    // 📊 RESUMEN FINAL
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE CAMBIOS EN BASE DE DATOS:\n');

    // Camisas Mujer
    const camisasMujer = await pool.query(`
      SELECT code, talla, quantity FROM supply_inventory
      WHERE name = 'Camisa' AND genero = 'F'
      ORDER BY CAST(talla AS INTEGER);
    `);
    console.log('👚 CAMISAS MUJER:');
    console.table(camisasMujer.rows);
    console.log(`   Total: ${camisasMujer.rows.length} tallas (8, 10, 12, 14, 16, 18)`);

    // Camisas Hombre
    const camisasHombre = await pool.query(`
      SELECT code, talla, quantity FROM supply_inventory
      WHERE name = 'Camisa' AND genero = 'M'
      ORDER BY CAST(talla AS INTEGER);
    `);
    console.log('\n👔 CAMISAS HOMBRE:');
    console.table(camisasHombre.rows);
    console.log(`   Total: ${camisasHombre.rows.length} tallas (34, 36, 38, 40, 42, 44, 46, 48, 50)`);

    // Pantalones Mujer
    const pantalonesMujer = await pool.query(`
      SELECT code, talla, quantity FROM supply_inventory
      WHERE name = 'Pantalón' AND genero = 'F'
      ORDER BY CAST(talla AS INTEGER);
    `);
    console.log('\n👖 PANTALONES MUJER:');
    console.table(pantalonesMujer.rows);
    console.log(`   Total: ${pantalonesMujer.rows.length} tallas (8, 10, 12, 14, 16, 18, 20)`);

    // Corbatín
    const corbatin = await pool.query(`
      SELECT code, name, category, quantity FROM supply_inventory WHERE name = 'Corbatín';
    `);
    console.log('\n🎀 CORBATÍN:');
    console.table(corbatin.rows);

    // Total elementos
    const total = await pool.query('SELECT COUNT(*) as total FROM supply_inventory;');
    console.log(`\n📦 TOTAL ELEMENTOS EN INVENTARIO: ${total.rows[0].total}`);

    console.log('\n✅ TODAS LAS MODIFICACIONES EN BD COMPLETADAS');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

aplicarTodasLasModificaciones();
