"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupplyHistoryByAssociate = void 0;
// supplyHistoryService.ts - Lógica para historial de dotación por empleado
const db_1 = require("./db");
async function getSupplyHistoryByAssociate(associateId) {
    const result = await (0, db_1.query)('SELECT * FROM associate_supply_history WHERE associate_id = $1 ORDER BY delivered_at DESC', [associateId]);
    return result.rows;
}
exports.getSupplyHistoryByAssociate = getSupplyHistoryByAssociate;
//# sourceMappingURL=supplyHistoryService.js.map