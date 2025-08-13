"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = void 0;
// db.ts - Configuración de conexión a PostgreSQL (Neon)
const pg_1 = require("pg");
// Configuración de conexión a la base de datos Neon
const pool = new pg_1.Pool({
    connectionString: process.env["DATABASE_URL"],
    ssl: {
        rejectUnauthorized: false // Necesario para conexiones a Neon desde Render
    }
});
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