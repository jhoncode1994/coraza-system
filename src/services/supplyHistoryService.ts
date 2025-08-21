// supplyHistoryService.ts - Lógica para historial de dotación por empleado
import { query } from './db';

export async function getSupplyHistoryByAssociate(associateId: number) {
  const result = await query(
    'SELECT * FROM associate_supply_history WHERE associate_id = $1 ORDER BY delivered_at DESC',
    [associateId]
  );
  return result.rows;
}
