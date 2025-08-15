const { Pool } = require('pg');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  const pool = new Pool({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
    port: 5432
  });

  try {
    console.log('🔌 Connecting to database...');
    const client = await pool.connect();
    
    console.log('📋 Reading schema file...');
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'database-schema.sql'), 'utf8');
    
    console.log('🏗️  Creating tables and inserting data...');
    await client.query(schemaSQL);
    
    console.log('✅ Database initialized successfully!');
    
    // Test the connection
    const result = await client.query('SELECT COUNT(*) FROM users');
    console.log(`👥 Users in database: ${result.rows[0].count}`);
    
    const supplyResult = await client.query('SELECT COUNT(*) FROM supply_inventory');
    console.log(`📦 Supply items in database: ${supplyResult.rows[0].count}`);
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();
