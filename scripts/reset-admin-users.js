// Script para eliminar todos los usuarios admin y crear uno nuevo
const { Client } = require('pg');
const crypto = require('crypto');

const client = new Client({
  host: 'ep-solitary-scene-adpyw2k4-pooler.c-2.us-east-1.aws.neon.tech',
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_expMyzc2PY1o',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

const username = 'coraza';
const email = 'jfzl1994@gmial.com';
const password = 'Coraza2025*';
const role = 'admin';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function resetAdminUsers() {
  await client.connect();
  try {
    await client.query('DELETE FROM admin_users');
    console.log('✅ Todos los usuarios admin eliminados');
    const passwordHash = hashPassword(password);
    await client.query(
      'INSERT INTO admin_users (username, email, password_hash, role, is_active) VALUES ($1, $2, $3, $4, $5)',
      [username, email, passwordHash, role, true]
    );
    console.log('✅ Usuario administrador creado:');
    console.log('Usuario:', username);
    console.log('Correo:', email);
    console.log('Contraseña:', password);
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await client.end();
  }
}

resetAdminUsers();
