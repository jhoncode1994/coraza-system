"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.createUser = exports.getUserById = exports.getAllUsers = void 0;
// userService.ts - Lógica de negocio para usuarios
const db_1 = require("./db");
// Obtener todos los usuarios
async function getAllUsers() {
    const result = await (0, db_1.query)('SELECT * FROM usuarios ORDER BY id');
    return result.rows;
}
exports.getAllUsers = getAllUsers;
// Obtener un usuario por ID
async function getUserById(id) {
    const result = await (0, db_1.query)('SELECT * FROM usuarios WHERE id = $1', [id]);
    return result.rows[0];
}
exports.getUserById = getUserById;
// Crear un nuevo usuario
async function createUser(user) {
    const { nombre, apellido, cedula, zona, fecha_ingreso } = user;
    const result = await (0, db_1.query)('INSERT INTO usuarios (nombre, apellido, cedula, zona, fecha_ingreso) VALUES ($1, $2, $3, $4, $5) RETURNING *', [nombre, apellido, cedula, zona, fecha_ingreso]);
    return result.rows[0];
}
exports.createUser = createUser;
// Actualizar un usuario existente
async function updateUser(id, user) {
    // Construir dinámicamente la consulta SQL según los campos proporcionados
    const setStatements = [];
    const values = [];
    let paramIndex = 1;
    for (const [key, value] of Object.entries(user)) {
        if (value !== undefined) {
            setStatements.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
        }
    }
    if (setStatements.length === 0) {
        return null; // No hay nada que actualizar
    }
    values.push(id);
    const result = await (0, db_1.query)(`UPDATE usuarios SET ${setStatements.join(', ')} WHERE id = $${paramIndex} RETURNING *`, values);
    return result.rows[0];
}
exports.updateUser = updateUser;
// Eliminar un usuario
async function deleteUser(id) {
    const result = await (0, db_1.query)('DELETE FROM usuarios WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
}
exports.deleteUser = deleteUser;
//# sourceMappingURL=userService.js.map