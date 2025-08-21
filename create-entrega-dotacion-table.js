// create-entrega-dotacion-table.js - Crear la tabla entrega_dotacion
require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function createEntregaDotacionTable() {
  console.log('🚀 Creando tabla entrega_dotacion...\n');
  
  try {
    // Crear la tabla entrega_dotacion
    await pool.query(`
      CREATE TABLE IF NOT EXISTS entrega_dotacion (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        elemento VARCHAR(200) NOT NULL,
        cantidad INTEGER NOT NULL DEFAULT 1,
        "fechaEntrega" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "firmaDigital" TEXT,
        observaciones TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ Tabla entrega_dotacion creada exitosamente');

    // Crear índices para mejorar rendimiento
    await pool.query('CREATE INDEX IF NOT EXISTS idx_entrega_dotacion_user ON entrega_dotacion("userId");');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_entrega_dotacion_fecha ON entrega_dotacion("fechaEntrega");');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_entrega_dotacion_elemento ON entrega_dotacion(elemento);');
    console.log('✅ Índices creados');

    // Verificar la estructura creada
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'entrega_dotacion' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Estructura de la tabla creada:');
    columnsResult.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? '* REQUERIDO' : ''}`);
    });
    
    // Insertar algunos datos de prueba (opcional)
    console.log('\n🧪 ¿Quieres insertar datos de prueba? (comentar/descomentar)');
    /*
    await pool.query(`
      INSERT INTO entrega_dotacion ("userId", elemento, cantidad, observaciones) VALUES
      (1, 'Camisa Polo Azul Talla L', 1, 'Entrega inicial'),
      (1, 'Pantalón Jean Talla 32', 1, 'Entrega inicial'),
      (2, 'Camisa Polo Azul Talla M', 1, 'Primera entrega del año');
    `);
    console.log('✅ Datos de prueba insertados');
    */
    
    const countResult = await pool.query('SELECT COUNT(*) as count FROM entrega_dotacion;');
    console.log(`\n📊 Registros en la tabla: ${countResult.rows[0].count}`);
    
    console.log('\n🎉 ¡Tabla entrega_dotacion lista para usar!');
    console.log('\n🔄 FLUJO COMPLETO AHORA:');
    console.log('1. ASOCIADOS ACTIVOS (users) ← reciben entregas');
    console.log('2. ENTREGAS REGISTRADAS (entrega_dotacion) ← historial activo');
    console.log('3. AL RETIRARSE → se mueve a (retired_associates + retired_associate_supply_history)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

createEntregaDotacionTable();
