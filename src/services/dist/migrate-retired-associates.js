"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRetiredAssociatesTables = void 0;
// migrate-retired-associates.ts - Script para aplicar las migraciones de asociados retirados
const dotenv_1 = require("dotenv");
dotenv_1.default.config();
const db_1 = require("./db");
async function createRetiredAssociatesTables() {
    console.log('🚀 Iniciando migración de asociados retirados...');
    try {
        // Crear tabla de asociados retirados
        await (0, db_1.query)(`
      CREATE TABLE IF NOT EXISTS retired_associates (
        id SERIAL PRIMARY KEY,
        associate_id INTEGER NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        apellido VARCHAR(100) NOT NULL,
        cedula VARCHAR(20) UNIQUE NOT NULL,
        zona INTEGER NOT NULL,
        telefono VARCHAR(20),
        email VARCHAR(100),
        retired_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        retired_reason TEXT,
        retired_by INTEGER,
        original_creation_date TIMESTAMP
      );
    `);
        console.log('✅ Tabla retired_associates creada');
        // Crear índices para retired_associates
        await (0, db_1.query)('CREATE INDEX IF NOT EXISTS idx_retired_associates_cedula ON retired_associates(cedula);');
        await (0, db_1.query)('CREATE INDEX IF NOT EXISTS idx_retired_associates_zone ON retired_associates(zona);');
        await (0, db_1.query)('CREATE INDEX IF NOT EXISTS idx_retired_associates_date ON retired_associates(retired_date);');
        console.log('✅ Índices de retired_associates creados');
        // Crear tabla de historial de dotaciones para retirados
        await (0, db_1.query)(`
      CREATE TABLE IF NOT EXISTS retired_associate_supply_history (
        id SERIAL PRIMARY KEY,
        retired_associate_id INTEGER NOT NULL,
        original_delivery_id INTEGER,
        elemento VARCHAR(200) NOT NULL,
        cantidad INTEGER NOT NULL,
        delivered_at TIMESTAMP,
        signature_data TEXT,
        observaciones TEXT,
        retired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (retired_associate_id) REFERENCES retired_associates(id) ON DELETE CASCADE
      );
    `);
        console.log('✅ Tabla retired_associate_supply_history creada');
        // Crear índices para el historial
        await (0, db_1.query)('CREATE INDEX IF NOT EXISTS idx_retired_history_associate ON retired_associate_supply_history(retired_associate_id);');
        await (0, db_1.query)('CREATE INDEX IF NOT EXISTS idx_retired_history_date ON retired_associate_supply_history(delivered_at);');
        console.log('✅ Índices de retired_associate_supply_history creados');
        // Verificar que las tablas se crearon correctamente
        const retiredAssociatesCheck = await (0, db_1.query)('SELECT COUNT(*) as count FROM retired_associates;');
        const retiredHistoryCheck = await (0, db_1.query)('SELECT COUNT(*) as count FROM retired_associate_supply_history;');
        console.log('📊 Verificación de tablas:');
        console.log(`   - retired_associates: ${retiredAssociatesCheck.rows[0].count} registros`);
        console.log(`   - retired_associate_supply_history: ${retiredHistoryCheck.rows[0].count} registros`);
        console.log('🎉 ¡Migración completada exitosamente!');
    }
    catch (error) {
        console.error('❌ Error durante la migración:', error);
        throw error;
    }
}
exports.createRetiredAssociatesTables = createRetiredAssociatesTables;
// Ejecutar la migración si este archivo se ejecuta directamente
if (require.main === module) {
    createRetiredAssociatesTables()
        .then(() => {
        console.log('✨ Proceso de migración terminado');
        process.exit(0);
    })
        .catch((error) => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });
}
