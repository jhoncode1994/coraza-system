// Script para crear un usuario administrador con contraseña conocida
const { Client } = require('pg');
const crypto = require('crypto');

// Configuración de conexión (ajusta según tu entorno)
const client = new Client({
  host: 'ep-solitary-scene-adpyw2k4-pooler.c-2.us-east-1.aws.neon.tech',
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_expMyzc2PY1o',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

const email = 'admin2@coraza-dotacion.com';
const password = 'Coraza2025*';
const username = 'admin2';
const role = 'admin';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function createAdminUser() {
  await client.connect();
  const passwordHash = hashPassword(password);
  try {
    await client.query(
      'INSERT INTO admin_users (username, email, password_hash, role, is_active) VALUES ($1, $2, $3, $4, $5)',
      [username, email, passwordHash, role, true]
    );
    console.log('✅ Usuario administrador creado:');
    console.log('Correo:', email);
    console.log('Contraseña:', password);
  } catch (err) {
    console.error('❌ Error creando usuario:', err);
  } finally {
    await client.end();
  }
}

createAdminUser();
