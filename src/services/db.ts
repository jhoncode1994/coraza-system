// db.ts - Configuración de conexión a PostgreSQL (Neon)
import { Pool } from 'pg';

// Configuración de conexión a la base de datos Neon
const pool = new Pool({
  connectionString: process.env["DATABASE_URL"], // Debes definir esta variable en Render
  ssl: { 
    rejectUnauthorized: false // Necesario para conexiones a Neon desde Render
  }
});

// Verificar la conexión al iniciar
pool.connect()
  .then(() => console.log('Conexión a la base de datos PostgreSQL establecida correctamente'))
  .catch((err) => console.error('Error al conectar a PostgreSQL:', err));

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
