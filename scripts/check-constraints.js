const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkConstraints() {
  const client = await pool.connect();
  
  try {
    // Ver todas las constraints de user_permissions
    const constraints = await client.query(`
      SELECT 
        con.conname AS constraint_name,
        con.contype AS constraint_type,
        rel.relname AS table_name,
        att.attname AS column_name,
        frel.relname AS foreign_table
      FROM pg_constraint con
      JOIN pg_class rel ON con.conrelid = rel.oid
      LEFT JOIN pg_attribute att ON att.attnum = ANY(con.conkey) AND att.attrelid = con.conrelid
      LEFT JOIN pg_class frel ON con.confrelid = frel.oid
      WHERE rel.relname = 'user_permissions'
    `);
    
    console.log('📋 Constraints de user_permissions:\n');
    constraints.rows.forEach(row => {
      console.log(row);
    });

    // Ver datos existentes
    const existing = await client.query('SELECT * FROM user_permissions');
    console.log('\n📊 Permisos existentes:', existing.rows.length);
    existing.rows.forEach(row => {
      console.log(`   - User ID: ${row.user_id}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkConstraints();
