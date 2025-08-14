"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupplyHistoryByEmployee = void 0;
// supplyHistoryService.ts - Lógica para historial de dotación por empleado
const db_1 = require("./db");
async function getSupplyHistoryByEmployee(employeeId) {
    const result = await (0, db_1.query)('SELECT * FROM employee_supply_history WHERE employee_id = $1 ORDER BY delivered_at DESC', [employeeId]);
    return result.rows;
}
exports.getSupplyHistoryByEmployee = getSupplyHistoryByEmployee;
//# sourceMappingURL=supplyHistoryService.js.map