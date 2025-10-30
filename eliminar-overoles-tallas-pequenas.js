// Eliminar overoles tallas 28, 30, 32, 34 de la base de datos
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function eliminarOverolesTallasPequenas() {
  console.log('🔧 ELIMINANDO OVEROLES TALLAS 28, 30, 32, 34\n');
  console.log('=' .repeat(60));
  
  try {
    const tallasEliminar = ['28', '30', '32', '34'];
    let totalEliminados = 0;
    
    for (const talla of tallasEliminar) {
      // Buscar overol con esta talla
      const overol = await pool.query(`
        SELECT id, code, talla, quantity 
        FROM supply_inventory 
        WHERE name = 'Overol' AND talla = $1;
      `, [talla]);

      if (overol.rows.length > 0) {
        const elemento = overol.rows[0];
        console.log(`\n🔍 Encontrado: Overol talla ${talla}`);
        console.log(`   Código: ${elemento.code}`);
        console.log(`   Stock actual: ${elemento.quantity}`);
        
        // Eliminar movimientos de inventario asociados
        const movimientos = await pool.query(`
          DELETE FROM inventory_movements WHERE supply_id = $1 RETURNING id;
        `, [elemento.id]);
        
        if (movimientos.rows.length > 0) {
          console.log(`   📦 Eliminados ${movimientos.rows.length} movimientos de inventario`);
        }
        
        // Eliminar el overol
        await pool.query(`
          DELETE FROM supply_inventory WHERE id = $1;
        `, [elemento.id]);
        
        console.log(`   ✅ Overol talla ${talla} eliminado`);
        totalEliminados++;
      } else {
        console.log(`\n⚠️  Overol talla ${talla} no existe`);
      }
    }
    
    // Mostrar overoles restantes
    console.log('\n' + '='.repeat(60));
    console.log('📊 OVEROLES RESTANTES EN INVENTARIO:\n');
    
    const overolesRestantes = await pool.query(`
      SELECT code, talla, quantity 
      FROM supply_inventory 
      WHERE name = 'Overol' 
      ORDER BY CAST(talla AS INTEGER);
    `);
    
    console.table(overolesRestantes.rows);
    console.log(`\nTotal overoles: ${overolesRestantes.rows.length}`);
    console.log(`Eliminados: ${totalEliminados}`);
    
    // Verificar total de elementos
    const totalElementos = await pool.query('SELECT COUNT(*) as total FROM supply_inventory;');
    console.log(`\n📦 TOTAL ELEMENTOS EN INVENTARIO: ${totalElementos.rows[0].total}`);
    
    console.log('\n✅ PROCESO COMPLETADO');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

eliminarOverolesTallasPequenas();
