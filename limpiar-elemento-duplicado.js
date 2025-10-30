// Eliminar elemento duplicado
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function limpiarDuplicado() {
  console.log('🧹 Eliminando elemento duplicado...\n');
  
  try {
    // Verificar el elemento
    const check = await pool.query(`
      SELECT * FROM supply_inventory 
      WHERE code = 'CAM001-8' AND genero IS NULL;
    `);

    if (check.rows.length > 0) {
      console.log('❌ Elemento duplicado encontrado:');
      console.table(check.rows);

      const elementId = check.rows[0].id;

      // Primero eliminar movimientos asociados
      console.log('\n🗑️ Eliminando movimientos de inventario asociados...');
      const movimientos = await pool.query(`
        DELETE FROM inventory_movements 
        WHERE supply_id = $1
        RETURNING *;
      `, [elementId]);

      if (movimientos.rows.length > 0) {
        console.log(`✅ ${movimientos.rows.length} movimiento(s) eliminado(s)`);
      }

      // Eliminar entregas asociadas si existen
      console.log('\n🗑️ Verificando entregas asociadas...');
      const entregas = await pool.query(`
        SELECT * FROM entrega_dotacion 
        WHERE elemento = 'Camisa' AND talla = '8' AND (genero_talla IS NULL OR genero_talla = '');
      `);

      if (entregas.rows.length > 0) {
        console.log(`⚠️ ${entregas.rows.length} entrega(s) encontrada(s). Estas NO se eliminarán por seguridad.`);
      }

      // Ahora eliminar el elemento
      console.log('\n🗑️ Eliminando elemento del inventario...');
      const result = await pool.query(`
        DELETE FROM supply_inventory 
        WHERE code = 'CAM001-8' AND genero IS NULL
        RETURNING *;
      `);

      console.log('✅ Elemento eliminado exitosamente:');
      console.table(result.rows);

      // Verificar total
      const total = await pool.query('SELECT COUNT(*) as total FROM supply_inventory;');
      console.log(`\n📦 Total de elementos después de limpiar: ${total.rows[0].total}`);

      if (total.rows[0].total === '73') {
        console.log('✅ ¡Perfecto! Ahora hay exactamente 73 elementos en la base de datos.');
      }
    } else {
      console.log('✅ No se encontró el elemento duplicado. La BD ya está limpia.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

limpiarDuplicado();
