// db.ts - Configuración de conexión a PostgreSQL (Neon)
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Cargar variables de entorno desde .env
dotenv.config();

// Configuración de conexión a la base de datos
let poolConfig: any = {
  host: process.env["PGHOST"],
  database: process.env["PGDATABASE"],
  user: process.env["PGUSER"],
  password: process.env["PGPASSWORD"],
  port: 5432,
  ssl: true
};

// Configurar SSL y channel binding según variables de entorno
if (process.env["PGSSLMODE"] === 'require') {
  poolConfig.ssl = { 
    rejectUnauthorized: false 
  };
}

if (process.env["PGCHANNELBINDING"] === 'require') {
  // Asegurarse que el SSL está configurado correctamente
  poolConfig.ssl = poolConfig.ssl || {};
  poolConfig.ssl.rejectUnauthorized = false;
}

const pool = new Pool(poolConfig);

// Verificar la conexión al iniciar
pool.connect()
  .then(() => console.log('Conexión a la base de datos PostgreSQL establecida correctamente'))
  .catch((err: Error) => console.error('Error al conectar a PostgreSQL:', err));

// Función para ejecutar queries
export const query = async (text: string, params?: any[]) => {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Error ejecutando query:', text);
    console.error('Parámetros:', params);
    console.error('Error:', error);
    throw error;
  }
};
