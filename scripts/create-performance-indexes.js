const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createIndexes() {
  const client = await pool.connect();
  
  try {
    console.log('📊 Creando índices de performance...\n');

    const indexes = [
      // Entregas
      { name: 'idx_entrega_dotacion_fecha', sql: 'CREATE INDEX IF NOT EXISTS idx_entrega_dotacion_fecha ON entrega_dotacion("fechaEntrega")' },
      { name: 'idx_entrega_dotacion_cedula', sql: 'CREATE INDEX IF NOT EXISTS idx_entrega_dotacion_cedula ON entrega_dotacion("cedulaAsociado")' },
      
      // Usuarios
      { name: 'idx_users_cedula', sql: 'CREATE INDEX IF NOT EXISTS idx_users_cedula ON users(cedula)' },
      { name: 'idx_users_zona', sql: 'CREATE INDEX IF NOT EXISTS idx_users_zona ON users(zona)' },
      { name: 'idx_users_nombre', sql: 'CREATE INDEX IF NOT EXISTS idx_users_nombre ON users(nombre)' },
      
      // Inventario
      { name: 'idx_inventory_code', sql: 'CREATE INDEX IF NOT EXISTS idx_inventory_code ON supply_inventory(code)' },
      { name: 'idx_inventory_category', sql: 'CREATE INDEX IF NOT EXISTS idx_inventory_category ON supply_inventory(category)' },
      { name: 'idx_inventory_name', sql: 'CREATE INDEX IF NOT EXISTS idx_inventory_name ON supply_inventory(name)' },
      
      // Movimientos
      { name: 'idx_inventory_movements_date', sql: 'CREATE INDEX IF NOT EXISTS idx_inventory_movements_date ON inventory_movements(movement_date)' },
      { name: 'idx_inventory_movements_type', sql: 'CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(movement_type)' },
      
      // Asociados retirados
      { name: 'idx_retired_associates_cedula', sql: 'CREATE INDEX IF NOT EXISTS idx_retired_associates_cedula ON retired_associates(cedula)' },
      
      // Autenticación
      { name: 'idx_auth_users_email', sql: 'CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email)' },
      { name: 'idx_auth_users_username', sql: 'CREATE INDEX IF NOT EXISTS idx_auth_users_username ON auth_users(username)' },
    ];

    let created = 0;
    let exists = 0;

    for (const index of indexes) {
      try {
        await client.query(index.sql);
        console.log(`✅ ${index.name}`);
        created++;
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⏭️  ${index.name} (ya existe)`);
          exists++;
        } else {
          console.log(`❌ ${index.name}: ${error.message}`);
        }
      }
    }

    console.log(`\n📈 Resumen:`);
    console.log(`   Creados: ${created}`);
    console.log(`   Existentes: ${exists}`);
    console.log(`   Total: ${indexes.length}`);

    // Analizar tablas para actualizar estadísticas
    console.log('\n📊 Actualizando estadísticas de la base de datos...');
    await client.query('ANALYZE');
    console.log('✅ Estadísticas actualizadas');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createIndexes()
  .then(() => {
    console.log('\n✅ Proceso completado exitosamente');
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });
