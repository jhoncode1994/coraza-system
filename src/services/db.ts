// db.ts - Configuración de conexión a PostgreSQL (Neon)
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env["DATABASE_URL"], // Debes definir esta variable en Render
  ssl: { rejectUnauthorized: false }
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
