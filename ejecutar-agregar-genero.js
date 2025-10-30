// ejecutar-agregar-genero.js - Ejecutar script SQL en Neon
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function agregarGeneroTallas() {
  console.log('🔧 Agregando soporte de género a tallas de botas...\n');
  
  try {
    // 1. Agregar columna de género a tallas_disponibles
    console.log('1️⃣ Agregando columna género a tallas_disponibles...');
    await pool.query(`
      ALTER TABLE tallas_disponibles 
      ADD COLUMN IF NOT EXISTS genero VARCHAR(1) CHECK (genero IN ('M', 'F', NULL));
    `);
    console.log('✅ Columna genero agregada a tallas_disponibles');

    // 2. Agregar columna de género a entrega_dotacion
    console.log('2️⃣ Agregando columna género a entrega_dotacion...');
    await pool.query(`
      ALTER TABLE entrega_dotacion 
      ADD COLUMN IF NOT EXISTS genero_talla VARCHAR(1) CHECK (genero_talla IN ('M', 'F', NULL));
    `);
    console.log('✅ Columna genero_talla agregada a entrega_dotacion');

    // 3. Crear índices
    console.log('3️⃣ Creando índices...');
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tallas_genero ON tallas_disponibles(genero);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_entrega_genero ON entrega_dotacion(genero_talla);`);
    console.log('✅ Índices creados');

    // 4. Obtener todas las botas
    console.log('4️⃣ Identificando botas en el inventario...');
    const botasResult = await pool.query(`
      SELECT id, codigo, nombre 
      FROM supply_inventory 
      WHERE UPPER(codigo) LIKE '%BOTA%' OR UPPER(nombre) LIKE '%BOTA%'
    `);
    console.log(`📦 Encontradas ${botasResult.rows.length} botas`);

    // 5. Agregar tallas 34 y 35 para cada bota
    console.log('5️⃣ Agregando tallas 34 y 35 con género...');
    for (const bota of botasResult.rows) {
      // Talla 34 Femenina
      await pool.query(`
        INSERT INTO tallas_disponibles (inventario_id, talla, cantidad, genero)
        VALUES ($1, '34', 0, 'F')
        ON CONFLICT (inventario_id, talla, COALESCE(genero, '')) DO NOTHING;
      `, [bota.id]);

      // Talla 34 Masculina
      await pool.query(`
        INSERT INTO tallas_disponibles (inventario_id, talla, cantidad, genero)
        VALUES ($1, '34', 0, 'M')
        ON CONFLICT (inventario_id, talla, COALESCE(genero, '')) DO NOTHING;
      `, [bota.id]);

      // Talla 35 Femenina
      await pool.query(`
        INSERT INTO tallas_disponibles (inventario_id, talla, cantidad, genero)
        VALUES ($1, '35', 0, 'F')
        ON CONFLICT (inventario_id, talla, COALESCE(genero, '')) DO NOTHING;
      `, [bota.id]);

      // Talla 35 Masculina
      await pool.query(`
        INSERT INTO tallas_disponibles (inventario_id, talla, cantidad, genero)
        VALUES ($1, '35', 0, 'M')
        ON CONFLICT (inventario_id, talla, COALESCE(genero, '')) DO NOTHING;
      `, [bota.id]);

      console.log(`  ✅ Tallas 34-35 (M/F) agregadas para: ${bota.codigo}`);
    }

    // 6. Asignar género a tallas existentes
    console.log('6️⃣ Asignando género a tallas existentes...');
    
    // Tallas pequeñas = Femeninas
    await pool.query(`
      UPDATE tallas_disponibles 
      SET genero = 'F'
      WHERE genero IS NULL 
      AND talla IN ('34', '35', '36', '37', '38', '39')
      AND inventario_id IN (
        SELECT id FROM supply_inventory 
        WHERE UPPER(codigo) LIKE '%BOTA%' OR UPPER(nombre) LIKE '%BOTA%'
      );
    `);
    
    // Tallas grandes = Masculinas
    await pool.query(`
      UPDATE tallas_disponibles 
      SET genero = 'M'
      WHERE genero IS NULL 
      AND talla::INTEGER >= 40
      AND inventario_id IN (
        SELECT id FROM supply_inventory 
        WHERE UPPER(codigo) LIKE '%BOTA%' OR UPPER(nombre) LIKE '%BOTA%'
      );
    `);
    console.log('✅ Género asignado a tallas existentes');

    // 7. Verificar resultados
    console.log('\n📊 Verificando resultados...');
    const verificacion = await pool.query(`
      SELECT 
        si.codigo,
        si.nombre,
        td.talla,
        td.genero,
        td.cantidad
      FROM tallas_disponibles td
      JOIN supply_inventory si ON td.inventario_id = si.id
      WHERE UPPER(si.codigo) LIKE '%BOTA%' OR UPPER(si.nombre) LIKE '%BOTA%'
      ORDER BY si.codigo, 
               CASE WHEN td.genero = 'F' THEN 1 ELSE 2 END,
               td.talla::INTEGER;
    `);

    console.log('\n📋 Tallas de botas con género:');
    console.table(verificacion.rows);

    console.log('\n✅ ¡Proceso completado exitosamente!');
    console.log('🎯 Ahora las botas tienen:');
    console.log('   - Tallas desde 34 (incluidas 34 y 35)');
    console.log('   - Género M (Masculino) y F (Femenino) separados');
    console.log('   - Listo para seleccionar en inventario y entregas');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

agregarGeneroTallas();