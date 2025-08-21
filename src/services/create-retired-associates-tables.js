// create-retired-associates-tables.js - Script simple para crear las tablas
require('dotenv').config();

const { Pool } = require('pg');

// Usar directamente la URL de conexión
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function createTables() {
  console.log('🚀 Creando tablas de asociados retirados...');
  console.log('URL:', process.env.DATABASE_URL ? 'Configurada' : 'No configurada');
  
  try {
    // Crear tabla de asociados retirados
    await pool.query(`
      CREATE TABLE IF NOT EXISTS retired_associates (
        id SERIAL PRIMARY KEY,
        associate_id INTEGER NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        apellido VARCHAR(100) NOT NULL,
        cedula VARCHAR(20) UNIQUE NOT NULL,
        zona INTEGER NOT NULL,
        telefono VARCHAR(20),
        email VARCHAR(100),
        retired_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        retired_reason TEXT,
        retired_by INTEGER,
        original_creation_date TIMESTAMP
      );
    `);
    console.log('✅ Tabla retired_associates creada');

    // Crear tabla de historial
    await pool.query(`
      CREATE TABLE IF NOT EXISTS retired_associate_supply_history (
        id SERIAL PRIMARY KEY,
        retired_associate_id INTEGER NOT NULL,
        original_delivery_id INTEGER,
        elemento VARCHAR(200) NOT NULL,
        cantidad INTEGER NOT NULL,
        delivered_at TIMESTAMP,
        signature_data TEXT,
        observaciones TEXT,
        retired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (retired_associate_id) REFERENCES retired_associates(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ Tabla retired_associate_supply_history creada');

    // Crear índices
    await pool.query('CREATE INDEX IF NOT EXISTS idx_retired_associates_cedula ON retired_associates(cedula);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_retired_associates_zone ON retired_associates(zona);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_retired_associates_date ON retired_associates(retired_date);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_retired_history_associate ON retired_associate_supply_history(retired_associate_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_retired_history_date ON retired_associate_supply_history(delivered_at);');
    console.log('✅ Índices creados');

    // Verificar
    const result1 = await pool.query('SELECT COUNT(*) as count FROM retired_associates;');
    const result2 = await pool.query('SELECT COUNT(*) as count FROM retired_associate_supply_history;');
    
    console.log('📊 Verificación:');
    console.log(`   - retired_associates: ${result1.rows[0].count} registros`);
    console.log(`   - retired_associate_supply_history: ${result2.rows[0].count} registros`);
    
    console.log('🎉 ¡Tablas creadas exitosamente!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

createTables();
