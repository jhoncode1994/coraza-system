const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function findHistoryTables() {
  const client = await pool.connect();
  
  try {
    console.log('=== BUSCANDO TODAS LAS TABLAS DE HISTORIAL ===\n');
    
    // 1. Buscar todas las tablas
    console.log('1. Todas las tablas disponibles:');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.table(tables.rows);
    
    // 2. Buscar tablas que contengan "delivery", "dotacion", "supply", "entrega", "history"
    console.log('\n2. Buscando tablas relacionadas con historial:');
    const keywords = ['delivery', 'dotacion', 'supply', 'entrega', 'history', 'inventori'];
    
    for (const keyword of keywords) {
      const relatedTables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name ILIKE '%${keyword}%'
      `);
      
      if (relatedTables.rows.length > 0) {
        console.log(`\nTablas con "${keyword}":`);
        console.table(relatedTables.rows);
        
        // Ver contenido de cada tabla
        for (const table of relatedTables.rows) {
          try {
            const content = await client.query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
            console.log(`  ${table.table_name}: ${content.rows[0].count} registros`);
            
            if (content.rows[0].count > 0 && content.rows[0].count < 20) {
              const sample = await client.query(`SELECT * FROM ${table.table_name} LIMIT 3`);
              console.log(`  Muestra de ${table.table_name}:`);
              console.table(sample.rows);
            }
          } catch (error) {
            console.log(`  Error accediendo a ${table.table_name}: ${error.message}`);
          }
        }
      }
    }
    
    // 3. Verificar qué tablas tienen un campo userId o user_id
    console.log('\n3. Tablas con campos de usuario:');
    const userTables = await client.query(`
      SELECT table_name, column_name
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND (column_name ILIKE '%user%' OR column_name ILIKE '%asociado%')
      ORDER BY table_name, column_name
    `);
    console.table(userTables.rows);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

findHistoryTables();
