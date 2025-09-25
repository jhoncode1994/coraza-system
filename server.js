const express = require('express');
const path = require('path');
const cors = require('cors');
// Implementación simple de hash sin dependencias externas
const crypto = require('crypto');

// Coraza System - Server v1.0.2 - Railway Deploy
console.log('🚀 Iniciando Coraza System Server...');
console.log('📡 Desplegando en Railway...');

// Cargar variables de entorno (sin dotenv en producción)
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config();
  } catch (e) {
    console.log('dotenv no disponible, usando variables de entorno del sistema');
  }
}

// Funciones de hash simples usando crypto nativo
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

const app = express();

// Enable CORS
app.use(cors());
app.use(express.json());

// Database connection using pg directly
const { Pool } = require('pg');

// Database configuration using environment variables
console.log('🔍 Variables de entorno detectadas:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Configurado' : 'No configurado');
console.log('PGHOST:', process.env.PGHOST || 'No configurado');
console.log('PGDATABASE:', process.env.PGDATABASE || 'No configurado');
console.log('PGUSER:', process.env.PGUSER || 'No configurado');

const dbConfig = process.env.DATABASE_URL 
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    }
  : {
      host: process.env.PGHOST,
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      port: process.env.PGPORT || 5432,
      ssl: { rejectUnauthorized: false }
    };

console.log('🔗 Configuración de base de datos:', {
  ...dbConfig,
  password: dbConfig.password ? '***' : 'No configurada'
});

const pool = new Pool(dbConfig);

// Initialize admin users table and default user
async function initializeAdminUsers(client) {
  try {
    console.log('🔐 Inicializando tabla de usuarios administrativos...');
    
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
      const passwordHash = hashPassword(defaultPassword);
      
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
    
    console.log('🎉 Inicialización de usuarios administrativos completada');
    
  } catch (error) {
    console.error('❌ Error inicializando usuarios administrativos:', error);
    throw error;
  }
}

// Initialize database tables on startup
async function initializeDatabase() {
  try {
    console.log('🚀 Inicializando base de datos...');
    const client = await pool.connect();
    
    // Initialize admin users first
    await initializeAdminUsers(client);
    
    // Create inventory_movements table
    console.log('📋 Creando tabla inventory_movements...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_movements (
        id SERIAL PRIMARY KEY,
        supply_id INTEGER REFERENCES supply_inventory(id),
        movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('entrada', 'salida')),
        quantity INTEGER NOT NULL,
        reason VARCHAR(100) NOT NULL,
        notes TEXT,
        previous_quantity INTEGER NOT NULL,
        new_quantity INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla inventory_movements inicializada');
    
    // Create retired_associate_supply_history table
    console.log('📋 Creando tabla retired_associate_supply_history...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS retired_associate_supply_history (
        id SERIAL PRIMARY KEY,
        retired_associate_id INTEGER NOT NULL,
        original_delivery_id INTEGER,
        elemento VARCHAR(200) NOT NULL,
        cantidad INTEGER NOT NULL,
        delivered_at TIMESTAMP,
        signature_data TEXT,
        observaciones TEXT,
        retired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla retired_associate_supply_history inicializada');
    
    client.release();
    console.log('✅ Base de datos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
  }
}

// Initialize database on startup
initializeDatabase();

// Authentication functions
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
    const passwordMatch = verifyPassword(password, user.password_hash);
    
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

// API Routes
// Authentication endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔐 Intento de login recibido');
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Usuario y contraseña son requeridos'
      });
    }
    
    const result = await validateCredentials(username, password);
    
    if (result.success) {
      console.log(`✅ Login exitoso para usuario: ${username}`);
      res.json({
        success: true,
        user: result.user,
        message: `¡Bienvenido ${result.user.username}!`
      });
    } else {
      console.log(`❌ Login fallido para usuario: ${username} - ${result.error}`);
      res.status(401).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error en endpoint de login:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Test database connection
app.get('/api/test', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    res.json({ 
      success: true, 
      message: 'Database connection successful',
      timestamp: result.rows[0].now
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Database connection failed',
      details: error.message
    });
  }
});

