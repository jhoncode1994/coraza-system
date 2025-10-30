// Tarea 1: Agregar Camisa talla 18 Mujer
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function agregarCamisa18Mujer() {
  console.log('📋 TAREA 1: Agregar Camisa talla 18 Mujer\n');
  
  try {
    // Verificar si ya existe
    const existe = await pool.query(`
      SELECT * FROM supply_inventory 
      WHERE name = 'Camisa' AND talla = '18' AND genero = 'F';
    `);

    if (existe.rows.length > 0) {
      console.log('⚠️ La Camisa talla 18 Mujer ya existe:');
      console.table(existe.rows);
      return;
    }

    // Insertar nueva camisa
    const result = await pool.query(`
      INSERT INTO supply_inventory (code, name, category, quantity, minimum_quantity, talla, genero, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `, [
      'CAM001-18F',
      'Camisa',
      'uniforme',
      0,
      5,
      '18',
      'F',
      'Camisa para dotación - Talla 18 Mujer'
    ]);

    console.log('✅ Camisa talla 18 Mujer agregada exitosamente:');
    console.table(result.rows);

    // Mostrar todas las camisas de mujer
    console.log('\n📊 CAMISAS DE MUJER ACTUALIZADAS:');
    const camisasMujer = await pool.query(`
      SELECT code, name, talla, genero, quantity
      FROM supply_inventory
      WHERE name = 'Camisa' AND genero = 'F'
      ORDER BY CAST(talla AS INTEGER);
    `);
    console.table(camisasMujer.rows);

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

agregarCamisa18Mujer();
