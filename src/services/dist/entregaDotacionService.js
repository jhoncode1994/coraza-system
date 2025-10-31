"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEntregaConTallas = exports.deleteEntrega = exports.updateEntrega = exports.createEntrega = exports.getEntregasByUser = exports.getAllEntregas = void 0;
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
async function createEntregaConTallas(entrega) {
    const pool = (0, db_1.getPool)();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        console.log('📦 Creando entrega con tallas:', JSON.stringify(entrega, null, 2));
        const fechaEntrega = new Date();
        const insertedRows = [];
        // Insertar cada elemento como un registro separado
        for (const elemento of entrega.elementos) {
            console.log('  🔹 Procesando elemento:', elemento);
            const elementoStr = elemento.talla
                ? `${elemento.categoria} - Talla ${elemento.talla}`
                : elemento.categoria;
            console.log('  📝 Insertando en entrega_dotacion:', elementoStr);
            const result = await client.query(`INSERT INTO entrega_dotacion ("userId", elemento, cantidad, "fechaEntrega", observaciones, "firma_url")
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`, [
                entrega.userId,
                elementoStr,
                elemento.cantidad,
                fechaEntrega,
                entrega.observaciones || '',
                entrega.firma_url || ''
            ]);
            insertedRows.push(result.rows[0]);
            console.log('  ✅ Registro de entrega creado:', result.rows[0].id);
            // Actualizar el stock del elemento
            if (elemento.talla) {
                console.log('  🔍 Buscando stock para:', {
                    name: elemento.categoria,
                    category: elemento.categoriaOriginal,
                    talla: elemento.talla,
                    tallaType: typeof elemento.talla
                });
                // Buscar el código del elemento con esa talla
                const stockResult = await client.query(`SELECT code, quantity FROM supply WHERE name = $1 AND category = $2 AND talla = $3`, [elemento.categoria, elemento.categoriaOriginal, elemento.talla]);
                console.log('  📊 Resultados de búsqueda:', stockResult.rows);
                if (stockResult.rows.length > 0) {
                    const code = stockResult.rows[0].code;
                    const currentQty = stockResult.rows[0].quantity;
                    console.log(`  📦 Stock actual: ${currentQty}, descontando: ${elemento.cantidad}`);
                    await client.query(`UPDATE supply SET quantity = quantity - $1 WHERE code = $2`, [elemento.cantidad, code]);
                    console.log(`  ✅ Stock actualizado para código: ${code}`);
                }
                else {
                    console.log('  ⚠️ No se encontró item con esa talla en supply');
                }
            }
            else {
                // Sin talla, actualizar todos los items de esa categoría proporcionalmente
                await client.query(`UPDATE supply SET quantity = quantity - $1 
           WHERE name = $2 AND category = $3`, [elemento.cantidad, elemento.categoria, elemento.categoriaOriginal]);
            }
        }
        await client.query('COMMIT');
        client.release();
        console.log('✅ Entrega completada exitosamente');
        return insertedRows;
    }
    catch (error) {
        console.error('❌ Error en createEntregaConTallas:', error);
        console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
        await client.query('ROLLBACK');
        client.release();
        throw error;
    }
}
exports.createEntregaConTallas = createEntregaConTallas;
//# sourceMappingURL=entregaDotacionService.js.map