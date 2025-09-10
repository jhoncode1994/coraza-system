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
