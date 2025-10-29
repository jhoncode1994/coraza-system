// crear-inventario-completo.js - Crear inventario con tallas numéricas y género
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function crearInventarioCompleto() {
  console.log('🔧 Creando inventario completo con tallas numéricas y género...\n');
  
  try {
    // 1. VACIAR INVENTARIO ACTUAL
    console.log('1️⃣ Vaciando inventario actual...');
    
    // Primero borrar movimientos de inventario
    await pool.query('DELETE FROM inventory_movements;');
    console.log('  ✅ Movimientos de inventario eliminados');
    
    // Luego borrar entregas de dotación
    await pool.query('DELETE FROM entrega_dotacion;');
    console.log('  ✅ Entregas de dotación eliminadas');
    
    // Finalmente borrar inventario
    await pool.query('DELETE FROM supply_inventory;');
    console.log('✅ Inventario vaciado completamente');

    // 2. CREAR PANTALONES CON GÉNERO
    console.log('\n2️⃣ Creando pantalones con género...');
    
    // Pantalones MUJER (tallas 6-16 pares)
    const tallasPantalonF = [6, 8, 10, 12, 14, 16];
    for (const talla of tallasPantalonF) {
      await pool.query(`
        INSERT INTO supply_inventory (code, name, category, quantity, minimum_quantity, talla, genero, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, [
        `PAN001-${talla}F`,
        'Pantalón',
        'uniforme',
        0,
        5,
        talla.toString(),
        'F',
        `Pantalón para dotación - Talla ${talla} Mujer`
      ]);
    }
    console.log(`✅ ${tallasPantalonF.length} pantalones mujer creados (6-16)`);

    // Pantalones HOMBRE (tallas 28-50 pares)
    const tallasPantalonM = [];
    for (let t = 28; t <= 50; t += 2) {
      tallasPantalonM.push(t);
    }
    for (const talla of tallasPantalonM) {
      await pool.query(`
        INSERT INTO supply_inventory (code, name, category, quantity, minimum_quantity, talla, genero, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, [
        `PAN001-${talla}M`,
        'Pantalón',
        'uniforme',
        0,
        5,
        talla.toString(),
        'M',
        `Pantalón para dotación - Talla ${talla} Hombre`
      ]);
    }
    console.log(`✅ ${tallasPantalonM.length} pantalones hombre creados (28-50)`);

    // 3. CREAR CAMISAS CON GÉNERO
    console.log('\n3️⃣ Creando camisas con género...');
    
    // Camisas MUJER (tallas 6-16 pares)
    const tallasCamisaF = [6, 8, 10, 12, 14, 16];
    for (const talla of tallasCamisaF) {
      await pool.query(`
        INSERT INTO supply_inventory (code, name, category, quantity, minimum_quantity, talla, genero, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, [
        `CAM001-${talla}F`,
        'Camisa',
        'uniforme',
        0,
        5,
        talla.toString(),
        'F',
        `Camisa para dotación - Talla ${talla} Mujer`
      ]);
    }
    console.log(`✅ ${tallasCamisaF.length} camisas mujer creadas (6-16)`);

    // Camisas HOMBRE (tallas 28-50 pares)
    const tallasCamisaM = [];
    for (let t = 28; t <= 50; t += 2) {
      tallasCamisaM.push(t);
    }
    for (const talla of tallasCamisaM) {
      await pool.query(`
        INSERT INTO supply_inventory (code, name, category, quantity, minimum_quantity, talla, genero, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, [
        `CAM001-${talla}M`,
        'Camisa',
        'uniforme',
        0,
        5,
        talla.toString(),
        'M',
        `Camisa para dotación - Talla ${talla} Hombre`
      ]);
    }
    console.log(`✅ ${tallasCamisaM.length} camisas hombre creadas (28-50)`);

    // 4. CREAR OVEROLES SIN GÉNERO
    console.log('\n4️⃣ Creando overoles sin género...');
    
    const tallasOverol = [];
    for (let t = 28; t <= 50; t += 2) {
      tallasOverol.push(t);
    }
    for (const talla of tallasOverol) {
      await pool.query(`
        INSERT INTO supply_inventory (code, name, category, quantity, minimum_quantity, talla, genero, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, [
        `OVE001-${talla}`,
        'Overol',
        'uniforme',
        0,
        5,
        talla.toString(),
        null,
        `Overol para dotación - Talla ${talla}`
      ]);
    }
    console.log(`✅ ${tallasOverol.length} overoles creados (28-50)`);

    // 5. CREAR BOTAS CON GÉNERO
    console.log('\n5️⃣ Creando botas con género...');
    
    // Botas MUJER (34-39)
    const tallasBotasF = [34, 35, 36, 37, 38, 39];
    for (const talla of tallasBotasF) {
      await pool.query(`
        INSERT INTO supply_inventory (code, name, category, quantity, minimum_quantity, talla, genero, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, [
        `BOT001-${talla}F`,
        'Botas',
        'calzado',
        0,
        5,
        talla.toString(),
        'F',
        `Botas para dotación - Talla ${talla} Mujer`
      ]);
    }
    console.log(`✅ ${tallasBotasF.length} botas mujer creadas (34-39)`);

    // Botas HOMBRE (34-45)
    const tallasBotasM = [];
    for (let t = 34; t <= 45; t++) {
      tallasBotasM.push(t);
    }
    for (const talla of tallasBotasM) {
      await pool.query(`
        INSERT INTO supply_inventory (code, name, category, quantity, minimum_quantity, talla, genero, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, [
        `BOT001-${talla}M`,
        'Botas',
        'calzado',
        0,
        5,
        talla.toString(),
        'M',
        `Botas para dotación - Talla ${talla} Hombre`
      ]);
    }
    console.log(`✅ ${tallasBotasM.length} botas hombre creadas (34-45)`);

    // 6. CREAR ACCESORIOS SIN TALLA NI GÉNERO
    console.log('\n6️⃣ Creando accesorios...');
    
    const accesorios = [
      { code: 'COR001', name: 'Corbata', category: 'accesorios', desc: 'Corbata para uniforme' },
      { code: 'APE001', name: 'Apellido', category: 'accesorios', desc: 'Placa con apellido' },
      { code: 'CIN001', name: 'Cinturón', category: 'accesorios', desc: 'Cinturón para uniforme' },
      { code: 'KEP001', name: 'Kepis', category: 'accesorios', desc: 'Kepis para uniforme' },
      { code: 'MOÑ001', name: 'Moña', category: 'accesorios', desc: 'Moña para uniforme' },
      { code: 'REA001', name: 'Reata', category: 'accesorios', desc: 'Reata para uniforme' },
      { code: 'GOL001', name: 'Goleana', category: 'accesorios', desc: 'Goleana para uniforme' }
    ];

    for (const acc of accesorios) {
      await pool.query(`
        INSERT INTO supply_inventory (code, name, category, quantity, minimum_quantity, talla, genero, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, [
        acc.code,
        acc.name,
        acc.category,
        0,
        10,
        null,
        null,
        acc.desc
      ]);
    }
    console.log(`✅ ${accesorios.length} accesorios creados`);

    // 7. VERIFICAR RESULTADOS
    console.log('\n📊 Verificando inventario creado...');
    
    const resumen = await pool.query(`
      SELECT 
        name,
        genero,
        COUNT(*) as cantidad,
        MIN(talla::INTEGER) as talla_min,
        MAX(talla::INTEGER) as talla_max
      FROM supply_inventory
      WHERE talla IS NOT NULL
      GROUP BY name, genero
      ORDER BY name, genero;
    `);

    console.log('\n📋 RESUMEN DEL INVENTARIO:');
    console.table(resumen.rows);

    const total = await pool.query('SELECT COUNT(*) as total FROM supply_inventory;');
    console.log(`\n✅ Total de registros creados: ${total.rows[0].total}`);

    // Mostrar detalle completo
    console.log('\n📦 DETALLE COMPLETO:');
    const detalle = await pool.query(`
      SELECT code, name, category, talla, genero, 
             CASE 
               WHEN genero = 'F' THEN 'Mujer'
               WHEN genero = 'M' THEN 'Hombre'
               ELSE 'N/A'
             END as tipo
      FROM supply_inventory
      ORDER BY name, genero, talla::INTEGER;
    `);
    console.table(detalle.rows);

    console.log('\n🎯 RESUMEN FINAL:');
    console.log(`   - Pantalones: ${tallasPantalonF.length} mujer + ${tallasPantalonM.length} hombre`);
    console.log(`   - Camisas: ${tallasCamisaF.length} mujer + ${tallasCamisaM.length} hombre`);
    console.log(`   - Overoles: ${tallasOverol.length} (sin género)`);
    console.log(`   - Botas: ${tallasBotasF.length} mujer + ${tallasBotasM.length} hombre`);
    console.log(`   - Accesorios: ${accesorios.length} (sin talla ni género)`);
    console.log('\n✅ ¡Inventario completo creado con tallas numéricas!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

crearInventarioCompleto();