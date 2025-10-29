// agregar-genero-inventory.js - Agregar género a supply_inventory
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function agregarGenero() {
  console.log('🔧 Agregando soporte de género para botas...\n');
  
  try {
    // 1. Agregar columna género
    console.log('1️⃣ Agregando columna genero a supply_inventory...');
    await pool.query(`
      ALTER TABLE supply_inventory 
      ADD COLUMN IF NOT EXISTS genero VARCHAR(1) CHECK (genero IN ('M', 'F', NULL));
    `);
    console.log('✅ Columna genero agregada');

    // 2. Crear índice
    console.log('2️⃣ Creando índice...');
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_inventory_genero ON supply_inventory(genero);`);
    console.log('✅ Índice creado');

    // 3. Agregar columna género a entrega_dotacion
    console.log('3️⃣ Agregando genero a entrega_dotacion...');
    await pool.query(`
      ALTER TABLE entrega_dotacion 
      ADD COLUMN IF NOT EXISTS genero_talla VARCHAR(1) CHECK (genero_talla IN ('M', 'F', NULL));
    `);
    console.log('✅ Columna genero_talla agregada a entrega_dotacion');

    // 4. Obtener botas actuales
    console.log('4️⃣ Identificando botas...');
    const botasResult = await pool.query(`
      SELECT id, code, name, talla, category
      FROM supply_inventory 
      WHERE category = 'calzado' 
      AND (UPPER(name) LIKE '%BOTA%' OR UPPER(code) LIKE '%BOT%')
      ORDER BY code, talla;
    `);
    
    console.log(`📦 Encontradas ${botasResult.rows.length} botas:`);
    console.table(botasResult.rows);

    // 5. Asignar género a botas existentes (según talla)
    console.log('\n5️⃣ Asignando género a botas existentes...');
    
    // Tallas 34-39 = Femeninas
    const updateF = await pool.query(`
      UPDATE supply_inventory 
      SET genero = 'F'
      WHERE genero IS NULL 
      AND category = 'calzado'
      AND (UPPER(name) LIKE '%BOTA%' OR UPPER(code) LIKE '%BOT%')
      AND talla IN ('34', '35', '36', '37', '38', '39');
    `);
    console.log(`   ✅ ${updateF.rowCount} botas marcadas como Femeninas (34-39)`);
    
    // Tallas 40+ = Masculinas
    const updateM = await pool.query(`
      UPDATE supply_inventory 
      SET genero = 'M'
      WHERE genero IS NULL 
      AND category = 'calzado'
      AND (UPPER(name) LIKE '%BOTA%' OR UPPER(code) LIKE '%BOT%')
      AND talla::INTEGER >= 40;
    `);
    console.log(`   ✅ ${updateM.rowCount} botas marcadas como Masculinas (40+)`);

    // 6. Verificar si existen tallas 34 y 35
    console.log('\n6️⃣ Verificando tallas 34 y 35...');
    const tallas3435 = await pool.query(`
      SELECT talla, genero, COUNT(*) as cantidad
      FROM supply_inventory 
      WHERE category = 'calzado'
      AND (UPPER(name) LIKE '%BOTA%' OR UPPER(code) LIKE '%BOT%')
      AND talla IN ('34', '35')
      GROUP BY talla, genero
      ORDER BY talla, genero;
    `);

    if (tallas3435.rows.length === 0) {
      console.log('⚠️ No existen botas talla 34 y 35. Creándolas...');
      
      // Obtener código base de botas
      const codigoBase = await pool.query(`
        SELECT DISTINCT SUBSTRING(code FROM '^[A-Z]+[0-9]+') as base_code
        FROM supply_inventory 
        WHERE category = 'calzado'
        AND (UPPER(name) LIKE '%BOTA%' OR UPPER(code) LIKE '%BOT%')
        LIMIT 1;
      `);

      if (codigoBase.rows.length > 0) {
        const base = codigoBase.rows[0].base_code || 'BOT001';
        
        // Crear tallas 34 y 35 (M y F)
        const tallasNuevas = [
          { talla: '34', genero: 'F', code: `${base}-34F` },
          { talla: '34', genero: 'M', code: `${base}-34M` },
          { talla: '35', genero: 'F', code: `${base}-35F` },
          { talla: '35', genero: 'M', code: `${base}-35M` }
        ];

        for (const t of tallasNuevas) {
          await pool.query(`
            INSERT INTO supply_inventory (code, name, category, quantity, minimum_quantity, talla, genero, description)
            VALUES ($1, 'Botas', 'calzado', 0, 5, $2, $3, $4)
            ON CONFLICT (code) DO NOTHING;
          `, [
            t.code,
            t.talla,
            t.genero,
            `Botas para dotación de personal - Talla ${t.talla} ${t.genero === 'F' ? 'Mujer' : 'Hombre'}`
          ]);
          console.log(`   ✅ Creada: ${t.code} - Talla ${t.talla} ${t.genero === 'F' ? 'Mujer' : 'Hombre'}`);
        }
      }
    } else {
      console.log('✅ Ya existen tallas 34 y/o 35:');
      console.table(tallas3435.rows);
    }

    // 7. Verificar resultados finales
    console.log('\n📊 Verificando resultados finales...');
    const verificacion = await pool.query(`
      SELECT 
        code,
        name,
        talla,
        genero,
        CASE 
          WHEN genero = 'F' THEN 'Mujer'
          WHEN genero = 'M' THEN 'Hombre'
          ELSE 'Sin género'
        END as tipo,
        quantity as stock
      FROM supply_inventory
      WHERE category = 'calzado'
      AND (UPPER(name) LIKE '%BOTA%' OR UPPER(code) LIKE '%BOT%')
      ORDER BY 
        CASE WHEN genero = 'F' THEN 1 ELSE 2 END,
        talla::INTEGER;
    `);

    console.log('\n📋 BOTAS CON GÉNERO:');
    console.table(verificacion.rows);

    console.log('\n✅ ¡Proceso completado!');
    console.log('🎯 Resumen:');
    console.log(`   - ${verificacion.rows.filter(r => r.genero === 'F').length} botas femeninas`);
    console.log(`   - ${verificacion.rows.filter(r => r.genero === 'M').length} botas masculinas`);
    console.log('   - Listo para usar en formularios con selector M/F');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

agregarGenero();