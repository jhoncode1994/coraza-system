// setup-auth-passwords.js - Script para generar hashes de contraseñas
const bcrypt = require('bcrypt');

async function generatePasswordHashes() {
  console.log('🔐 Generando hashes de contraseñas...\n');
  
  try {
    // Hash para admin123
    const adminHash = await bcrypt.hash('admin123', 10);
    console.log('Admin password hash (admin123):');
    console.log(adminHash);
    console.log('');
    
    // Hash para entrega123
    const entregadorHash = await bcrypt.hash('entrega123', 10);
    console.log('Entregador password hash (entrega123):');
    console.log(entregadorHash);
    console.log('');
    
    console.log('📋 SQL actualizado para la base de datos:');
    console.log('');
    console.log(`-- Usuario administrador`);
    console.log(`UPDATE auth_users SET password_hash = '${adminHash}' WHERE email = 'admin@coraza.com';`);
    console.log('');
    console.log(`-- Usuario entregador`);
    console.log(`UPDATE auth_users SET password_hash = '${entregadorHash}' WHERE email = 'entregador@coraza.com';`);
    console.log('');
    console.log('✅ Copia estos comandos SQL y ejecútalos en tu base de datos Neon');
    
  } catch (error) {
    console.error('❌ Error generando hashes:', error);
  }
}

// Ejecutar solo si se ejecuta directamente
if (require.main === module) {
  generatePasswordHashes();
}

module.exports = { generatePasswordHashes };