// Initialize database (temporary endpoint for setup)
app.post('/api/init-database', async (req, res) => {
  try {
    const client = await pool.connect();
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        position VARCHAR(100),
        department VARCHAR(100),
        hire_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create supply inventory table
    await client.query(`
      CREATE TABLE IF NOT EXISTS supply_inventory (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(200) NOT NULL,
        category VARCHAR(100) NOT NULL,
        quantity INTEGER DEFAULT 0,
        minimum_quantity INTEGER DEFAULT 10,
        unit_price DECIMAL(10,2),
        description TEXT,
        last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create inventory movements table
    console.log('Creating inventory_movements table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_movements (
        id SERIAL PRIMARY KEY,
        supply_id INTEGER REFERENCES supply_inventory(id),
        movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('entrada', 'salida')),
        quantity INTEGER NOT NULL,
        reason VARCHAR(100) NOT NULL,
        notes TEXT,
        previous_quantity INTEGER NOT NULL,
        new_quantity INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('inventory_movements table created successfully');
    
    // Insert sample users
    await client.query(`
      INSERT INTO users (first_name, last_name, email, position, department) VALUES 
      ('Juan', 'Pérez', 'juan.perez@coraza.com', 'Desarrollador', 'IT'),
      ('María', 'González', 'maria.gonzalez@coraza.com', 'Analista', 'Finanzas'),
      ('Carlos', 'López', 'carlos.lopez@coraza.com', 'Gerente', 'Operaciones'),
      ('Ana', 'Martínez', 'ana.martinez@coraza.com', 'Diseñadora', 'Marketing')
      ON CONFLICT (email) DO NOTHING
    `);
    
    // Insert sample supply data
    await client.query(`
      INSERT INTO supply_inventory (code, name, category, quantity, minimum_quantity, unit_price, description) VALUES 
      ('UNI-001', 'Camisa Polo Azul', 'uniforme', 25, 10, 45000, 'Camisa polo azul marino talla M'),
      ('UNI-002', 'Pantalón Cargo Negro', 'uniforme', 15, 8, 75000, 'Pantalón cargo negro talla 32'),
      ('ACC-001', 'Gorra Corporativa', 'accesorios', 30, 15, 25000, 'Gorra con logo corporativo'),
      ('ACC-002', 'Corbata Azul', 'accesorios', 20, 10, 35000, 'Corbata azul marino'),
      ('UNI-003', 'Chaqueta Corporativa', 'uniforme', 8, 5, 120000, 'Chaqueta formal corporativa')
      ON CONFLICT (code) DO NOTHING
    `);
    
    // Get counts
    const usersResult = await client.query('SELECT COUNT(*) FROM users');
    const supplyResult = await client.query('SELECT COUNT(*) FROM supply_inventory');
    
    client.release();
    
    res.json({
      success: true,
      message: 'Database initialized successfully',
      users_count: usersResult.rows[0].count,
      supply_items_count: supplyResult.rows[0].count
    });
    
  } catch (error) {
    console.error('Database initialization error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Database initialization failed',
      details: error.message
    });
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    console.log('GET /api/users - Fetching users from database');
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM users ORDER BY id');
    client.release();
    
    console.log('Users fetched from database:', result.rows);
    
    // Map database fields to frontend expected format
    const users = result.rows.map(user => ({
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      cedula: user.cedula,
      zona: user.zona,
      cargo: user.cargo,
      fechaIngreso: user.fecha_ingreso,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }));
    
    console.log('Mapped users for frontend:', users);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      error: 'Error al obtener usuarios',
      details: error.message
    });
  }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const user = result.rows[0];
    const mappedUser = {
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      cedula: user.cedula,
      zona: user.zona,
      fechaIngreso: user.fecha_ingreso,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
    
    res.json(mappedUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      error: 'Error al obtener usuario',
      details: error.message
    });
  }
});

// Get all supply inventory items
app.get('/api/supply-inventory', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM supply_inventory ORDER BY category, name');
    client.release();
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching supply inventory:', error);
    res.status(500).json({ 
      error: 'Error al obtener inventario',
      details: error.message
    });
  }
});

// Update supply quantity (main operation since items are fixed)
app.put('/api/supply-inventory/:id/quantity', async (req, res) => {
  try {
    const { quantity } = req.body;
    const { id } = req.params;
    
    if (quantity < 0) {
      return res.status(400).json({ error: 'La cantidad no puede ser negativa' });
    }
    
    const client = await pool.connect();
    const result = await client.query(
      'UPDATE supply_inventory SET quantity = $1, last_update = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [quantity, id]
    );
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Elemento no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating quantity:', error);
    res.status(500).json({ 
      error: 'Error al actualizar cantidad',
      details: error.message
    });
  }
});

// Get low stock items (quantity <= minimum_quantity)
app.get('/api/supply-inventory/low-stock', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM supply_inventory WHERE quantity <= minimum_quantity ORDER BY category, name'
    );
    client.release();
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ 
      error: 'Error al obtener elementos con stock bajo',
      details: error.message
    });
  }
});

// Get supply statistics
app.get('/api/supply-inventory/stats', async (req, res) => {
  try {
    const client = await pool.connect();
    
    const totalItems = await client.query('SELECT COUNT(*) as total FROM supply_inventory');
    const lowStockItems = await client.query('SELECT COUNT(*) as low_stock FROM supply_inventory WHERE quantity <= minimum_quantity');
    const categories = await client.query('SELECT category, COUNT(*) as count FROM supply_inventory GROUP BY category ORDER BY category');
    const totalValue = await client.query('SELECT SUM(quantity * unit_price) as total_value FROM supply_inventory');
    
    client.release();
    
    res.json({
      total_items: totalItems.rows[0].total,
      low_stock_count: lowStockItems.rows[0].low_stock,
      categories: categories.rows,
      total_value: totalValue.rows[0].total_value || 0
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ 
      error: 'Error al obtener estadísticas',
      details: error.message
    });
  }
});

// Create new user
app.post('/api/users', async (req, res) => {
  try {
    console.log('POST /api/users - Request received');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Body type:', typeof req.body);
    console.log('Content-Type:', req.headers['content-type']);
    
    const { nombre, apellido, cedula, zona, fechaIngreso, cargo } = req.body;
    
    // Validar que todos los campos requeridos estén presentes
    if (!nombre || !apellido || !cedula || zona === undefined || zona === null || !fechaIngreso) {
      console.log('Missing required fields:', { nombre, apellido, cedula, zona, fechaIngreso });
      return res.status(400).json({ 
        error: 'Todos los campos son requeridos',
        received: { nombre, apellido, cedula, zona, fechaIngreso }
      });
    }
    
    // Convertir y validar zona como número entero
    const zonaInt = parseInt(zona);
    if (isNaN(zonaInt)) {
      return res.status(400).json({ 
        error: 'La zona debe ser un número válido',
        received: zona 
      });
    }
    
    // Procesar fecha - asegurar formato YYYY-MM-DD
    let fechaFormatted;
    try {
      if (typeof fechaIngreso === 'string' && fechaIngreso.includes('T')) {
        // Si es ISO string, extraer solo la fecha
        fechaFormatted = fechaIngreso.split('T')[0];
      } else if (typeof fechaIngreso === 'string' && fechaIngreso.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Si ya está en formato YYYY-MM-DD
        fechaFormatted = fechaIngreso;
      } else {
        // Intentar parsear como fecha y formatear
        const date = new Date(fechaIngreso);
        if (isNaN(date.getTime())) {
          return res.status(400).json({ 
            error: 'Formato de fecha inválido',
            received: fechaIngreso 
          });
        }
        fechaFormatted = date.toISOString().split('T')[0];
      }
    } catch (error) {
      return res.status(400).json({ 
        error: 'Error al procesar la fecha',
        received: fechaIngreso,
        details: error.message
      });
    }
    
    console.log('Processed data:', {
      nombre,
      apellido,
      cedula,
      zona: zonaInt,
      fechaIngreso: fechaFormatted
    });
    
    const client = await pool.connect();
    const result = await client.query(
      'INSERT INTO users (nombre, apellido, cedula, zona, fecha_ingreso, cargo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [nombre, apellido, cedula, zonaInt, fechaFormatted, cargo]
    );
    client.release();
    
    console.log('User inserted successfully:', result.rows[0]);
    
    const user = result.rows[0];
    const mappedUser = {
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      cedula: user.cedula,
      zona: user.zona,
      cargo: user.cargo,
      fechaIngreso: user.fecha_ingreso,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
    
    res.status(201).json(mappedUser);
  } catch (error) {
    console.error('Error creating user:', error);
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
    
    // Manejar errores específicos de PostgreSQL
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ 
        error: 'La cédula ya está registrada',
        details: 'Ya existe un usuario con esta cédula'
      });
    }
    
    res.status(500).json({ 
      error: 'Error al crear usuario',
      details: error.message
    });
  }
});

// Update user
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, cedula, zona, fechaIngreso, cargo } = req.body;
    
    const client = await pool.connect();
    const result = await client.query(
      'UPDATE users SET nombre = $1, apellido = $2, cedula = $3, zona = $4, fecha_ingreso = $5, cargo = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [nombre, apellido, cedula, zona, fechaIngreso, cargo, id]
    );
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const user = result.rows[0];
    const mappedUser = {
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      cedula: user.cedula,
      zona: user.zona,
      cargo: user.cargo,
      fechaIngreso: user.fecha_ingreso,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
    
    res.json(mappedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ 
      error: 'Error al actualizar usuario',
      details: error.message
    });
  }
});

// Add stock to inventory item with movement tracking
app.post('/api/inventory-movements/add-stock', async (req, res) => {
  try {
    const { supplyId, quantity, reason, notes, talla } = req.body;
    
    if (!supplyId || !quantity || !reason) {
      return res.status(400).json({ 
        error: 'Faltan datos requeridos: supplyId, quantity, reason' 
      });
    }

    const client = await pool.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');
      
      let inventoryQuery, inventoryParams;
      
      if (talla) {
        // Para elementos con talla, buscar el registro específico por talla
        inventoryQuery = `
          SELECT id, quantity, name, category 
          FROM supply_inventory 
          WHERE (id = $1 OR (name = (SELECT name FROM supply_inventory WHERE id = $1) 
                            AND category = (SELECT category FROM supply_inventory WHERE id = $1)))
            AND talla = $2
        `;
        inventoryParams = [supplyId, talla];
      } else {
        // Para elementos sin talla, buscar el registro normal
        inventoryQuery = 'SELECT id, quantity, name, category FROM supply_inventory WHERE id = $1 AND talla IS NULL';
        inventoryParams = [supplyId];
      }
      
      const currentResult = await client.query(inventoryQuery, inventoryParams);
      
      let targetInventoryId, previousQuantity, newQuantity;
      
      if (currentResult.rows.length === 0 && talla) {
        // Si no existe un registro para esta talla, crear uno nuevo
        const baseItemQuery = 'SELECT name, category, minimum_quantity, code FROM supply_inventory WHERE id = $1';
        const baseItem = await client.query(baseItemQuery, [supplyId]);
        
        if (baseItem.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'Elemento de inventario no encontrado' });
        }
        
        const { name, category, minimum_quantity, code } = baseItem.rows[0];
        
        // Crear nuevo registro con talla
        const insertResult = await client.query(
          'INSERT INTO supply_inventory (name, category, quantity, minimum_quantity, code, talla, last_update) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP) RETURNING id',
          [name, category, quantity, minimum_quantity, `${code}-${talla}`, talla]
        );
        
        targetInventoryId = insertResult.rows[0].id;
        previousQuantity = 0;
        newQuantity = quantity;
        
      } else if (currentResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Elemento de inventario no encontrado' });
      } else {
        // Actualizar registro existente
        const currentItem = currentResult.rows[0];
        targetInventoryId = currentItem.id;
        previousQuantity = currentItem.quantity;
        newQuantity = previousQuantity + quantity;
        
        // Update inventory quantity
        await client.query(
          'UPDATE supply_inventory SET quantity = $1, last_update = CURRENT_TIMESTAMP WHERE id = $2',
          [newQuantity, targetInventoryId]
        );
      }
      
      // Record movement
      await client.query(
        'INSERT INTO inventory_movements (supply_id, movement_type, quantity, reason, notes, previous_quantity, new_quantity) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [targetInventoryId, 'entrada', quantity, reason, notes, previousQuantity, newQuantity]
      );
      
      // Commit transaction
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: `Stock agregado exitosamente${talla ? ` (Talla: ${talla})` : ''}`,
        previousQuantity,
        newQuantity,
        quantityAdded: quantity,
        talla: talla || null,
        inventoryId: targetInventoryId
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error adding stock:', error);
    res.status(500).json({ 
      error: 'Error al agregar stock',
      details: error.message
    });
  }
});

// Get inventory movements
app.get('/api/inventory-movements', async (req, res) => {
  try {
    const client = await pool.connect();
    
    // First check if the table exists and create it if it doesn't
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS inventory_movements (
          id SERIAL PRIMARY KEY,
          supply_id INTEGER REFERENCES supply_inventory(id),
          movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('entrada', 'salida')),
          quantity INTEGER NOT NULL,
          reason VARCHAR(100) NOT NULL,
          notes TEXT,
          previous_quantity INTEGER NOT NULL,
          new_quantity INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('inventory_movements table verified/created');
    } catch (tableError) {
      console.error('Error creating inventory_movements table:', tableError);
    }
    
    const result = await client.query(`
      SELECT 
        im.*,
        si.name as supply_name,
        si.code as supply_code
      FROM inventory_movements im
      JOIN supply_inventory si ON im.supply_id = si.id
      ORDER BY im.created_at DESC
    `);
    client.release();
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching inventory movements:', error);
    res.status(500).json({ 
      error: 'Error al obtener movimientos de inventario',
      details: error.message
    });
  }
});

// Get inventory movements for specific supply item
app.get('/api/inventory-movements/supply/:supplyId', async (req, res) => {
  try {
    const { supplyId } = req.params;
    const client = await pool.connect();
    const result = await client.query(`
      SELECT 
        im.*,
        si.name as supply_name,
        si.code as supply_code
      FROM inventory_movements im
      JOIN supply_inventory si ON im.supply_id = si.id
      WHERE im.supply_id = $1
      ORDER BY im.created_at DESC
    `, [supplyId]);
    client.release();
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching supply movements:', error);
    res.status(500).json({ 
      error: 'Error al obtener movimientos del elemento',
      details: error.message
    });
  }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await pool.connect();
    const result = await client.query(
      'DELETE FROM users WHERE id = $1 RETURNING *',
      [id]
    );
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const user = result.rows[0];
    const mappedUser = {
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      cedula: user.cedula,
      zona: user.zona,
      fechaIngreso: user.fecha_ingreso,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
    
    res.json(mappedUser);
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      error: 'Error al eliminar usuario',
      details: error.message
    });
  }
});

// Test endpoint for debugging
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Test retire endpoint
app.get('/api/associates/:id/test', async (req, res) => {
  try {
    const associateId = Number(req.params.id);
    console.log(`Test endpoint - ID: ${associateId}`);
    
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM users WHERE id = $1', [associateId]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json({
      message: 'Usuario encontrado para retiro',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error en test:', error);
    res.status(500).json({ error: error.message });
  }
});

// Retirement functionality
// Retire an associate (move to retired_associates table)
app.post('/api/associates/:id/retire', async (req, res) => {
  console.log('=== INICIO PROCESO DE RETIRO ===');
  console.log('Parámetros recibidos:', req.params);
  console.log('Body recibido:', req.body);
  
  try {
    const associateId = Number(req.params.id);
    const { retiredReason } = req.body;
    
    console.log(`Procesando retiro - ID: ${associateId}, Razón: ${retiredReason}`);
    
    if (!associateId || isNaN(associateId)) {
      console.log('Error: ID de asociado inválido');
      return res.status(400).json({ error: 'ID de asociado inválido' });
    }
    
    console.log('Conectando a la base de datos...');
    const client = await pool.connect();
    
    try {
      console.log('Iniciando transacción...');
      // Start transaction
      await client.query('BEGIN');
      
      console.log('Verificando/creando tablas necesarias...');
      // Ensure retired tables exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS retired_associates (
          id SERIAL PRIMARY KEY,
          original_id INTEGER NOT NULL,
          nombre VARCHAR(100) NOT NULL,
          apellido VARCHAR(100) NOT NULL,
          cedula VARCHAR(20) NOT NULL,
          zona INTEGER NOT NULL,
          fecha_ingreso DATE,
          retirement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          retired_reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Tabla retired_associates verificada/creada');
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS retired_associate_supply_history (
          id SERIAL PRIMARY KEY,
          retired_associate_id INTEGER REFERENCES retired_associates(id),
          supply_code VARCHAR(50),
          supply_name VARCHAR(200),
          categoria VARCHAR(50),
          talla VARCHAR(10),
          cantidad INTEGER,
          fecha_entrega DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Tabla retired_associate_supply_history verificada/creada');
      
      
      // 1. Get associate data
      console.log('Buscando datos del asociado...');
      const associateResult = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [associateId]
      );
      
      if (associateResult.rows.length === 0) {
        console.log('Asociado no encontrado en la base de datos');
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Asociado no encontrado' });
      }
      
      const associate = associateResult.rows[0];
      console.log('Asociado encontrado:', {
        id: associate.id,
        nombre: associate.nombre,
        apellido: associate.apellido,
        cedula: associate.cedula
      });

      // 2. Insert into retired_associates table
      console.log('Insertando en tabla de retirados...');
      
      // Use the exact structure from production database
      const retiredResult = await client.query(`
        INSERT INTO retired_associates 
        (associate_id, nombre, apellido, cedula, zona, telefono, email, retired_reason, retired_by, original_creation_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `, [
        associate.id,
        associate.nombre,
        associate.apellido,
        associate.cedula,
        associate.zona,
        associate.telefono || null,
        associate.email || null,
        retiredReason || 'Retiro solicitado',
        1, // retired_by (usuario que procesa)
        associate.created_at || new Date()
      ]);
      
      const retiredAssociateId = retiredResult.rows[0].id;
      console.log('Asociado insertado en retirados con ID:', retiredAssociateId);      // 3. Move delivery history to retired_associate_supply_history
      console.log('Buscando historial de entregas...');
      const historyResult = await client.query(
        'SELECT * FROM entrega_dotacion WHERE "userId" = $1',
        [associateId]
      );
      
      console.log(`Encontradas ${historyResult.rows.length} entregas para migrar`);
      
      for (const delivery of historyResult.rows) {
        console.log('Migrando entrega:', {
          id: delivery.id,
          elemento: delivery.elemento,
          cantidad: delivery.cantidad,
          fechaEntrega: delivery.fechaEntrega,
          observaciones: delivery.observaciones,
          firma_url: delivery.firma_url
        });
        
        await client.query(`
          INSERT INTO retired_associate_supply_history 
          (retired_associate_id, original_delivery_id, elemento, cantidad, delivered_at, observaciones, signature_data)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          retiredAssociateId,
          delivery.id || null,
          delivery.elemento || 'N/A',
          delivery.cantidad || 1,
          delivery.fechaEntrega || new Date(),
          delivery.observaciones || null,
          delivery.firma_url || null
        ]);
        console.log('Entrega migrada exitosamente');
      }
      console.log('Historial migrado exitosamente');

      // 4. Delete original records
      console.log('Eliminando registros originales...');
      const deleteDeliveries = await client.query('DELETE FROM entrega_dotacion WHERE "userId" = $1', [associateId]);
      console.log(`Eliminadas ${deleteDeliveries.rowCount} entregas`);
      
      const deleteUser = await client.query('DELETE FROM users WHERE id = $1', [associateId]);
      console.log(`Eliminado usuario (filas afectadas: ${deleteUser.rowCount})`);
      
      await client.query('COMMIT');
      console.log('=== RETIRO COMPLETADO EXITOSAMENTE ===');
      
      res.json({ 
        message: 'Asociado retirado exitosamente',
        retiredAssociateId: retiredAssociateId 
      });
      
    } catch (error) {
      console.log('=== ERROR EN TRANSACCIÓN ===');
      console.error('Detalles del error:', error);
      console.error('Stack trace:', error.stack);
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
      console.log('Conexión de base de datos liberada');
    }
    
  } catch (error) {
    console.log('=== ERROR GENERAL ===');
    console.error('Error retirando asociado:', error);
    console.error('Mensaje:', error.message);
    console.error('Código:', error.code);
    res.status(500).json({ 
      error: 'Error al retirar asociado',
      details: error.message,
      code: error.code 
    });
  }
});

