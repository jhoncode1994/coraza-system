const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: { require: true }
});

async function updateUserCargo() {
  try {
    console.log('Actualizando cargo del usuario ID 25...');
    
    // Actualizar el usuario ID 25 con cargo "Vigilante"
    const result = await pool.query(
      'UPDATE users SET cargo = $1 WHERE id = $2 RETURNING *',
      ['Vigilante', 25]
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Usuario actualizado exitosamente:');
      console.log(result.rows[0]);
    } else {
      console.log('❌ No se encontró el usuario con ID 25');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

updateUserCargo();
