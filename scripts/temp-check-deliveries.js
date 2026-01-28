// Script temporal para verificar datos de entregas - simula el endpoint pdf-data
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkDeliveryData() {
  const client = await pool.connect();
  
  console.log('=== SIMULANDO ENDPOINT /api/delivery/associate/:userId/pdf-data ===\n');
  
  // Obtener un usuario que tenga entregas
  const userWithDeliveries = await client.query(`
    SELECT DISTINCT u.id, u.nombre, u.apellido, u.cedula
    FROM users u
    JOIN entrega_dotacion e ON u.id = e."userId"
    LIMIT 1
  `);
  
  if (userWithDeliveries.rows.length === 0) {
    console.log('No hay usuarios con entregas');
    client.release();
    await pool.end();
    return;
  }
  
  const userId = userWithDeliveries.rows[0].id;
  console.log('Usuario de prueba:', userWithDeliveries.rows[0]);
  
  // Simular exactamente lo que hace el endpoint
  const deliveriesResult = await client.query(`
    SELECT 
      TO_CHAR("fechaEntrega", 'DD/MM/YYYY') as fecha,
      elemento,
      talla,
      cantidad,
      observaciones
    FROM entrega_dotacion
    WHERE "userId" = $1
    ORDER BY "fechaEntrega" DESC
    LIMIT 10
  `, [userId]);
  
  console.log('\n=== DATOS QUE SE ENVÍAN AL PDF ===');
  console.log('Formato esperado por el PDF:');
  console.table(deliveriesResult.rows);
  
  console.log('\n=== VERIFICACIÓN ===');
  deliveriesResult.rows.forEach((row, i) => {
    console.log(`Entrega ${i+1}:`);
    console.log(`  - fecha: "${row.fecha}" (${row.fecha ? '✅ tiene fecha' : '❌ SIN FECHA'})`);
    console.log(`  - elemento: "${row.elemento}"`);
    console.log(`  - talla: "${row.talla}"`);
    console.log(`  - cantidad: ${row.cantidad}`);
  });
  
  client.release();
  await pool.end();
}

checkDeliveryData();
