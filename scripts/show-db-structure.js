// Script para ver la estructura exacta de las tablas en producción
require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function showTableStructures() {
  const client = await pool.connect();
  
  try {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 ESTRUCTURA DE TABLAS EN PRODUCCIÓN');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const tables = ['users', 'auth_users', 'admin_users', 'entrega_dotacion', 
                    'inventory_movements', 'supply_inventory', 'retired_associates'];
    
    for (const tableName of tables) {
      console.log(`\n📁 Tabla: ${tableName}`);
      console.log('─'.repeat(60));
      
      try {
        const columns = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position
        `, [tableName]);
        
        if (columns.rows.length === 0) {
          console.log('   ⚠️ Tabla no encontrada');
        } else {
          columns.rows.forEach(col => {
            const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
            const defaultVal = col.column_default ? ` DEFAULT ${col.column_default.substring(0, 30)}` : '';
            console.log(`   • ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${nullable}${defaultVal}`);
          });
        }
      } catch (e) {
        console.log(`   ❌ Error: ${e.message}`);
      }
    }
    
    // Mostrar algunos registros de ejemplo
    console.log('\n\n═══════════════════════════════════════════════════════════════');
    console.log('📋 DATOS DE EJEMPLO');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    // Usuarios auth_users
    console.log('👥 auth_users:');
    const authUsers = await client.query('SELECT * FROM auth_users LIMIT 5');
    console.table(authUsers.rows);
    
    // Usuarios (asociados)
    console.log('\n👷 users (primeros 5):');
    const users = await client.query('SELECT id, nombre, cedula, area, cargo, estado FROM users ORDER BY id DESC LIMIT 5');
    console.table(users.rows);
    
    // Inventory movements
    console.log('\n📦 inventory_movements (últimos 5):');
    const movements = await client.query('SELECT * FROM inventory_movements ORDER BY created_at DESC LIMIT 5');
    console.table(movements.rows);
    
    // Supply inventory
    console.log('\n🏪 supply_inventory (primeros 10):');
    const inventory = await client.query('SELECT * FROM supply_inventory ORDER BY id LIMIT 10');
    console.table(inventory.rows);
    
    // Entregas dotación
    console.log('\n🎁 entrega_dotacion (últimas 5):');
    const entregas = await client.query('SELECT * FROM entrega_dotacion ORDER BY created_at DESC LIMIT 5');
    console.table(entregas.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

showTableStructures();
