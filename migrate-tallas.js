const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrateTallas() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Iniciando migración de tallas...');
    
    // 1. Agregar columna talla a supply_inventory
    await client.query(`
      ALTER TABLE supply_inventory 
      ADD COLUMN IF NOT EXISTS talla VARCHAR(10)
    `);
    console.log('✅ Columna talla agregada a supply_inventory');
    
    // 2. Agregar columna talla a entrega_dotacion
    await client.query(`
      ALTER TABLE entrega_dotacion 
      ADD COLUMN IF NOT EXISTS talla VARCHAR(10)
    `);
    console.log('✅ Columna talla agregada a entrega_dotacion');
    
    // 3. Crear tabla inventory_movements si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_movements (
        id SERIAL PRIMARY KEY,
        tipo VARCHAR(100) NOT NULL,
        talla VARCHAR(10),
        cantidad INTEGER NOT NULL,
        tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('ingreso', 'salida')),
        fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        observaciones TEXT,
        usuario_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla inventory_movements creada');
    
    // 4. Crear índices para optimización
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_supply_inventory_talla 
      ON supply_inventory(talla)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_supply_inventory_category_talla 
      ON supply_inventory(category, talla)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_entrega_dotacion_talla 
      ON entrega_dotacion(talla)
    `);
    console.log('✅ Índices creados');
    
    console.log('🎉 Migración de tallas completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error en migración:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateTallas();