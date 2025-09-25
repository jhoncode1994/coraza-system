/**
 * Script para probar el endpoint corregido de available-sizes
 */

const { Pool } = require('pg');
const express = require('express');
const app = express();

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_expMyzc2PY1o@ep-solitary-scene-adpyw2k4-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

// Endpoint corregido
app.get('/api/supply-inventory/available-sizes/:element/:category', async (req, res) => {
  try {
    const { element, category } = req.params;
    console.log(`🔍 Getting available sizes for element: "${element}" in category: "${category}"`);
    
    const client = await pool.connect();
    
    // Buscar por nombre exacto del elemento con stock > 0
    const result = await client.query(`
      SELECT DISTINCT talla, quantity, code, name
      FROM supply_inventory 
      WHERE LOWER(name) = LOWER($1)
        AND category = $2 
        AND talla IS NOT NULL 
        AND quantity > 0
      ORDER BY 
        CASE talla
          WHEN '28' THEN 1
          WHEN '30' THEN 2  
          WHEN '32' THEN 3
          WHEN '34' THEN 4
          WHEN '36' THEN 5
          WHEN '38' THEN 6
          WHEN '40' THEN 7
          WHEN '42' THEN 8
          WHEN '44' THEN 9
          ELSE 10
        END,
        talla::INTEGER
    `, [element, category]);
    
    client.release();
    
    const availableSizes = result.rows.map(row => ({
      talla: row.talla,
      quantity: row.quantity,
      code: row.code,
      name: row.name
    }));
    
    console.log(`✅ Available sizes for "${element}" in ${category}:`, availableSizes);
    
    res.json({
      element,
      category,
      available_sizes: availableSizes.map(s => s.talla),
      stock_details: availableSizes
    });
    
  } catch (error) {
    console.error('Error fetching available sizes:', error);
    res.status(500).json({ 
      error: 'Error al obtener tallas disponibles',
      details: error.message
    });
  }
});

async function testEndpoint() {
  console.log('🧪 PRUEBAS DEL ENDPOINT AVAILABLE-SIZES CORREGIDO');
  console.log('='.repeat(50));
  
  const client = await pool.connect();
  
  try {
    // 1. Probar consulta directa
    console.log('1. 🔍 Probando consulta directa:');
    
    const directQuery = await client.query(`
      SELECT DISTINCT talla, quantity, code, name
      FROM supply_inventory 
      WHERE LOWER(name) = LOWER($1)
        AND category = $2 
        AND talla IS NOT NULL 
        AND quantity > 0
      ORDER BY 
        CASE talla
          WHEN '28' THEN 1
          WHEN '30' THEN 2  
          WHEN '32' THEN 3
          WHEN '34' THEN 4
          WHEN '36' THEN 5
          WHEN '38' THEN 6
          WHEN '40' THEN 7
          WHEN '42' THEN 8
          WHEN '44' THEN 9
          ELSE 10
        END,
        talla::INTEGER
    `, ['Pantalón', 'uniforme']);
    
    console.log(`   📊 Tallas encontradas: ${directQuery.rows.length}`);
    directQuery.rows.forEach(row => {
      console.log(`   ✅ Talla ${row.talla}: ${row.quantity} unidades (${row.code})`);
    });
    
    // 2. Simular llamada del frontend
    console.log('\n2. 🌐 Simulando llamada del frontend:');
    console.log('   URL: /api/supply-inventory/available-sizes/Pantalón/uniforme');
    
    // Mock request y response
    const mockReq = {
      params: {
        element: 'Pantalón',
        category: 'uniforme'
      }
    };
    
    const mockRes = {
      json: (data) => {
        console.log('   📤 Respuesta del endpoint:');
        console.log('   {');
        console.log(`     element: "${data.element}",`);
        console.log(`     category: "${data.category}",`);
        console.log(`     available_sizes: [${data.available_sizes.map(s => `"${s}"`).join(', ')}],`);
        console.log(`     stock_details: [`);
        data.stock_details.forEach(detail => {
          console.log(`       { talla: "${detail.talla}", quantity: ${detail.quantity}, code: "${detail.code}" },`);
        });
        console.log(`     ]`);
        console.log('   }');
        
        return data;
      }
    };
    
    // Ejecutar el endpoint manualmente
    await app._router.stack[0].route.stack[0].handle(mockReq, mockRes);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
  }
}

// Ejecutar pruebas
testEndpoint()
  .then(() => {
    console.log('\n✅ Pruebas completadas');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error general:', error);
    process.exit(1);
  });