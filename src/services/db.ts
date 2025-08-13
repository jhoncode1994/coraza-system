// db.ts - Configuración de conexión a PostgreSQL (Neon)
import { Pool } from 'pg';

// Configuración de conexión a la base de datos Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Debes definir esta variable en Render
  ssl: { 
    rejectUnauthorized: false // Necesario para conexiones a Neon desde Render
  }
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
