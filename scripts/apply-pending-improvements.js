// ============================================================
// SCRIPT DE MEJORAS - CORAZA SYSTEM
// Ejecutar: node scripts/apply-pending-improvements.js
// Fecha: 26 de Enero 2026
// ============================================================

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function applyImprovements() {
  const client = await pool.connect();
  
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║        🚀 APLICANDO MEJORAS - CORAZA SYSTEM                    ║');
  console.log('║        Fecha: ' + new Date().toLocaleString('es-CO').padEnd(44) + '║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  try {
    // ============================================================
    // 1. CREAR ÍNDICES FALTANTES
    // ============================================================
    console.log('┌────────────────────────────────────────────────────────────────┐');
    console.log('│ 1️⃣  CREANDO ÍNDICES DE BASE DE DATOS                           │');
    console.log('└────────────────────────────────────────────────────────────────┘');

    const indexes = [
      {
        name: 'idx_entrega_dotacion_userid',
        sql: 'CREATE INDEX IF NOT EXISTS idx_entrega_dotacion_userid ON entrega_dotacion("userId")',
        desc: 'Acelera búsqueda de entregas por asociado'
      },
      {
        name: 'idx_supply_inventory_code_unique',
        sql: 'CREATE INDEX IF NOT EXISTS idx_supply_inventory_code_unique ON supply_inventory(code)',
        desc: 'Acelera búsqueda por código de producto'
      },
      {
        name: 'idx_supply_inventory_category_filter',
        sql: 'CREATE INDEX IF NOT EXISTS idx_supply_inventory_category_filter ON supply_inventory(category)',
        desc: 'Acelera filtros por categoría'
      },
      {
        name: 'idx_inventory_movements_supply_id',
        sql: 'CREATE INDEX IF NOT EXISTS idx_inventory_movements_supply_id ON inventory_movements(supply_id)',
        desc: 'Acelera historial de movimientos por producto'
      },
      {
        name: 'idx_inventory_movements_created_at',
        sql: 'CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON inventory_movements(created_at DESC)',
        desc: 'Acelera filtros por fecha de movimiento'
      }
    ];

    for (const idx of indexes) {
      try {
        await client.query(idx.sql);
        console.log(`   ✅ ${idx.name}`);
        console.log(`      └─ ${idx.desc}`);
      } catch (e) {
        console.log(`   ⚠️ ${idx.name}: ${e.message}`);
      }
    }

    // ============================================================
    // 2. AGREGAR COLUMNAS A USERS (Opcional)
    // ============================================================
    console.log('\n┌────────────────────────────────────────────────────────────────┐');
    console.log('│ 2️⃣  AGREGANDO COLUMNAS A TABLA USERS                           │');
    console.log('└────────────────────────────────────────────────────────────────┘');

    const columns = [
      {
        name: 'estado',
        sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'activo'",
        desc: 'Estado del asociado (activo/inactivo/licencia)'
      },
      {
        name: 'email',
        sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255)',
        desc: 'Email de contacto del asociado'
      },
      {
        name: 'telefono',
        sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS telefono VARCHAR(20)',
        desc: 'Teléfono de contacto del asociado'
      }
    ];

    for (const col of columns) {
      try {
        await client.query(col.sql);
        console.log(`   ✅ Columna '${col.name}' agregada`);
        console.log(`      └─ ${col.desc}`);
      } catch (e) {
        if (e.message.includes('already exists')) {
          console.log(`   ℹ️ Columna '${col.name}' ya existe`);
        } else {
          console.log(`   ⚠️ Columna '${col.name}': ${e.message}`);
        }
      }
    }

    // ============================================================
    // 3. VERIFICAR RESULTADOS
    // ============================================================
    console.log('\n┌────────────────────────────────────────────────────────────────┐');
    console.log('│ 3️⃣  VERIFICANDO RESULTADOS                                     │');
    console.log('└────────────────────────────────────────────────────────────────┘');

    // Contar índices
    const indexCount = await client.query(`
      SELECT COUNT(*) as total FROM pg_indexes 
      WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
    `);
    console.log(`   📊 Total índices personalizados: ${indexCount.rows[0].total}`);

    // Verificar columnas de users
    const userCols = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name IN ('estado', 'email', 'telefono')
    `);
    console.log(`   📊 Columnas nuevas en users: ${userCols.rows.map(c => c.column_name).join(', ') || 'ninguna'}`);

    // ============================================================
    // RESUMEN
    // ============================================================
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                    ✅ MEJORAS APLICADAS                         ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log('║  • 5 índices de rendimiento creados                            ║');
    console.log('║  • 3 columnas agregadas a tabla users                          ║');
    console.log('║  • Base de datos optimizada                                    ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

// Confirmación antes de ejecutar
console.log('\n⚠️  ATENCIÓN: Este script modificará la base de datos de producción.');
console.log('   Asegúrate de ejecutarlo en horario no productivo.\n');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('¿Deseas continuar? (s/n): ', (answer) => {
  if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'si') {
    applyImprovements().then(() => {
      rl.close();
      process.exit(0);
    });
  } else {
    console.log('\n❌ Operación cancelada.\n');
    rl.close();
    process.exit(0);
  }
});
