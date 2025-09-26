const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkAllProblematicRecords() {
  try {
    const client = await pool.connect();
    
    console.log('=== VERIFICANDO TODOS LOS REGISTROS PROBLEMÁTICOS ===');
    
    // Buscar todos los registros que tienen múltiples guiones (códigos concatenados)
    const problematicResult = await client.query(`
      SELECT id, code, name, category, talla, quantity 
      FROM supply_inventory 
      WHERE code ~ '.*-.*-.*'
      ORDER BY name, code
    `);
    
    console.log(`Total de registros problemáticos encontrados: ${problematicResult.rows.length}`);
    
    if (problematicResult.rows.length > 0) {
      console.log('\n=== REGISTROS PROBLEMÁTICOS DETECTADOS ===');
      
      // Agrupar por nombre para mejor visualización
      const groupedRecords = {};
      problematicResult.rows.forEach(row => {
        if (!groupedRecords[row.name]) {
          groupedRecords[row.name] = [];
        }
        groupedRecords[row.name].push(row);
      });
      
      Object.keys(groupedRecords).forEach(name => {
        console.log(`\n--- ${name.toUpperCase()} ---`);
        groupedRecords[name].forEach(row => {
          console.log(`  ID: ${row.id}, Código: "${row.code}", Talla: "${row.talla}", Stock: ${row.quantity}`);
        });
      });
    } else {
      console.log('✅ No se encontraron registros problemáticos');
    }
    
    // Verificar también todos los elementos con talla
    const allTallaResult = await client.query(`
      SELECT name, COUNT(*) as total_records, 
             COUNT(CASE WHEN code ~ '.*-.*-.*' THEN 1 END) as problematic_records
      FROM supply_inventory 
      WHERE talla IS NOT NULL 
      GROUP BY name 
      ORDER BY name
    `);
    
    console.log('\n=== RESUMEN POR ELEMENTO CON TALLAS ===');
    allTallaResult.rows.forEach(row => {
      const status = row.problematic_records > 0 ? '❌' : '✅';
      console.log(`${status} ${row.name}: ${row.total_records} registros (${row.problematic_records} problemáticos)`);
    });
    
    // Mostrar códigos correctos para elementos con talla
    console.log('\n=== CÓDIGOS CORRECTOS ACTUALES ===');
    const correctResult = await client.query(`
      SELECT name, code, talla, quantity 
      FROM supply_inventory 
      WHERE talla IS NOT NULL AND code !~ '.*-.*-.*'
      ORDER BY name, code
    `);
    
    const correctGrouped = {};
    correctResult.rows.forEach(row => {
      if (!correctGrouped[row.name]) {
        correctGrouped[row.name] = [];
      }
      correctGrouped[row.name].push(row);
    });
    
    Object.keys(correctGrouped).forEach(name => {
      console.log(`\n--- ${name.toUpperCase()} (CORRECTOS) ---`);
      correctGrouped[name].forEach(row => {
        console.log(`  Código: "${row.code}", Talla: "${row.talla}", Stock: ${row.quantity}`);
      });
    });
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAllProblematicRecords();