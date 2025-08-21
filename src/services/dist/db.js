"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = void 0;
// db.ts - Configuración de conexión a PostgreSQL (Neon)
const pg_1 = require("pg");
const pool = new pg_1.Pool({
    connectionString: process.env["DATABASE_URL"],
    ssl: process.env["NODE_ENV"] === 'production' ? { rejectUnauthorized: false } : false
});
const query = (text, params) => pool.query(text, params);
exports.query = query;
//# sourceMappingURL=db.js.map