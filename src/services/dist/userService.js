"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUser = exports.createUser = exports.getUserById = exports.getAllUsers = void 0;
// userService.ts - Ejemplo de lógica de negocio para usuarios
const db_1 = require("./db");
async function getAllUsers() {
    const result = await (0, db_1.query)('SELECT * FROM users');
    return result.rows;
}
exports.getAllUsers = getAllUsers;
async function getUserById(id) {
    const result = await (0, db_1.query)('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
}
exports.getUserById = getUserById;
// Agrega aquí más funciones de negocio según tus necesidades
async function createUser(user) {
    const result = await (0, db_1.query)(`INSERT INTO users (nombre, apellido, cedula, zona, cargo, fecha_ingreso)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`, [
        user.nombre,
        user.apellido,
        user.cedula,
        user.zona,
        user.cargo,
        user.fecha_ingreso || new Date().toISOString().split('T')[0]
    ]);
    return result.rows[0];
}
exports.createUser = createUser;
async function updateUser(id, user) {
    const result = await (0, db_1.query)(`UPDATE users SET nombre = $1, apellido = $2, cedula = $3, zona = $4, cargo = $5, fecha_ingreso = $6 WHERE id = $7 RETURNING *`, [
        user.nombre,
        user.apellido,
        user.cedula,
        user.zona,
        user.cargo,
        user.fecha_ingreso || new Date().toISOString().split('T')[0],
        id
    ]);
    return result.rows[0];
}
exports.updateUser = updateUser;
//# sourceMappingURL=userService.js.map