// Get all retired associates
app.get('/api/retired-associates', async (req, res) => {
  try {
    console.log('Obteniendo asociados retirados...');
    const client = await pool.connect();
    
    // First ensure the table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS retired_associates (
        id SERIAL PRIMARY KEY,
        original_id INTEGER NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        apellido VARCHAR(100) NOT NULL,
        cedula VARCHAR(20) NOT NULL,
        zona INTEGER NOT NULL,
        fecha_ingreso DATE,
        retirement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        retired_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const result = await client.query(`
      SELECT * FROM retired_associates 
      ORDER BY retired_date DESC
    `);
    client.release();
    
    console.log(`Encontrados ${result.rows.length} asociados retirados`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo asociados retirados:', error);
    res.status(500).json({ 
      error: 'Error al obtener asociados retirados',
      details: error.message 
    });
  }
});

// Get retired associate history
app.get('/api/retired-associates/:id/history', async (req, res) => {
  try {
    const retiredAssociateId = Number(req.params.id);
    console.log('Obteniendo historial para asociado retirado ID:', retiredAssociateId);
    
    const client = await pool.connect();
    
    // First, let's check the table structure
    const structureResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'retired_associate_supply_history'
      ORDER BY ordinal_position
    `);
    console.log('Estructura de retired_associate_supply_history:', structureResult.rows);
    
    // Try to get the history
    const result = await client.query(`
      SELECT * FROM retired_associate_supply_history 
      WHERE retired_associate_id = $1 
      ORDER BY delivered_at DESC
    `, [retiredAssociateId]);
    
    console.log(`Encontradas ${result.rows.length} entradas de historial`);
    if (result.rows.length > 0) {
      console.log('Primera entrada:', result.rows[0]);
    }
    
    client.release();
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo historial de asociado retirado:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

// Get retired associates statistics
app.get('/api/retired-associates/stats', async (req, res) => {
  try {
    console.log('Obteniendo estadísticas de asociados retirados...');
    const client = await pool.connect();
    
    // Get total retired associates
    const totalResult = await client.query(`
      SELECT COUNT(*) as total FROM retired_associates
    `);
    
    // Get retired associates by month
    const monthlyResult = await client.query(`
      SELECT 
        DATE_TRUNC('month', retired_date) as month,
        COUNT(*) as count
      FROM retired_associates 
      WHERE retired_date >= DATE_TRUNC('year', CURRENT_DATE)
      GROUP BY DATE_TRUNC('month', retired_date)
      ORDER BY month DESC
    `);
    
    // Get retired associates by reason
    const reasonResult = await client.query(`
      SELECT 
        retired_reason,
        COUNT(*) as count
      FROM retired_associates 
      GROUP BY retired_reason
      ORDER BY count DESC
    `);
    
    client.release();
    
    const stats = {
      total: parseInt(totalResult.rows[0]?.total || 0),
      byMonth: monthlyResult.rows,
      byReason: reasonResult.rows
    };
    
    console.log('Estadísticas obtenidas:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ 
      error: 'Error al obtener estadísticas',
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Endpoints para entrega de dotaciones

// Guardar entrega de dotación
app.post('/api/delivery', async (req, res) => {
  let client;
  try {
    const { userId, elemento, talla, cantidad, fechaEntrega, observaciones, firma_url } = req.body;
    
    console.log('=== INICIANDO PROCESO DE ENTREGA ===');
    console.log('Datos recibidos:', {
      userId,
      elemento,
      talla,
      cantidad,
      fechaEntrega,
      observaciones: observaciones ? 'Presente' : 'Ausente',
      firma_url: firma_url ? 'Presente' : 'Ausente'
    });
    
    // Validar datos requeridos
    if (!userId || !elemento || !cantidad) {
      throw new Error('Datos faltantes: userId, elemento y cantidad son requeridos');
    }
    
    if (cantidad <= 0) {
      throw new Error('La cantidad debe ser mayor a 0');
    }
    
    client = await pool.connect();
    
    // Iniciar transacción para asegurar consistencia
    await client.query('BEGIN');
    
    // 1. Buscar el item específico en supply_inventory
    let findQuery;
    let findParams;
    
    console.log(`Buscando elemento: "${elemento}" con talla: "${talla || 'sin talla'}"`);
    
    if (talla) {
      // Buscar por nombre del elemento y talla específica
      findQuery = `
        SELECT id, name, quantity, talla 
        FROM supply_inventory 
        WHERE LOWER(name) LIKE LOWER($1) AND talla = $2
        ORDER BY quantity DESC
        LIMIT 1
      `;
      findParams = [`%${elemento}%`, talla];
    } else {
      // Buscar solo por nombre del elemento
      findQuery = `
        SELECT id, name, quantity, talla 
        FROM supply_inventory 
        WHERE LOWER(name) LIKE LOWER($1) AND (talla IS NULL OR talla = '')
        ORDER BY quantity DESC
        LIMIT 1
      `;
      findParams = [`%${elemento}%`];
    }
    
    console.log('Query SQL:', findQuery);
    console.log('Parámetros:', findParams);
    
    const inventoryResult = await client.query(findQuery, findParams);
    
    console.log(`Elementos encontrados: ${inventoryResult.rows.length}`);
    if (inventoryResult.rows.length > 0) {
      console.log('Elemento encontrado:', inventoryResult.rows[0]);
    }
    
    if (inventoryResult.rows.length === 0) {
      throw new Error(`No se encontró el elemento "${elemento}"${talla ? ` con talla "${talla}"` : ''} en el inventario. Verifica que el elemento exista y tenga stock disponible.`);
    }
    
    const inventoryItem = inventoryResult.rows[0];
    
    if (inventoryItem.quantity < cantidad) {
      throw new Error(`Stock insuficiente. Disponible: ${inventoryItem.quantity}, Solicitado: ${cantidad}`);
    }
    
    // 2. Actualizar el stock en supply_inventory
    const newQuantity = inventoryItem.quantity - cantidad;
    await client.query(
      'UPDATE supply_inventory SET quantity = $1 WHERE id = $2',
      [newQuantity, inventoryItem.id]
    );
    
    console.log(`Stock actualizado: ${elemento}${talla ? ` (${talla})` : ''} - Cantidad anterior: ${inventoryItem.quantity}, Nueva cantidad: ${newQuantity}`);
    
    // 3. Registrar la entrega en entrega_dotacion
    const result = await client.query(`
      INSERT INTO entrega_dotacion ("userId", elemento, talla, cantidad, "fechaEntrega", "firma_url", observaciones)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [userId, elemento, talla, cantidad, fechaEntrega || new Date(), firma_url, observaciones]);
    
    // 4. Registrar el movimiento en inventory_movements
    await client.query(`
      INSERT INTO inventory_movements (supply_id, movement_type, quantity, reason, created_by)
      VALUES ($1, 'SALIDA', $2, $3, 'SISTEMA')
    `, [inventoryItem.id, cantidad, `Entrega a usuario ${userId}: ${elemento}${talla ? ` (${talla})` : ''}`]);
    
    // Confirmar transacción
    await client.query('COMMIT');
    
    res.json({ 
      success: true, 
      message: `Entrega guardada exitosamente. Stock actualizado: ${newQuantity} unidades restantes.`,
      id: result.rows[0].id,
      stockActualizado: {
        elemento: elemento,
        talla: talla,
        stockAnterior: inventoryItem.quantity,
        stockActual: newQuantity,
        cantidadEntregada: cantidad
      }
    });
  } catch (error) {
    // Revertir transacción en caso de error
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error en rollback:', rollbackError);
      }
    }
    
    console.error('Error detallado guardando entrega:', {
      error: error.message,
      stack: error.stack,
      elemento: req.body.elemento,
      talla: req.body.talla,
      cantidad: req.body.cantidad,
      userId: req.body.userId
    });
    
    res.status(500).json({ 
      error: 'Error al procesar entrega', 
      details: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// Obtener historial de entregas por usuario
app.get('/api/delivery/user/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    console.log('Obteniendo historial de entregas para usuario:', userId);
    
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT * FROM entrega_dotacion 
      WHERE "userId" = $1 
      ORDER BY "fechaEntrega" DESC
    `, [userId]);
    
    client.release();
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

// Obtener todas las entregas
app.get('/api/delivery', async (req, res) => {
  try {
    console.log('Obteniendo todas las entregas...');
    
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT ed.*, u.nombre, u.apellido, u.cedula 
      FROM entrega_dotacion ed
      JOIN users u ON ed."userId" = u.id
      ORDER BY ed."fechaEntrega" DESC
    `);
    
    client.release();
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo entregas:', error);
    res.status(500).json({ error: 'Error al obtener entregas' });
  }
});

