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
