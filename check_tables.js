const { Pool } = require('pg');

const pool = new Pool({
  host: 'ep-solitary-scene-adpyw2k4-pooler.c-2.us-east-1.aws.neon.tech',
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_expMyzc2PY1o',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

async function checkTables() {
  try {
    console.log('🔍 Conectando a la base de datos...');
    
    // Listar todas las tablas
    const tablesResult = await pool.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n📋 TABLAS ENCONTRADAS:');
    console.log('=====================');
    tablesResult.rows.forEach(table => {
      console.log(`- ${table.table_name} (${table.table_type})`);
    });
    
    // Para cada tabla, mostrar su estructura
    console.log('\n📊 ESTRUCTURA DE CADA TABLA:');
    console.log('============================');
    
    for (const table of tablesResult.rows) {
      if (table.table_type === 'BASE TABLE') {
        console.log(`\n🔍 Tabla: ${table.table_name}`);
        console.log('----------------------------');
        
        const columnsResult = await pool.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position;
        `, [table.table_name]);
        
        columnsResult.rows.forEach(col => {
          console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
        });
        
        // Contar registros
        const countResult = await pool.query(`SELECT COUNT(*) FROM "${table.table_name}"`);
        console.log(`  📊 Registros: ${countResult.rows[0].count}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTables();
