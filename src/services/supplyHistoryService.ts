// supplyHistoryService.ts - Lógica para historial de dotación por empleado
import { query } from './db';

export async function getSupplyHistoryByEmployee(employeeId: number) {
  const result = await query(
    'SELECT * FROM employee_supply_history WHERE employee_id = $1 ORDER BY delivered_at DESC',
    [employeeId]
  );
  return result.rows;
}
