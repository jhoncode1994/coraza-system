// entregaDotacionService.ts - Servicio para gestión de entregas de dotación
import { query } from './db';

export interface EntregaDotacion {
  id?: number;
  userId: number;
  elemento: string;
  cantidad: number;
  fechaEntrega: Date | string;
  observaciones?: string;
  firma_url?: string;
}

export interface ElementoEntrega {
  categoria: string;
  categoriaOriginal: string;
  talla: string | null;
  cantidad: number;
}

export interface EntregaConTallas {
  userId: number;
  elementos: ElementoEntrega[];
  observaciones?: string;
  firma_url?: string;
}

export async function getAllEntregas() {
  const result = await query('SELECT * FROM entrega_dotacion ORDER BY "fechaEntrega" DESC');
  return result.rows;
}

export async function getEntregasByUser(userId: number) {
  const result = await query(
    'SELECT * FROM entrega_dotacion WHERE "userId" = $1 ORDER BY "fechaEntrega" DESC',
    [userId]
  );
  return result.rows;
}

export async function createEntrega(entrega: EntregaDotacion) {
  const result = await query(
    `INSERT INTO entrega_dotacion ("userId", elemento, cantidad, "fechaEntrega", observaciones, "firma_url")
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      entrega.userId,
      entrega.elemento,
      entrega.cantidad,
      entrega.fechaEntrega,
      entrega.observaciones || '',
      entrega.firma_url || ''
    ]
  );
  return result.rows[0];
}

export async function updateEntrega(id: number, entrega: EntregaDotacion) {
  const result = await query(
    `UPDATE entrega_dotacion 
     SET "userId" = $1, elemento = $2, cantidad = $3, "fechaEntrega" = $4, 
         observaciones = $5, "firma_url" = $6
     WHERE id = $7 
     RETURNING *`,
    [
      entrega.userId,
      entrega.elemento,
      entrega.cantidad,
      entrega.fechaEntrega,
      entrega.observaciones || '',
      entrega.firma_url || '',
      id
    ]
  );
  return result.rows[0];
}

export async function deleteEntrega(id: number) {
  const result = await query('DELETE FROM entrega_dotacion WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
}

export async function createEntregaConTallas(entrega: EntregaConTallas) {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env["DATABASE_URL"],
    ssl: process.env["NODE_ENV"] === 'production' ? { rejectUnauthorized: false } : false
  });
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const fechaEntrega = new Date();
    const insertedRows = [];
    
    // Insertar cada elemento como un registro separado
    for (const elemento of entrega.elementos) {
      const elementoStr = elemento.talla 
        ? `${elemento.categoria} - Talla ${elemento.talla}`
        : elemento.categoria;
      
      const result = await client.query(
        `INSERT INTO entrega_dotacion ("userId", elemento, cantidad, "fechaEntrega", observaciones, "firma_url")
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          entrega.userId,
          elementoStr,
          elemento.cantidad,
          fechaEntrega,
          entrega.observaciones || '',
          entrega.firma_url || ''
        ]
      );
      insertedRows.push(result.rows[0]);
      
      // Actualizar el stock del elemento
      if (elemento.talla) {
        // Buscar el código del elemento con esa talla
        const stockResult = await client.query(
          `SELECT code FROM supply WHERE name = $1 AND category = $2 AND talla = $3`,
          [elemento.categoria, elemento.categoriaOriginal, elemento.talla]
        );
        
        if (stockResult.rows.length > 0) {
          const code = stockResult.rows[0].code;
          await client.query(
            `UPDATE supply SET quantity = quantity - $1 WHERE code = $2`,
            [elemento.cantidad, code]
          );
        }
      } else {
        // Sin talla, actualizar todos los items de esa categoría proporcionalmente
        await client.query(
          `UPDATE supply SET quantity = quantity - $1 
           WHERE name = $2 AND category = $3`,
          [elemento.cantidad, elemento.categoria, elemento.categoriaOriginal]
        );
      }
    }
    
    await client.query('COMMIT');
    client.release();
    return insertedRows;
  } catch (error) {
    await client.query('ROLLBACK');
    client.release();
    throw error;
  }
}
