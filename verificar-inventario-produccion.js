// Verificar inventario en producción
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function verificarInventario() {
  console.log('🔍 Verificando inventario en producción...\n');
  
  try {
    // Contar total
    const total = await pool.query('SELECT COUNT(*) as total FROM supply_inventory;');
    console.log(`📦 Total de elementos en base de datos: ${total.rows[0].total}\n`);

    // Contar por categoría y género
    const porCategoria = await pool.query(`
      SELECT 
        name,
        genero,
        COUNT(*) as cantidad,
        MIN(talla) as talla_min,
        MAX(talla) as talla_max
      FROM supply_inventory
      GROUP BY name, genero
      ORDER BY name, genero;
    `);

    console.log('📊 RESUMEN POR CATEGORÍA Y GÉNERO:');
    console.table(porCategoria.rows);

    // Verificar botas específicamente
    console.log('\n🥾 VERIFICANDO BOTAS:');
    const botas = await pool.query(`
      SELECT code, name, talla, genero, quantity,
             CASE 
               WHEN genero = 'F' THEN 'Mujer'
               WHEN genero = 'M' THEN 'Hombre'
               ELSE 'N/A'
             END as tipo
      FROM supply_inventory
      WHERE name = 'Botas'
      ORDER BY genero, CAST(talla AS INTEGER);
    `);

    console.table(botas.rows);
    console.log(`Total de botas: ${botas.rows.length}`);

    // Buscar específicamente botas talla 45 hombre
    const bota45 = await pool.query(`
      SELECT * FROM supply_inventory
      WHERE name = 'Botas' AND talla = '45' AND genero = 'M';
    `);

    console.log('\n🔎 BOTAS TALLA 45 HOMBRE:');
    if (bota45.rows.length === 0) {
      console.log('❌ NO ENCONTRADA en base de datos');
    } else {
      console.table(bota45.rows);
    }

    // Verificar si hay elementos con códigos duplicados
    console.log('\n🔍 Verificando códigos duplicados:');
    const duplicados = await pool.query(`
      SELECT code, COUNT(*) as veces
      FROM supply_inventory
      GROUP BY code
      HAVING COUNT(*) > 1;
    `);

    if (duplicados.rows.length === 0) {
      console.log('✅ No hay códigos duplicados');
    } else {
      console.log('⚠️ CÓDIGOS DUPLICADOS ENCONTRADOS:');
      console.table(duplicados.rows);
    }

    // Mostrar todos los elementos
    console.log('\n📋 TODOS LOS ELEMENTOS EN BASE DE DATOS:');
    const todos = await pool.query(`
      SELECT id, code, name, talla, genero, quantity
      FROM supply_inventory
      ORDER BY name, genero, CAST(talla AS INTEGER) NULLS LAST;
    `);
    console.table(todos.rows);

    // Calcular cuántos deberían existir
    console.log('\n📊 COMPARACIÓN CON LO ESPERADO:');
    console.log('Esperados:');
    console.log('  - Pantalones Mujer (6-16):  6 elementos');
    console.log('  - Pantalones Hombre (28-50): 12 elementos');
    console.log('  - Camisas Mujer (6-16):     6 elementos');
    console.log('  - Camisas Hombre (28-50):   12 elementos');
    console.log('  - Overoles (28-50):         12 elementos');
    console.log('  - Botas Mujer (34-39):      6 elementos');
    console.log('  - Botas Hombre (34-45):     12 elementos');
    console.log('  - Accesorios:               7 elementos');
    console.log('  TOTAL ESPERADO:             73 elementos');
    console.log(`\n  TOTAL EN BD:                ${total.rows[0].total} elementos`);
    console.log(`  DIFERENCIA:                 ${73 - total.rows[0].total} elementos faltantes`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

verificarInventario();
