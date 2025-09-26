const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testSizeAddition() {
  try {
    const client = await pool.connect();
    
    console.log('=== PRUEBA DE ADICIÓN DE NUEVAS TALLAS ===');
    
    // Simular agregado de stock con tallas para diferentes elementos
    const testCases = [
      { elementName: 'Camisa', elementId: 1, talla: 'M', quantity: 10 },
      { elementName: 'Camisa', elementId: 1, talla: 'L', quantity: 15 },
      { elementName: 'Botas', elementId: 7, talla: '38', quantity: 5 },
      { elementName: 'Botas', elementId: 7, talla: '42', quantity: 8 }
    ];
    
    console.log('🧪 Ejecutando casos de prueba...\n');
    
    for (const testCase of testCases) {
      console.log(`--- PRUEBA: ${testCase.elementName} Talla ${testCase.talla} ---`);
      
      // Simular el proceso que se ejecuta en el endpoint
      await client.query('BEGIN');
      
      try {
        // 1. Buscar si ya existe un registro para esta talla
        const existingQuery = `
          SELECT id, quantity, name, category 
          FROM supply_inventory 
          WHERE (id = $1 OR (name = (SELECT name FROM supply_inventory WHERE id = $1) 
                            AND category = (SELECT category FROM supply_inventory WHERE id = $1)))
            AND talla = $2
        `;
        const existingResult = await client.query(existingQuery, [testCase.elementId, testCase.talla]);
        
        if (existingResult.rows.length > 0) {
          console.log(`  ✅ Ya existe registro para talla ${testCase.talla}`);
          console.log(`  📊 Stock actual: ${existingResult.rows[0].quantity}`);
        } else {
          console.log(`  🆕 Creando nuevo registro para talla ${testCase.talla}`);
          
          // 2. Obtener información del elemento base
          const baseItemQuery = `
            SELECT name, category, minimum_quantity, code 
            FROM supply_inventory 
            WHERE (id = $1 OR (name = (SELECT name FROM supply_inventory WHERE id = $1) 
                              AND category = (SELECT category FROM supply_inventory WHERE id = $1)))
              AND talla IS NULL
            LIMIT 1
          `;
          let baseItem = await client.query(baseItemQuery, [testCase.elementId]);
          
          if (baseItem.rows.length === 0) {
            const fallbackQuery = 'SELECT name, category, minimum_quantity, code FROM supply_inventory WHERE id = $1';
            baseItem = await client.query(fallbackQuery, [testCase.elementId]);
          }
          
          if (baseItem.rows.length === 0) {
            throw new Error('Elemento no encontrado');
          }
          
          const { name, category, minimum_quantity, code } = baseItem.rows[0];
          const baseCode = code.split('-')[0];
          const newCode = `${baseCode}-${testCase.talla}`;
          
          console.log(`  📝 Código base: "${code}" -> Código nuevo: "${newCode}"`);
          
          // 3. Crear nuevo registro (simulado - no ejecutamos realmente)
          console.log(`  🎯 Se crearía: ${name} (${newCode}) - Talla ${testCase.talla} - Stock: ${testCase.quantity}`);
          
          // Verificar que el código sería correcto
          const guionCount = (newCode.match(/-/g) || []).length;
          if (guionCount === 1) {
            console.log(`  ✅ Código correcto: solo 1 guión`);
          } else {
            console.log(`  ❌ CÓDIGO PROBLEMÁTICO: ${guionCount} guiones`);
          }
        }
        
        await client.query('ROLLBACK'); // No queremos guardar los cambios de prueba
        console.log(`  ✅ Prueba completada\n`);
        
      } catch (error) {
        await client.query('ROLLBACK');
        console.log(`  ❌ Error en prueba: ${error.message}\n`);
      }
    }
    
    // Verificar estado actual de elementos con tallas
    console.log('=== ESTADO ACTUAL DEL SISTEMA ===');
    const currentState = await client.query(`
      SELECT name, COUNT(*) as total_records,
             COUNT(CASE WHEN talla IS NOT NULL THEN 1 END) as with_size,
             COUNT(CASE WHEN code ~ '.*-.*-.*' THEN 1 END) as problematic
      FROM supply_inventory 
      GROUP BY name 
      HAVING COUNT(CASE WHEN talla IS NOT NULL THEN 1 END) > 0 
         OR COUNT(CASE WHEN code ~ '.*-.*-.*' THEN 1 END) > 0
      ORDER BY name
    `);
    
    currentState.rows.forEach(row => {
      const status = row.problematic > 0 ? '❌' : '✅';
      console.log(`${status} ${row.name}: ${row.total_records} registros (${row.with_size} con talla, ${row.problematic} problemáticos)`);
    });
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('Error en prueba:', error);
  }
}

testSizeAddition();