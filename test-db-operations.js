// test-db-operations.js - Script para probar operaciones CRUD con la base de datos
const { Pool } = require('pg');
require('dotenv').config();

console.log('Iniciando pruebas de operaciones CRUD en la base de datos...');

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

// Función para mostrar todos los usuarios
async function mostrarUsuarios() {
  const result = await pool.query('SELECT id, nombre, apellido, cedula, zona, fecha_ingreso FROM usuarios ORDER BY id');
  
  if (result.rows.length === 0) {
    console.log('La tabla está vacía');
  } else {
    console.log('\nUsuarios en la base de datos:');
    console.table(result.rows);
  }
}

// Función para ejecutar todas las pruebas
async function ejecutarPruebas() {
  let client;
  try {
    client = await pool.connect();
    console.log('Conexión establecida correctamente');

    // 1. Borrar cualquier dato de prueba anterior (si existe)
    console.log('\n1. Limpiando datos de prueba anteriores...');
    await client.query("DELETE FROM usuarios WHERE cedula LIKE 'TEST%'");
    console.log('Datos de prueba anteriores eliminados');
    
    // 2. Insertar un nuevo usuario de prueba
    console.log('\n2. Insertando usuario de prueba...');
    const fechaActual = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    const insertResult = await client.query(
      'INSERT INTO usuarios (nombre, apellido, cedula, zona, fecha_ingreso) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      ['Usuario', 'Prueba', 'TEST12345', 99, fechaActual]
    );
    console.log('Usuario insertado correctamente:');
    console.table(insertResult.rows);
    
    // 3. Consultar todos los usuarios
    console.log('\n3. Consultando todos los usuarios...');
    await mostrarUsuarios();
    
    // 4. Actualizar el usuario de prueba
    console.log('\n4. Actualizando usuario de prueba...');
    const updateResult = await client.query(
      'UPDATE usuarios SET nombre = $1, zona = $2 WHERE cedula = $3 RETURNING *',
      ['Usuario Actualizado', 88, 'TEST12345']
    );
    console.log('Usuario actualizado correctamente:');
    console.table(updateResult.rows);
    
    // 5. Consultar el usuario actualizado
    console.log('\n5. Consultando usuario actualizado...');
    const queryResult = await client.query('SELECT * FROM usuarios WHERE cedula = $1', ['TEST12345']);
    console.log('Datos del usuario actualizado:');
    console.table(queryResult.rows);
    
    // 6. Eliminar el usuario de prueba
    console.log('\n6. Eliminando usuario de prueba...');
    await client.query('DELETE FROM usuarios WHERE cedula = $1', ['TEST12345']);
    console.log('Usuario eliminado correctamente');
    
    // 7. Verificar que se eliminó el usuario
    console.log('\n7. Verificando eliminación...');
    const finalResult = await client.query('SELECT COUNT(*) as count FROM usuarios WHERE cedula = $1', ['TEST12345']);
    if (finalResult.rows[0].count === '0') {
      console.log('Usuario eliminado correctamente. No se encontró en la base de datos.');
    } else {
      console.log('¡Error! El usuario no se eliminó correctamente.');
    }
    
    console.log('\nEstado final de la tabla:');
    await mostrarUsuarios();
    
    console.log('\n¡Todas las pruebas completadas con éxito!');
    console.log('La conexión a la base de datos está funcionando correctamente.');
    console.log('Las operaciones CRUD (Crear, Leer, Actualizar, Eliminar) funcionan correctamente.');
    
  } catch (err) {
    console.error('Error durante las pruebas:', err);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

// Ejecutar todas las pruebas
ejecutarPruebas();
