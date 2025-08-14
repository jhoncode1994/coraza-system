// test-db-connection.ts - Script simple para probar la conexión a la base de datos
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Cargar variables de entorno desde .env
dotenv.config();

console.log('Intentando conectar a la base de datos...');
console.log(`Host: ${process.env["PGHOST"]}`);
console.log(`Database: ${process.env["PGDATABASE"]}`);
console.log(`User: ${process.env["PGUSER"]}`);
console.log('Password: [Oculta por seguridad]');
console.log(`SSL Mode: ${process.env["PGSSLMODE"]}`);

// Configuración de conexión a la base de datos
const poolConfig: any = {
  host: process.env["PGHOST"],
  database: process.env["PGDATABASE"],
  user: process.env["PGUSER"],
  password: process.env["PGPASSWORD"],
  port: 5432,
  ssl: true
};

// Configurar SSL según variables de entorno
if (process.env["PGSSLMODE"] === 'require') {
  poolConfig.ssl = { 
    rejectUnauthorized: false 
  };
}

const pool = new Pool(poolConfig);

// Probar la conexión
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('¡Conexión exitosa a la base de datos PostgreSQL!');
    
    // Probar una consulta simple
    const result = await client.query('SELECT NOW() as time, current_database() as database, current_user as user');
    console.log('Información de la conexión:');
    console.log(`- Hora del servidor: ${result.rows[0].time}`);
    console.log(`- Base de datos: ${result.rows[0].database}`);
    console.log(`- Usuario: ${result.rows[0].user}`);
    
    // Probar consulta a la tabla de usuarios (si existe)
    try {
      console.log('\nVerificando tabla de usuarios...');
      const usersResult = await client.query('SELECT COUNT(*) as total FROM usuarios');
      console.log(`La tabla usuarios existe y contiene ${usersResult.rows[0].total} registros.`);
    } catch (error) {
      const tableError = error as Error;
      console.log('No se pudo consultar la tabla usuarios. Es posible que no exista:', tableError.message);
      console.log('Para crear la tabla, ejecuta el script create_users_table.sql');
    }
    
    client.release();
  } catch (err) {
    console.error('Error al conectar a PostgreSQL:', err);
  } finally {
    // Cerrar el pool
    await pool.end();
  }
}

// Ejecutar la prueba
testConnection();
