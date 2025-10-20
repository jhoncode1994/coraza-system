"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEntrega = exports.updateEntrega = exports.createEntrega = exports.getEntregasByUser = exports.getAllEntregas = void 0;
// entregaDotacionService.ts - Servicio para gestión de entregas de dotación
const db_1 = require("./db");
async function getAllEntregas() {
    const result = await (0, db_1.query)('SELECT * FROM entrega_dotacion ORDER BY "fechaEntrega" DESC');
    return result.rows;
}
exports.getAllEntregas = getAllEntregas;
async function getEntregasByUser(userId) {
    const result = await (0, db_1.query)('SELECT * FROM entrega_dotacion WHERE "userId" = $1 ORDER BY "fechaEntrega" DESC', [userId]);
    return result.rows;
}
exports.getEntregasByUser = getEntregasByUser;
async function createEntrega(entrega) {
    const result = await (0, db_1.query)(`INSERT INTO entrega_dotacion ("userId", elemento, cantidad, "fechaEntrega", observaciones, "firma_url")
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`, [
        entrega.userId,
        entrega.elemento,
        entrega.cantidad,
        entrega.fechaEntrega,
        entrega.observaciones || '',
        entrega.firma_url || ''
    ]);
    return result.rows[0];
}
exports.createEntrega = createEntrega;
async function updateEntrega(id, entrega) {
    const result = await (0, db_1.query)(`UPDATE entrega_dotacion 
     SET "userId" = $1, elemento = $2, cantidad = $3, "fechaEntrega" = $4, 
         observaciones = $5, "firma_url" = $6
     WHERE id = $7 
     RETURNING *`, [
        entrega.userId,
        entrega.elemento,
        entrega.cantidad,
        entrega.fechaEntrega,
        entrega.observaciones || '',
        entrega.firma_url || '',
        id
    ]);
    return result.rows[0];
}
exports.updateEntrega = updateEntrega;
async function deleteEntrega(id) {
    const result = await (0, db_1.query)('DELETE FROM entrega_dotacion WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
}
exports.deleteEntrega = deleteEntrega;
//# sourceMappingURL=entregaDotacionService.js.map