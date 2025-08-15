const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

// Enable CORS
app.use(cors());
app.use(express.json());

// Database connection using pg directly
const { Pool } = require('pg');

// Database configuration using environment variables
const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
  port: 5432
});

// API Routes
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
    console.log('POST /api/users - Request body:', req.body);
    
    const { nombre, apellido, cedula, zona, fechaIngreso } = req.body;
    
    console.log('Extracted fields:', {
      nombre,
      apellido, 
      cedula,
      zona,
      fechaIngreso
    });
    
    // Validar que todos los campos requeridos estén presentes
    if (!nombre || !apellido || !cedula || !zona || !fechaIngreso) {
      console.log('Missing fields:', { nombre, apellido, cedula, zona, fechaIngreso });
      return res.status(400).json({ 
        error: 'Todos los campos son requeridos',
        received: { nombre, apellido, cedula, zona, fechaIngreso }
      });
    }
    
    const client = await pool.connect();
    console.log('Connected to database');
    
    const result = await client.query(
      'INSERT INTO users (nombre, apellido, cedula, zona, fecha_ingreso) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nombre, apellido, cedula, zona, fechaIngreso]
    );
    client.release();
    
    console.log('User inserted:', result.rows[0]);
    
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
    
    res.status(201).json(mappedUser);
  } catch (error) {
    console.error('Error creating user:', error);
    console.error('Error details:', error.message);
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
    const { nombre, apellido, cedula, zona, fechaIngreso } = req.body;
    
    const client = await pool.connect();
    const result = await client.query(
      'UPDATE users SET nombre = $1, apellido = $2, cedula = $3, zona = $4, fecha_ingreso = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [nombre, apellido, cedula, zona, fechaIngreso, id]
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
    console.error('Error updating user:', error);
    res.status(500).json({ 
      error: 'Error al actualizar usuario',
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
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
