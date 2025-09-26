const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkDatabase() {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT id, code, name, category, talla, quantity 
      FROM supply_inventory 
      WHERE code LIKE '%-%' AND LENGTH(code) > 10
      ORDER BY code
    `);
    
    console.log('=== REGISTROS CON CÓDIGOS PROBLEMÁTICOS ===');
    console.log(`Total encontrados: ${result.rows.length}`);
    
    result.rows.forEach(row => {
      console.log(`ID: ${row.id}, Código: "${row.code}", Nombre: "${row.name}", Talla: "${row.talla}", Stock: ${row.quantity}`);
    });
    
    // También verificar registros base
    const baseResult = await client.query(`
      SELECT id, code, name, category, talla, quantity 
      FROM supply_inventory 
      WHERE talla IS NULL
      ORDER BY code
    `);
    
    console.log('\n=== REGISTROS BASE (SIN TALLA) ===');
    console.log(`Total encontrados: ${baseResult.rows.length}`);
    
    baseResult.rows.forEach(row => {
      console.log(`ID: ${row.id}, Código: "${row.code}", Nombre: "${row.name}", Stock: ${row.quantity}`);
    });
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDatabase();