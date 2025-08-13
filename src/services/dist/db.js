"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = void 0;
const tslib_1 = require("tslib");
// db.ts - Configuración de conexión a PostgreSQL (Neon)
const pg_1 = require("pg");
const dotenv = tslib_1.__importStar(require("dotenv"));
// Cargar variables de entorno desde .env
dotenv.config();
// Configuración de conexión a la base de datos
let poolConfig = {
    host: process.env["PGHOST"],
    database: process.env["PGDATABASE"],
    user: process.env["PGUSER"],
    password: process.env["PGPASSWORD"],
    port: 5432,
    ssl: true
};
// Configurar SSL y channel binding según variables de entorno
if (process.env["PGSSLMODE"] === 'require') {
    poolConfig.ssl = {
        rejectUnauthorized: false
    };
}
if (process.env["PGCHANNELBINDING"] === 'require') {
    // Asegurarse que el SSL está configurado correctamente
    poolConfig.ssl = poolConfig.ssl || {};
    poolConfig.ssl.rejectUnauthorized = false;
}
const pool = new pg_1.Pool(poolConfig);
// Verificar la conexión al iniciar
pool.connect()
    .then(() => console.log('Conexión a la base de datos PostgreSQL establecida correctamente'))
    .catch((err) => console.error('Error al conectar a PostgreSQL:', err));
// Función para ejecutar queries
const query = async (text, params) => {
    try {
        const result = await pool.query(text, params);
        return result;
    }
    catch (error) {
        console.error('Error ejecutando query:', text);
        console.error('Parámetros:', params);
        console.error('Error:', error);
        throw error;
    }
};
exports.query = query;
//# sourceMappingURL=db.js.map