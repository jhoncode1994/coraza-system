// insert-test-user.js - Insertar un usuario de prueba directamente en la base de datos
const { Pool } = require('pg');
require('dotenv').config();

console.log('Insertando usuario de prueba en la tabla de usuarios...');

// Configuración de conexión a la base de datos
const poolConfig = {
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  port: 5432,
  ssl: { rejectUnauthorized: false }
};

const pool = new Pool(poolConfig);

async function insertTestUser() {
  try {
    // Conectar a la base de datos
    console.log('Conectando a la base de datos...');
    const client = await pool.connect();
    console.log('Conexión establecida correctamente');
    
    // Datos del usuario de prueba
    const testUser = {
      nombre: 'Usuario',
      apellido: 'De Prueba',
      cedula: '123456789',
      zona: 1,
      fecha_ingreso: new Date().toISOString().split('T')[0] // Fecha actual en formato YYYY-MM-DD
    };
    
    // Insertar el usuario de prueba
    console.log('\nInsertando usuario de prueba con los siguientes datos:');
    console.table([testUser]);
    
    const insertResult = await client.query(
      `INSERT INTO usuarios (nombre, apellido, cedula, zona, fecha_ingreso) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [testUser.nombre, testUser.apellido, testUser.cedula, testUser.zona, testUser.fecha_ingreso]
    );
    
    console.log('\nUsuario insertado correctamente:');
    console.table(insertResult.rows);
    
    // Consultar todos los usuarios para verificar
    console.log('\nVerificando todos los usuarios en la tabla:');
    const allUsersResult = await client.query('SELECT * FROM usuarios');
    console.table(allUsersResult.rows);
    
    // Liberar el cliente
    client.release();
    
    console.log('\n¡Proceso completado con éxito!');
  } catch (err) {
    console.error('Error:', err);
    if (err.code === '23505') {
      console.error('El usuario ya existe (violación de clave única).');
    }
  } finally {
    // Cerrar el pool
    await pool.end();
  }
}

// Ejecutar la inserción
insertTestUser();
