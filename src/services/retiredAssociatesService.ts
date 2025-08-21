import { query } from './db';

export interface RetiredAssociate {
  id?: number;
  associate_id: number;
  nombre: string;
  apellido: string;
  cedula: string;
  zona: number;
  telefono?: string;
  email?: string;
  retired_date: Date;
  retired_reason?: string;
  retired_by: number;
  original_creation_date?: Date;
}

export interface RetiredSupplyHistory {
  id?: number;
  retired_associate_id: number;
  original_delivery_id?: number;
  elemento: string;
  cantidad: number;
  delivered_at: Date;
  signature_data?: string;
  observaciones?: string;
  retired_at: Date;
}

// Retirar un asociado (mover a tabla de retirados)
export async function retireAssociate(
  associateId: number, 
  retiredReason: string, 
  retiredBy: number
): Promise<void> {
  const client = await query('BEGIN');
  
  try {
    // 1. Obtener datos del asociado
    const associateResult = await query(
      'SELECT * FROM users WHERE id = $1',
      [associateId]
    );
    
    if (associateResult.rows.length === 0) {
      throw new Error('Asociado no encontrado');
    }
    
    const associate = associateResult.rows[0];
    
    // 2. Insertar en tabla de retirados
    const retiredResult = await query(`
      INSERT INTO retired_associates 
      (associate_id, nombre, apellido, cedula, zona, telefono, email, retired_reason, retired_by, original_creation_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `, [
      associate.id,
      associate.nombre,
      associate.apellido,
      associate.cedula,
      associate.zona,
      associate.telefono,
      associate.email,
      retiredReason,
      retiredBy,
      associate.created_at
    ]);
    
    const retiredAssociateId = retiredResult.rows[0].id;
    
    // 3. Mover historial de dotaciones
    const historyResult = await query(
      'SELECT * FROM entrega_dotacion WHERE "userId" = $1',
      [associateId]
    );
    
    for (const delivery of historyResult.rows) {
      await query(`
        INSERT INTO retired_associate_supply_history 
        (retired_associate_id, original_delivery_id, elemento, cantidad, delivered_at, signature_data, observaciones)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        retiredAssociateId,
        delivery.id,
        delivery.elemento,
        delivery.cantidad,
        delivery.fechaEntrega,
        delivery.firmaDigital,
        delivery.observaciones
      ]);
    }
    
    // 4. Eliminar registros originales
    await query('DELETE FROM entrega_dotacion WHERE "userId" = $1', [associateId]);
    await query('DELETE FROM users WHERE id = $1', [associateId]);
    
    await query('COMMIT');
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
}

// Obtener todos los asociados retirados
export async function getRetiredAssociates(): Promise<RetiredAssociate[]> {
  const result = await query(`
    SELECT * FROM retired_associates 
    ORDER BY retired_date DESC
  `);
  return result.rows;
}

// Obtener historial de un asociado retirado
export async function getRetiredAssociateHistory(retiredAssociateId: number): Promise<RetiredSupplyHistory[]> {
  const result = await query(`
    SELECT * FROM retired_associate_supply_history 
    WHERE retired_associate_id = $1 
    ORDER BY delivered_at DESC
  `, [retiredAssociateId]);
  return result.rows;
}

// Buscar asociado retirado por cédula
export async function findRetiredAssociateByCedula(cedula: string): Promise<RetiredAssociate | null> {
  const result = await query(
    'SELECT * FROM retired_associates WHERE cedula = $1',
    [cedula]
  );
  return result.rows[0] || null;
}

// Obtener estadísticas de asociados retirados
export async function getRetiredAssociatesStats() {
  const totalResult = await query('SELECT COUNT(*) as total FROM retired_associates');
  const byMonthResult = await query(`
    SELECT 
      DATE_TRUNC('month', retired_date) as month,
      COUNT(*) as count
    FROM retired_associates 
    WHERE retired_date >= NOW() - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', retired_date)
    ORDER BY month DESC
  `);
  
  return {
    total: parseInt(totalResult.rows[0].total),
    byMonth: byMonthResult.rows
  };
}
