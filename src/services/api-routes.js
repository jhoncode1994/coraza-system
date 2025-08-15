const express = require('express');
const router = express.Router();

// Import database connection
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
  port: 5432
});

// Test database connection
router.get('/test', async (req, res) => {
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
router.post('/init-database', async (req, res) => {
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
router.get('/users', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM users ORDER BY id');
    client.release();
    
    // Map snake_case to camelCase
    const users = result.rows.map(user => ({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      position: user.position,
      department: user.department,
      hireDate: user.hire_date,
      status: user.status,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }));
    
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
router.get('/users/:id', async (req, res) => {
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
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      position: user.position,
      department: user.department,
      hireDate: user.hire_date,
      status: user.status,
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

// Create new user
router.post('/users', async (req, res) => {
  try {
    const { firstName, lastName, email, position, department } = req.body;
    
    const client = await pool.connect();
    const result = await client.query(
      'INSERT INTO users (first_name, last_name, email, position, department, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [firstName, lastName, email, position, department, 'active']
    );
    client.release();
    
    const user = result.rows[0];
    const mappedUser = {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      position: user.position,
      department: user.department,
      hireDate: user.hire_date,
      status: user.status,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
    
    res.status(201).json(mappedUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ 
      error: 'Error al crear usuario',
      details: error.message
    });
  }
});

module.exports = router;