// Endpoint para obtener historial de entregas de un asociado específico para PDF
app.get('/api/delivery/associate/:userId/pdf-data', async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(`Obteniendo datos PDF para asociado ${userId}...`);
    
    const client = await pool.connect();
    
    // Obtener datos del asociado
    const userResult = await client.query(`
      SELECT nombre, apellido, cedula 
      FROM users 
      WHERE id = $1
    `, [userId]);
    
    if (userResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: 'Asociado no encontrado' });
    }
    
    // Obtener entregas del asociado
    const deliveriesResult = await client.query(`
      SELECT 
        TO_CHAR("fechaEntrega", 'DD/MM/YYYY') as fecha,
        elemento,
        cantidad,
        observaciones
      FROM entrega_dotacion
      WHERE "userId" = $1
      ORDER BY "fechaEntrega" DESC
    `, [userId]);
    
    client.release();
    
    const associateData = userResult.rows[0];
    const deliveries = deliveriesResult.rows;
    
    res.json({
      associate: {
        nombre: `${associateData.nombre} ${associateData.apellido}`,
        cedula: associateData.cedula
      },
      deliveries: deliveries
    });
    
  } catch (error) {
    console.error('Error obteniendo datos PDF del asociado:', error);
    res.status(500).json({ error: 'Error al obtener datos para PDF' });
  }
});

