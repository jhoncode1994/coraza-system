// Servidor express simple para probar la API de usuarios
const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = 3001; // Usamos un puerto diferente para evitar conflictos

// Configuración de la base de datos
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: process.env.DB_HOST.includes('neon') ? { rejectUnauthorized: false } : false
});

// Middleware para JSON y CORS
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Servir archivos estáticos
app.use('/test', express.static(__dirname + '/public'));

// Ruta para verificar si el servidor está funcionando
app.get('/', (req, res) => {
  res.send({ 
    message: 'Servidor de prueba funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Ruta para obtener todos los usuarios
app.get('/users', async (req, res) => {
  try {
    console.log('Intentando conectar a la base de datos...');
    const client = await pool.connect();
    console.log('Conexión exitosa, ejecutando consulta...');
    
    const result = await client.query('SELECT * FROM usuarios ORDER BY id');
    client.release();
    
    console.log(`Consulta exitosa. Se encontraron ${result.rows.length} usuarios.`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    res.status(500).json({ error: 'Error al obtener usuarios', details: err.message });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor de prueba corriendo en http://localhost:${PORT}`);
  console.log('Para probar la API de usuarios: http://localhost:' + PORT + '/users');
  console.log('Para ver la interfaz de prueba: http://localhost:' + PORT + '/test/users-view.html');
});
