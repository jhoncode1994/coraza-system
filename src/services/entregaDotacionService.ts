// entregaDotacionService.ts - Servicio para gestión de entregas de dotación
import { query } from './db';

export interface EntregaDotacion {
  id?: number;
  userId: number;
  elemento: string;
  cantidad: number;
  fechaEntrega: Date | string;
  observaciones?: string;
  firmaDigital?: string;
  tipo?: 'entrega' | 'devolucion';
}

export async function getAllEntregas() {
  const result = await query('SELECT * FROM entregas_dotacion ORDER BY fechaEntrega DESC');
  return result.rows;
}

export async function getEntregasByUser(userId: number) {
  const result = await query(
    'SELECT * FROM entregas_dotacion WHERE userId = $1 ORDER BY fechaEntrega DESC',
    [userId]
  );
  return result.rows;
}

export async function createEntrega(entrega: EntregaDotacion) {
  const result = await query(
    `INSERT INTO entregas_dotacion (userId, elemento, cantidad, fechaEntrega, observaciones, firmaDigital, tipo)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      entrega.userId,
      entrega.elemento,
      entrega.cantidad,
      entrega.fechaEntrega,
      entrega.observaciones || '',
      entrega.firmaDigital || '',
      entrega.tipo || 'entrega'
    ]
  );
  return result.rows[0];
}

export async function updateEntrega(id: number, entrega: EntregaDotacion) {
  const result = await query(
    `UPDATE entregas_dotacion 
     SET userId = $1, elemento = $2, cantidad = $3, fechaEntrega = $4, 
         observaciones = $5, firmaDigital = $6, tipo = $7
     WHERE id = $8 
     RETURNING *`,
    [
      entrega.userId,
      entrega.elemento,
      entrega.cantidad,
      entrega.fechaEntrega,
      entrega.observaciones || '',
      entrega.firmaDigital || '',
      entrega.tipo || 'entrega',
      id
    ]
  );
  return result.rows[0];
}

export async function deleteEntrega(id: number) {
  const result = await query('DELETE FROM entregas_dotacion WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
}
