const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de la base de datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Iniciando migración: Agregar columnas de reversión...\n');
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'database', 'add-reversion-columns.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Ejecutar la migración
    await client.query(sql);
    
    console.log('✅ Migración completada exitosamente\n');
    
    // Verificar las columnas
    const result = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'entrega_dotacion'
      AND column_name IN ('estado', 'revertida_fecha', 'revertida_por', 'motivo_reversion')
      ORDER BY column_name;
    `);
    
    console.log('📋 Columnas agregadas:');
    console.log('┌─────────────────────┬──────────────────────┬─────────────────────┐');
    console.log('│ Columna             │ Tipo                 │ Default             │');
    console.log('├─────────────────────┼──────────────────────┼─────────────────────┤');
    
    result.rows.forEach(row => {
      const col = row.column_name.padEnd(19);
      const type = row.data_type.padEnd(20);
      const def = (row.column_default || 'NULL').padEnd(19);
      console.log(`│ ${col} │ ${type} │ ${def} │`);
    });
    
    console.log('└─────────────────────┴──────────────────────┴─────────────────────┘\n');
    
    // Contar entregas actualizadas
    const countResult = await client.query(`
      SELECT 
        COUNT(*) FILTER (WHERE estado = 'activa') as activas,
        COUNT(*) FILTER (WHERE estado = 'revertida') as revertidas,
        COUNT(*) as total
      FROM entrega_dotacion;
    `);
    
    const counts = countResult.rows[0];
    console.log('📊 Estado de las entregas:');
    console.log(`   Activas: ${counts.activas}`);
    console.log(`   Revertidas: ${counts.revertidas}`);
    console.log(`   Total: ${counts.total}\n`);
    
    console.log('🎉 Migración completada correctamente!');
    
  } catch (error) {
    console.error('❌ Error ejecutando migración:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar migración
runMigration().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