// Endpoint para obtener resumen general de elementos para PDF
app.get('/api/delivery/elements-summary/pdf-data', async (req, res) => {
  try {
    console.log('Obteniendo resumen de elementos para PDF...');
    
    const client = await pool.connect();
    
    // Obtener todos los elementos únicos
    const elementsResult = await client.query(`
      SELECT DISTINCT elemento 
      FROM entrega_dotacion 
      ORDER BY elemento
    `);
    
    const elementsSummary = [];
    
    // Para cada elemento, obtener sus entregas
    for (const elementRow of elementsResult.rows) {
      const elemento = elementRow.elemento;
      
      const deliveriesResult = await client.query(`
        SELECT 
          TO_CHAR(ed."fechaEntrega", 'DD/MM/YYYY') as fecha,
          ed.elemento,
          ed.cantidad,
          ed.observaciones,
          CONCAT(u.nombre, ' ', u.apellido) as asociado,
          u.cedula
        FROM entrega_dotacion ed
        JOIN users u ON ed."userId" = u.id
        WHERE ed.elemento = $1
        ORDER BY ed."fechaEntrega" DESC
      `, [elemento]);
      
      const entregas = deliveriesResult.rows;
      const totalEntregado = entregas.reduce((sum, entrega) => sum + entrega.cantidad, 0);
      
      elementsSummary.push({
        elemento: elemento,
        totalEntregado: totalEntregado,
        entregas: entregas
      });
    }
    
    client.release();
    
    res.json(elementsSummary);
    
  } catch (error) {
    console.error('Error obteniendo resumen de elementos:', error);
    res.status(500).json({ error: 'Error al obtener resumen de elementos' });
  }
});

