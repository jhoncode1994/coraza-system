// Script para verificar usuarios de autenticación
require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkAuthUsers() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔐 VERIFICACIÓN DE USUARIOS DE AUTENTICACIÓN\n');
    console.log('═'.repeat(60));
    
    // 1. Verificar auth_users
    console.log('\n📋 Tabla: auth_users');
    const authUsers = await client.query('SELECT id, username, email, role, is_active FROM auth_users');
    console.table(authUsers.rows);
    
    // 2. Verificar admin_users
    console.log('\n📋 Tabla: admin_users');
    const adminUsers = await client.query('SELECT id, username, email, role, is_active FROM admin_users');
    console.table(adminUsers.rows);
    
    // 3. Verificar user_permissions
    console.log('\n📋 Tabla: user_permissions');
    const permissions = await client.query('SELECT * FROM user_permissions');
    console.table(permissions.rows);
    
    console.log('\n═'.repeat(60));
    console.log('✅ Verificación completada\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAuthUsers();
