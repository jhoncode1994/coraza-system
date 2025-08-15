const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  username: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT || 5432,
  ssl: { rejectUnauthorized: false }
});

// Elementos correctos de dotación
const correctSupplyItems = [
  { code: 'CAM001', name: 'Camisa', category: 'uniforme', quantity: 50, minimum_quantity: 10 },
  { code: 'COR001', name: 'Corbata', category: 'accesorios', quantity: 30, minimum_quantity: 5 },
  { code: 'CHQ001', name: 'Chaqueta', category: 'uniforme', quantity: 40, minimum_quantity: 8 },
  { code: 'PAN001', name: 'Pantalón', category: 'uniforme', quantity: 45, minimum_quantity: 10 },
  { code: 'CIN001', name: 'Cinturón', category: 'accesorios', quantity: 35, minimum_quantity: 7 },
  { code: 'KEP001', name: 'Kepis', category: 'accesorios', quantity: 25, minimum_quantity: 5 },
  { code: 'BOT001', name: 'Botas', category: 'calzado', quantity: 60, minimum_quantity: 12 },
  { code: 'OVE001', name: 'Overol', category: 'uniforme', quantity: 20, minimum_quantity: 5 },
  { code: 'REA001', name: 'Reata', category: 'accesorios', quantity: 15, minimum_quantity: 3 },
  { code: 'GOL001', name: 'Goleana', category: 'accesorios', quantity: 10, minimum_quantity: 2 },
  { code: 'MOÑ001', name: 'Moña', category: 'accesorios', quantity: 25, minimum_quantity: 5 }
];

async function updateSupplyInventory() {
  try {
    console.log('🔄 Conectando a la base de datos...');
    const client = await pool.connect();
    
    // Limpiar tabla actual
    console.log('🗑️  Limpiando tabla supply_inventory...');
    await client.query('DELETE FROM supply_inventory');
    
    // Reiniciar secuencia de ID
    await client.query('ALTER SEQUENCE supply_inventory_id_seq RESTART WITH 1');
    
    // Insertar elementos correctos
    console.log('📦 Insertando elementos correctos de dotación...');
    
    for (let i = 0; i < correctSupplyItems.length; i++) {
      const item = correctSupplyItems[i];
      
      await client.query(`
        INSERT INTO supply_inventory (
          code, name, category, quantity, minimum_quantity, 
          unit_price, description, created_at, last_update
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        item.code,
        item.name,
        item.category,
        item.quantity,
        item.minimum_quantity,
        50.00, // Precio unitario por defecto
        `${item.name} para dotación de personal`
      ]);
      
      console.log(`✅ Insertado: ${item.name} (${item.code})`);
    }
    
    // Verificar inserción
    console.log('\n📋 Verificando elementos insertados:');
    const result = await client.query('SELECT id, code, name, category, quantity FROM supply_inventory ORDER BY id');
    console.table(result.rows);
    
    console.log(`\n🎉 ¡Actualización completada! ${correctSupplyItems.length} elementos de dotación insertados correctamente.`);
    
    client.release();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error al actualizar supply inventory:', error);
    process.exit(1);
  }
}

updateSupplyInventory();
