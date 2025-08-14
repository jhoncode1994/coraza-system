// check-db-records.js - Consultar directamente los registros de la tabla de usuarios
const { Pool } = require('pg');
require('dotenv').config();

console.log('Consultando registros de la tabla de usuarios...');
console.log(`Host: ${process.env.PGHOST}`);
console.log(`Database: ${process.env.PGDATABASE}`);
console.log(`User: ${process.env.PGUSER}`);
console.log('Password: [Oculta por seguridad]');

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

async function checkRecords() {
  try {
    // Conectar a la base de datos
    console.log('Conectando a la base de datos...');
    const client = await pool.connect();
    console.log('Conexión establecida correctamente');
    
    // Listar todas las tablas de la base de datos
    console.log('\n1. Tablas en la base de datos:');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('No se encontraron tablas en la base de datos.');
    } else {
      console.log('Tablas encontradas:');
      tablesResult.rows.forEach(row => {
        console.log(`- ${row.table_name}`);
      });
    }
    
    // Verificar si la tabla 'usuarios' existe
    console.log('\n2. Verificando estructura de la tabla de usuarios:');
    try {
      const structureResult = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'usuarios'
        ORDER BY ordinal_position
      `);
      
      if (structureResult.rows.length === 0) {
        console.log('La tabla usuarios no tiene columnas o no existe.');
      } else {
        console.log('Estructura de la tabla usuarios:');
        structureResult.rows.forEach(row => {
          console.log(`- ${row.column_name}: ${row.data_type}`);
        });
      }
    } catch (error) {
      console.log('Error al consultar la estructura de la tabla:', error.message);
    }
    
    // Intentar consultar los registros de la tabla usuarios
    console.log('\n3. Consultando registros de la tabla usuarios:');
    try {
      const usersResult = await client.query('SELECT * FROM usuarios');
      
      if (usersResult.rows.length === 0) {
        console.log('La tabla usuarios está vacía (no hay registros).');
      } else {
        console.log(`Se encontraron ${usersResult.rows.length} registros:`);
        console.table(usersResult.rows);
      }
    } catch (error) {
      console.log('Error al consultar los registros de usuarios:', error.message);
      console.log('Es posible que la tabla "usuarios" no exista en la base de datos.');
      console.log('Necesitas crear la tabla usando el script create_users_table.sql');
    }
    
    // Liberar el cliente
    client.release();
  } catch (err) {
    console.error('Error al conectar a PostgreSQL:', err);
  } finally {
    // Cerrar el pool
    await pool.end();
  }
}

// Ejecutar la consulta
checkRecords();
