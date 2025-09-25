const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_expMyzc2PY1o@ep-solitary-scene-adpyw2k4-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
});

async function showDatabaseTables() {
  try {
    await client.connect();
    console.log('🔍 REVISANDO ESTRUCTURA DE BASE DE DATOS...\n');

    // Obtener todas las tablas
    const tablesResult = await client.query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('📋 TABLAS ENCONTRADAS:');
    console.log('════════════════════════════════════');

    for (const table of tablesResult.rows) {
      // Contar registros en cada tabla
      const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
      const recordCount = countResult.rows[0].count;
      
      console.log(`📊 ${table.table_name.toUpperCase()}`);
      console.log(`   - Columnas: ${table.column_count}`);
      console.log(`   - Registros: ${recordCount}`);
      console.log('');
    }

    console.log('════════════════════════════════════\n');
    
    // Mostrar algunas muestras de datos importantes
    console.log('🎯 DATOS IMPORTANTES A CONSIDERAR:');
    console.log('');

    // Mostrar usuarios
    try {
      const usersResult = await client.query('SELECT COUNT(*) as count FROM users LIMIT 1');
      console.log(`👥 USUARIOS: ${usersResult.rows[0].count} registros`);
    } catch (e) {
      console.log(`👥 USUARIOS: tabla no existe`);
    }

    // Mostrar inventario
    try {
      const inventoryResult = await client.query('SELECT COUNT(*) as count FROM supply_inventory LIMIT 1');
      console.log(`📦 INVENTARIO: ${inventoryResult.rows[0].count} registros`);
    } catch (e) {
      console.log(`📦 INVENTARIO: tabla no existe`);
    }

    // Mostrar entregas
    try {
      const deliveriesResult = await client.query('SELECT COUNT(*) as count FROM entrega_dotacion LIMIT 1');
      console.log(`🚚 ENTREGAS: ${deliveriesResult.rows[0].count} registros`);
    } catch (e) {
      console.log(`🚚 ENTREGAS: tabla no existe`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

showDatabaseTables();