// Endpoint para obtener datos de un elemento específico para PDF
app.get('/api/delivery/element/:elementName/pdf-data', async (req, res) => {
  try {
    const elementName = decodeURIComponent(req.params.elementName);
    console.log(`Obteniendo datos PDF para elemento: ${elementName}`);
    
    const client = await pool.connect();
    
    const deliveriesResult = await client.query(`
      SELECT 
        TO_CHAR(ed."fechaEntrega", 'DD/MM/YYYY') as fecha,
        ed.elemento,
        ed.cantidad,
        ed.observaciones,
        CONCAT(u.nombre, ' ', u.apellido) as asociado,
        u.cedula
      FROM entrega_dotacion ed
      JOIN users u ON ed."userId" = u.id
      WHERE ed.elemento = $1
      ORDER BY ed."fechaEntrega" DESC
    `, [elementName]);
    
    client.release();
    
    res.json({
      elemento: elementName,
      deliveries: deliveriesResult.rows
    });
    
  } catch (error) {
    console.error('Error obteniendo datos del elemento:', error);
    res.status(500).json({ error: 'Error al obtener datos del elemento' });
  }
});

// Endpoints para limpieza masiva de registros

// Obtener estadísticas de registros para limpieza
app.get('/api/delivery/stats', async (req, res) => {
  try {
    console.log('Obteniendo estadísticas de registros...');
    
    const client = await pool.connect();
    
    // Total de registros
    const totalResult = await client.query('SELECT COUNT(*) as total FROM entrega_dotacion');
    const totalRegistros = parseInt(totalResult.rows[0].total);
    
    // Registros por año
    const aniosResult = await client.query(`
      SELECT 
        EXTRACT(YEAR FROM "fechaEntrega") as anio,
        COUNT(*) as cantidad
      FROM entrega_dotacion
      GROUP BY EXTRACT(YEAR FROM "fechaEntrega")
      ORDER BY anio DESC
    `);
    
    // Registros por mes
    const mesesResult = await client.query(`
      SELECT 
        EXTRACT(YEAR FROM "fechaEntrega") as anio,
        EXTRACT(MONTH FROM "fechaEntrega") as mes,
        COUNT(*) as cantidad,
        COUNT(CASE WHEN "firma_url" IS NOT NULL AND "firma_url" != '' THEN 1 END) as firmas
      FROM entrega_dotacion
      GROUP BY EXTRACT(YEAR FROM "fechaEntrega"), EXTRACT(MONTH FROM "fechaEntrega")
      ORDER BY anio DESC, mes DESC
    `);
    
    // Estimar espacio en firmas (aproximado)
    const firmasResult = await client.query(`
      SELECT COUNT(*) as total_firmas 
      FROM entrega_dotacion 
      WHERE "firma_url" IS NOT NULL AND "firma_url" != ''
    `);
    
    const espacioFirmas = Math.round(parseInt(firmasResult.rows[0].total_firmas) * 0.05); // ~50KB por firma
    
    client.release();
    
    res.json({
      totalRegistros,
      registrosPorAnio: aniosResult.rows.map(row => ({
        anio: parseInt(row.anio),
        cantidad: parseInt(row.cantidad)
      })),
      registrosPorMes: mesesResult.rows.map(row => ({
        anio: parseInt(row.anio),
        mes: parseInt(row.mes),
        cantidad: parseInt(row.cantidad),
        firmas: parseInt(row.firmas)
      })),
      espacioFirmas
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// Previsualizar eliminación masiva
app.get('/api/delivery/preview-delete', async (req, res) => {
  try {
    const { anio, mes, fechaInicio, fechaFin } = req.query;
    console.log('Previsualizando eliminación:', { anio, mes, fechaInicio, fechaFin });
    
    const client = await pool.connect();
    
    let whereClause = '';
    let params = [];
    
    if (anio && mes) {
      whereClause = 'WHERE EXTRACT(YEAR FROM "fechaEntrega") = $1 AND EXTRACT(MONTH FROM "fechaEntrega") = $2';
      params = [anio, mes];
    } else if (anio) {
      whereClause = 'WHERE EXTRACT(YEAR FROM "fechaEntrega") = $1';
      params = [anio];
    } else if (fechaInicio && fechaFin) {
      whereClause = 'WHERE "fechaEntrega" >= $1 AND "fechaEntrega" <= $2';
      params = [fechaInicio, fechaFin];
    }
    
    // Obtener cantidad total
    const countResult = await client.query(`
      SELECT COUNT(*) as cantidad FROM entrega_dotacion ${whereClause}
    `, params);
    
    // Obtener URLs de firmas
    const firmasResult = await client.query(`
      SELECT "firma_url" FROM entrega_dotacion 
      ${whereClause} AND "firma_url" IS NOT NULL AND "firma_url" != ''
    `, params);
    
    client.release();
    
    res.json({
      cantidad: parseInt(countResult.rows[0].cantidad),
      firmas: firmasResult.rows.map(row => row.firma_url).filter(url => url)
    });
  } catch (error) {
    console.error('Error en previsualización:', error);
    res.status(500).json({ error: 'Error en previsualización' });
  }
});

// Obtener firmas a eliminar
app.get('/api/delivery/get-firmas-to-delete', async (req, res) => {
  try {
    const { anio, mes, fechaInicio, fechaFin } = req.query;
    console.log('Obteniendo firmas a eliminar:', { anio, mes, fechaInicio, fechaFin });
    
    const client = await pool.connect();
    
    let whereClause = '';
    let params = [];
    
    if (anio && mes) {
      whereClause = 'WHERE EXTRACT(YEAR FROM "fechaEntrega") = $1 AND EXTRACT(MONTH FROM "fechaEntrega") = $2';
      params = [anio, mes];
    } else if (anio) {
      whereClause = 'WHERE EXTRACT(YEAR FROM "fechaEntrega") = $1';
      params = [anio];
    } else if (fechaInicio && fechaFin) {
      whereClause = 'WHERE "fechaEntrega" >= $1 AND "fechaEntrega" <= $2';
      params = [fechaInicio, fechaFin];
    }
    
    const result = await client.query(`
      SELECT "firma_url" FROM entrega_dotacion 
      ${whereClause} AND "firma_url" IS NOT NULL AND "firma_url" != ''
    `, params);
    
    client.release();
    
    res.json({
      firmas: result.rows.map(row => row.firma_url).filter(url => url)
    });
  } catch (error) {
    console.error('Error obteniendo firmas:', error);
    res.status(500).json({ error: 'Error al obtener firmas' });
  }
});

// Eliminación masiva de registros
app.delete('/api/delivery/bulk-delete', async (req, res) => {
  try {
    const { anio, mes, fechaInicio, fechaFin } = req.query;
    console.log('Eliminación masiva:', { anio, mes, fechaInicio, fechaFin });
    
    // Validar que no se eliminen registros del último año
    const anioActual = new Date().getFullYear();
    if (anio && parseInt(anio) >= (anioActual - 1)) {
      return res.status(400).json({ error: 'No se pueden eliminar registros del último año' });
    }
    
    const client = await pool.connect();
    
    let whereClause = '';
    let params = [];
    
    if (anio && mes) {
      whereClause = 'WHERE EXTRACT(YEAR FROM "fechaEntrega") = $1 AND EXTRACT(MONTH FROM "fechaEntrega") = $2';
      params = [anio, mes];
    } else if (anio) {
      whereClause = 'WHERE EXTRACT(YEAR FROM "fechaEntrega") = $1';
      params = [anio];
    } else if (fechaInicio && fechaFin) {
      whereClause = 'WHERE "fechaEntrega" >= $1 AND "fechaEntrega" <= $2';
      params = [fechaInicio, fechaFin];
      
      // Validar fechas
      const fechaInicioDate = new Date(fechaInicio);
      const fechaLimite = new Date();
      fechaLimite.setFullYear(fechaLimite.getFullYear() - 1);
      
      if (fechaInicioDate >= fechaLimite) {
        return res.status(400).json({ error: 'No se pueden eliminar registros del último año' });
      }
    }
    
    if (!whereClause) {
      return res.status(400).json({ error: 'Parámetros de eliminación inválidos' });
    }
    
    const result = await client.query(`
      DELETE FROM entrega_dotacion ${whereClause}
    `, params);
    
    client.release();
    
    console.log(`Eliminados ${result.rowCount} registros`);
    
    res.json({
      success: true,
      eliminados: result.rowCount,
      message: `Eliminados ${result.rowCount} registros exitosamente`
    });
  } catch (error) {
    console.error('Error en eliminación masiva:', error);
    res.status(500).json({ error: 'Error en eliminación masiva' });
  }
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist/coraza-system-angular')));

// Handle Angular routing - send all requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/coraza-system-angular/index.html'));
});

// Get port from environment variable or default to 3000
const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Frontend: http://localhost:${port}`);
  console.log(`API: http://localhost:${port}/api`);
  console.log('Environment variables loaded:', {
    PGHOST: process.env.PGHOST ? 'Set' : 'Not set',
    PGDATABASE: process.env.PGDATABASE ? 'Set' : 'Not set',
    PGUSER: process.env.PGUSER ? 'Set' : 'Not set'
  });
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});
