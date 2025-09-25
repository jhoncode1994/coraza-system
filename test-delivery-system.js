const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testDeliverySystem() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Probando sistema de entregas después de las correcciones...\n');
    
    // 1. Verificar tallas disponibles para pantalones
    console.log('📋 Verificando tallas disponibles para pantalones:');
    const availableSizes = await client.query(`
      SELECT id, code, talla, quantity
      FROM supply_inventory 
      WHERE code LIKE 'PAN001%' AND talla IS NOT NULL AND quantity > 0
      ORDER BY talla
    `);
    
    console.log('Tallas disponibles:');
    availableSizes.rows.forEach(row => {
      console.log(`  ✅ Talla ${row.talla}: ${row.quantity} unidades (${row.code})`);
    });
    
    if (availableSizes.rows.length === 0) {
      console.log('  ❌ No hay tallas con stock disponible');
      return;
    }
    
    // 2. Simular una entrega
    const testSize = availableSizes.rows[0].talla; // Usar la primera talla disponible
    const testQuantity = Math.min(5, availableSizes.rows[0].quantity); // Entregar máximo 5 o el stock disponible
    
    console.log(`\n🚚 Simulando entrega de ${testQuantity} pantalones talla ${testSize}...`);
    
    // Iniciar transacción para la entrega
    await client.query('BEGIN');
    
    try {
      // Verificar stock antes de la entrega
      const stockCheck = await client.query(`
        SELECT id, quantity
        FROM supply_inventory
        WHERE code = $1
      `, [`PAN001-${testSize}`]);
      
      const currentStock = stockCheck.rows[0].quantity;
      console.log(`Stock actual: ${currentStock}`);
      
      if (currentStock < testQuantity) {
        throw new Error(`Stock insuficiente. Disponible: ${currentStock}, Solicitado: ${testQuantity}`);
      }
      
      // Actualizar inventario
      const newStock = currentStock - testQuantity;
      await client.query(`
        UPDATE supply_inventory 
        SET quantity = $1, last_update = NOW()
        WHERE code = $2
      `, [newStock, `PAN001-${testSize}`]);
      
      // Registrar movimiento (usando la tabla corregida)
      await client.query(`
        INSERT INTO inventory_movements (
          supply_id, 
          movement_type, 
          quantity, 
          reason,
          previous_quantity,
          new_quantity,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        stockCheck.rows[0].id, // Usar el ID del elemento
        'salida', // En minúsculas según el constraint
        testQuantity,
        'Entrega de dotación - Prueba del sistema',
        currentStock,
        newStock
      ]);
      
      await client.query('COMMIT');
      
      console.log(`✅ Entrega exitosa!`);
      console.log(`   Talla entregada: ${testSize}`);
      console.log(`   Cantidad entregada: ${testQuantity}`);
      console.log(`   Stock restante: ${newStock}`);
      
      // 3. Verificar estado después de la entrega
      console.log('\n📊 Estado del inventario después de la entrega:');
      const finalStock = await client.query(`
        SELECT code, talla, quantity
        FROM supply_inventory 
        WHERE code LIKE 'PAN001%' AND talla IS NOT NULL
        ORDER BY talla
      `);
      
      finalStock.rows.forEach(row => {
        const status = row.quantity > 0 ? '✅' : '⚠️';
        console.log(`  ${status} ${row.code} (Talla ${row.talla}): ${row.quantity} unidades`);
      });
      
      // 4. Verificar registro de movimientos
      console.log('\n📝 Últimos movimientos registrados:');
      const movements = await client.query(`
        SELECT * FROM inventory_movements
        ORDER BY created_at DESC
        LIMIT 3
      `);
      
      movements.rows.forEach(mov => {
        console.log(`  • ${mov.movement_type}: ${mov.quantity} unidades - ${mov.reason} (${mov.created_at})`);
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error durante la entrega:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  } finally {
    client.release();
  }
}

async function testSizeEndpoint() {
  console.log('\n🌐 Probando endpoint de tallas disponibles...\n');
  
  try {
    // Simular llamada al endpoint que creamos en el servidor
    const fetch = require('node-fetch');
    const response = await fetch('http://localhost:3000/api/supply-inventory/available-sizes/PAN001/uniforme');
    
    if (response.ok) {
      const sizes = await response.json();
      console.log('✅ Endpoint funcionando correctamente');
      console.log('Respuesta del API:', JSON.stringify(sizes, null, 2));
      
      if (sizes.available_sizes && sizes.available_sizes.length > 0) {
        console.log('✅ Tallas encontradas:', sizes.available_sizes.join(', '));
      } else {
        console.log('⚠️  No se encontraron tallas disponibles en la respuesta del API');
      }
    } else {
      console.log('❌ Error en el endpoint:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('ℹ️  Servidor no está ejecutándose o endpoint no disponible:', error.message);
    console.log('   (Para probar el endpoint, inicia el servidor con: npm run start)');
  }
}

async function main() {
  try {
    await testDeliverySystem();
    await testSizeEndpoint();
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = { testDeliverySystem };