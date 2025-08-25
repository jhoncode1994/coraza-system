const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Configuración de la base de datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initializeAdminUsers() {
  try {
    console.log('🔐 Inicializando tabla de usuarios administrativos...');
    const client = await pool.connect();
    
    // Crear tabla admin_users
    console.log('📋 Creando tabla admin_users...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'moderator')),
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        failed_login_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla admin_users creada exitosamente');
    
    // Verificar si ya existe el usuario admin por defecto
    const existingAdmin = await client.query(
      'SELECT id FROM admin_users WHERE username = $1',
      ['admin']
    );
    
    if (existingAdmin.rows.length === 0) {
      console.log('👤 Creando usuario administrador por defecto...');
      
      // Hash de la contraseña por defecto
      const defaultPassword = 'coraza2025';
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);
      
      // Insertar usuario admin por defecto
      await client.query(`
        INSERT INTO admin_users (username, email, password_hash, role, is_active)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        'admin',
        'admin@coraza-dotacion.com',
        passwordHash,
        'super_admin',
        true
      ]);
      
      console.log('✅ Usuario administrador creado exitosamente');
      console.log('📋 Credenciales por defecto:');
      console.log('   Usuario: admin');
      console.log('   Contraseña: coraza2025');
      console.log('   ⚠️  IMPORTANTE: Cambie estas credenciales después del primer login');
    } else {
      console.log('👤 Usuario administrador ya existe, omitiendo creación...');
    }
    
    // Crear índices para mejorar rendimiento
    console.log('📊 Creando índices...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
      CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
      CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);
    `);
    console.log('✅ Índices creados exitosamente');
    
    client.release();
    console.log('🎉 Inicialización de usuarios administrativos completada');
    
  } catch (error) {
    console.error('❌ Error inicializando usuarios administrativos:', error);
    throw error;
  }
}

// Función para crear un nuevo usuario administrativo
async function createAdminUser(userData) {
  try {
    const client = await pool.connect();
    const { username, email, password, role = 'admin' } = userData;
    
    // Hash de la contraseña
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    const result = await client.query(`
      INSERT INTO admin_users (username, email, password_hash, role, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, role, is_active, created_at
    `, [username, email, passwordHash, role, true]);
    
    client.release();
    return result.rows[0];
  } catch (error) {
    console.error('Error creando usuario administrativo:', error);
    throw error;
  }
}

// Función para validar credenciales
async function validateCredentials(username, password) {
  try {
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT id, username, email, password_hash, role, is_active, 
             failed_login_attempts, locked_until, last_login
      FROM admin_users 
      WHERE username = $1 AND is_active = true
    `, [username]);
    
    if (result.rows.length === 0) {
      client.release();
      return { success: false, error: 'Usuario no encontrado o inactivo' };
    }
    
    const user = result.rows[0];
    
    // Verificar si la cuenta está bloqueada
    if (user.locked_until && new Date() < new Date(user.locked_until)) {
      client.release();
      return { 
        success: false, 
        error: 'Cuenta bloqueada temporalmente por intentos fallidos' 
      };
    }
    
    // Validar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (passwordMatch) {
      // Login exitoso - actualizar last_login y resetear intentos fallidos
      await client.query(`
        UPDATE admin_users 
        SET last_login = CURRENT_TIMESTAMP, 
            failed_login_attempts = 0,
            locked_until = NULL
        WHERE id = $1
      `, [user.id]);
      
      client.release();
      
      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          lastLogin: new Date()
        }
      };
    } else {
      // Login fallido - incrementar intentos
      const newFailedAttempts = user.failed_login_attempts + 1;
      let lockUntil = null;
      
      // Bloquear después de 5 intentos fallidos por 30 minutos
      if (newFailedAttempts >= 5) {
        lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
      }
      
      await client.query(`
        UPDATE admin_users 
        SET failed_login_attempts = $1,
            locked_until = $2
        WHERE id = $3
      `, [newFailedAttempts, lockUntil, user.id]);
      
      client.release();
      
      return { 
        success: false, 
        error: `Contraseña incorrecta. Intentos fallidos: ${newFailedAttempts}/5` 
      };
    }
    
  } catch (error) {
    console.error('Error validando credenciales:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

module.exports = {
  initializeAdminUsers,
  createAdminUser,
  validateCredentials,
  pool
};

// Si se ejecuta directamente, inicializar las tablas
if (require.main === module) {
  initializeAdminUsers()
    .then(() => {
      console.log('✅ Script ejecutado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error ejecutando script:', error);
      process.exit(1);
    });
}
