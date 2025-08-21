const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || 'coraza_system',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'admin',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Iniciando migraciones de base de datos...');
    
    // Create inventory_movements table
    console.log('📋 Creando tabla inventory_movements...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_movements (
        id SERIAL PRIMARY KEY,
        supply_id INTEGER REFERENCES supply_inventory(id),
        movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('entrada', 'salida')),
        quantity INTEGER NOT NULL,
        reason VARCHAR(100) NOT NULL,
        notes TEXT,
        previous_quantity INTEGER NOT NULL,
        new_quantity INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla inventory_movements creada exitosamente');
    
    // Verify table creation
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'inventory_movements'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ Verificación: tabla inventory_movements existe');
    } else {
      console.log('❌ Error: tabla inventory_movements no existe después de la creación');
    }
    
    // Check if retired_associates table exists
    console.log('📋 Verificando tabla retired_associates...');
    const retiredTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'retired_associates'
      );
    `);
    
    if (!retiredTableCheck.rows[0].exists) {
      console.log('📋 Creando tabla retired_associates...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS retired_associates (
          id SERIAL PRIMARY KEY,
          original_id INTEGER NOT NULL,
          nombre VARCHAR(100) NOT NULL,
          apellido VARCHAR(100) NOT NULL,
          cedula VARCHAR(20) NOT NULL,
          zona INTEGER NOT NULL,
          fecha_ingreso DATE,
          retirement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          retirement_reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Tabla retired_associates creada exitosamente');
    } else {
      console.log('✅ Tabla retired_associates ya existe');
    }
    
    // Check if retired_associate_supply_history table exists
    console.log('📋 Verificando tabla retired_associate_supply_history...');
    const retiredHistoryTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'retired_associate_supply_history'
      );
    `);
    
    if (!retiredHistoryTableCheck.rows[0].exists) {
      console.log('📋 Creando tabla retired_associate_supply_history...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS retired_associate_supply_history (
          id SERIAL PRIMARY KEY,
          retired_associate_id INTEGER REFERENCES retired_associates(id),
          supply_code VARCHAR(50),
          supply_name VARCHAR(200),
          categoria VARCHAR(50),
          talla VARCHAR(10),
          cantidad INTEGER,
          fecha_entrega DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Tabla retired_associate_supply_history creada exitosamente');
    } else {
      console.log('✅ Tabla retired_associate_supply_history ya existe');
    }
    
    console.log('🎉 Todas las migraciones completadas exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante las migraciones:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations
runMigrations().catch(console.error);
