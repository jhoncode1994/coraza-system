// db.ts - Configuración de conexión a PostgreSQL (Neon)
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Cargar variables de entorno desde .env
dotenv.config();

// Configuración de conexión a la base de datos
let poolConfig: any = {
  connectionString: process.env["DATABASE_URL"] || "postgres://localhost:5432/coraza"
};

// Siempre usar SSL para Neon, independientemente del entorno
poolConfig.ssl = { 
  rejectUnauthorized: false // Necesario para conexiones a Neon
};

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
