"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRetiredAssociatesStats = exports.findRetiredAssociateByCedula = exports.getRetiredAssociateHistory = exports.getRetiredAssociates = exports.retireAssociate = void 0;
const db_1 = require("./db");
// Retirar un asociado (mover a tabla de retirados)
async function retireAssociate(associateId, retiredReason, retiredBy) {
    const client = await (0, db_1.query)('BEGIN');
    try {
        // 1. Obtener datos del asociado
        const associateResult = await (0, db_1.query)('SELECT * FROM users WHERE id = $1', [associateId]);
        if (associateResult.rows.length === 0) {
            throw new Error('Asociado no encontrado');
        }
        const associate = associateResult.rows[0];
        // 2. Insertar en tabla de retirados
        const retiredResult = await (0, db_1.query)(`
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
        const historyResult = await (0, db_1.query)('SELECT * FROM entrega_dotacion WHERE "userId" = $1', [associateId]);
        for (const delivery of historyResult.rows) {
            await (0, db_1.query)(`
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
        await (0, db_1.query)('DELETE FROM entrega_dotacion WHERE "userId" = $1', [associateId]);
        await (0, db_1.query)('DELETE FROM users WHERE id = $1', [associateId]);
        await (0, db_1.query)('COMMIT');
    }
    catch (error) {
        await (0, db_1.query)('ROLLBACK');
        throw error;
    }
}
exports.retireAssociate = retireAssociate;
// Obtener todos los asociados retirados
async function getRetiredAssociates() {
    const result = await (0, db_1.query)(`
    SELECT * FROM retired_associates 
    ORDER BY retired_date DESC
  `);
    return result.rows;
}
exports.getRetiredAssociates = getRetiredAssociates;
// Obtener historial de un asociado retirado
async function getRetiredAssociateHistory(retiredAssociateId) {
    const result = await (0, db_1.query)(`
    SELECT * FROM retired_associate_supply_history 
    WHERE retired_associate_id = $1 
    ORDER BY delivered_at DESC
  `, [retiredAssociateId]);
    return result.rows;
}
exports.getRetiredAssociateHistory = getRetiredAssociateHistory;
// Buscar asociado retirado por cédula
async function findRetiredAssociateByCedula(cedula) {
    const result = await (0, db_1.query)('SELECT * FROM retired_associates WHERE cedula = $1', [cedula]);
    return result.rows[0] || null;
}
exports.findRetiredAssociateByCedula = findRetiredAssociateByCedula;
// Obtener estadísticas de asociados retirados
async function getRetiredAssociatesStats() {
    const totalResult = await (0, db_1.query)('SELECT COUNT(*) as total FROM retired_associates');
    const byMonthResult = await (0, db_1.query)(`
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
exports.getRetiredAssociatesStats = getRetiredAssociatesStats;
//# sourceMappingURL=retiredAssociatesService.js.map