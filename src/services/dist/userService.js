"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserById = exports.getAllUsers = void 0;
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
