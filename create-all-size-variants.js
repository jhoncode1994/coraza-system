const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Configuración de tallas por elemento
const TALLAS_CONFIG = {
  'Camisa': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'Chaqueta': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'Overol': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'Botas': ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45']
};

async function createAllSizeVariants() {
  try {
    const client = await pool.connect();
    
    console.log('=== CREACIÓN AUTOMÁTICA DE VARIANTES CON TALLAS ===');
    
    // Iniciar transacción
    await client.query('BEGIN');
    
    let totalCreated = 0;
    let totalSkipped = 0;
    
    for (const [elementName, sizes] of Object.entries(TALLAS_CONFIG)) {
      console.log(`\n🏷️  PROCESANDO: ${elementName.toUpperCase()}`);
      
      // Buscar el registro base del elemento
      const baseQuery = `
        SELECT id, code, name, category, minimum_quantity, unit_price, description
        FROM supply_inventory 
        WHERE LOWER(name) = LOWER($1) AND talla IS NULL
        LIMIT 1
      `;
      
      const baseResult = await client.query(baseQuery, [elementName]);
      
      if (baseResult.rows.length === 0) {
        console.log(`  ⚠️  No se encontró registro base para ${elementName}`);
        continue;
      }
      
      const baseElement = baseResult.rows[0];
      const baseCode = baseElement.code.split('-')[0]; // Asegurar código limpio
      
      console.log(`  📦 Elemento base encontrado: ID ${baseElement.id}, Código: "${baseElement.code}"`);
      console.log(`  📏 Creando ${sizes.length} variantes de tallas...`);
      
      for (const talla of sizes) {
        const newCode = `${baseCode}-${talla}`;
        
        // Verificar si ya existe este registro
        const existingCheck = await client.query(
          'SELECT id FROM supply_inventory WHERE code = $1',
          [newCode]
        );
        
        if (existingCheck.rows.length > 0) {
          console.log(`    ✅ Ya existe: ${newCode} (Talla ${talla})`);
          totalSkipped++;
          continue;
        }
        
        // Crear nuevo registro con talla
        const insertResult = await client.query(`
          INSERT INTO supply_inventory (
            code, name, category, talla, quantity, minimum_quantity, 
            unit_price, description, last_update, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING id
        `, [
          newCode,
          baseElement.name,
          baseElement.category,
          talla,
          0, // Cantidad inicial en 0
          baseElement.minimum_quantity || 10,
          baseElement.unit_price,
          `${baseElement.description || baseElement.name} - Talla ${talla}`,
        ]);
        
        console.log(`    🆕 Creado: ${newCode} (ID: ${insertResult.rows[0].id}) - Talla ${talla}`);
        totalCreated++;
      }
      
      console.log(`  📊 ${elementName}: ${sizes.length - (totalSkipped - (totalCreated - sizes.length))} nuevos, ${totalSkipped - (totalCreated - sizes.length)} existentes`);
    }
    
    // Confirmar transacción
    await client.query('COMMIT');
    
    console.log('\n=== RESUMEN FINAL ===');
    console.log(`🎉 Total de registros creados: ${totalCreated}`);
    console.log(`✅ Total de registros ya existentes: ${totalSkipped}`);
    console.log('✨ Proceso completado exitosamente');
    
    // Mostrar estado final
    console.log('\n=== ESTADO FINAL POR ELEMENTO ===');
    
    for (const elementName of Object.keys(TALLAS_CONFIG)) {
      const countQuery = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN talla IS NOT NULL THEN 1 END) as with_size,
          COUNT(CASE WHEN talla IS NULL THEN 1 END) as base_only
        FROM supply_inventory 
        WHERE LOWER(name) = LOWER($1)
      `;
      
      const countResult = await client.query(countQuery, [elementName]);
      const counts = countResult.rows[0];
      
      console.log(`📦 ${elementName}: ${counts.total} registros (${counts.base_only} base + ${counts.with_size} con tallas)`);
      
      // Mostrar las tallas creadas
      const sizesQuery = `
        SELECT talla, code, quantity
        FROM supply_inventory 
        WHERE LOWER(name) = LOWER($1) AND talla IS NOT NULL
        ORDER BY 
          CASE 
            WHEN talla ~ '^[0-9]+$' THEN talla::integer
            ELSE 999
          END,
          talla
      `;
      
      const sizesResult = await client.query(sizesQuery, [elementName]);
      
      if (sizesResult.rows.length > 0) {
        const tallasList = sizesResult.rows.map(row => `${row.talla} (${row.code})`).join(', ');
        console.log(`   Tallas: ${tallasList}`);
      }
    }
    
    // Verificación final de integridad
    console.log('\n=== VERIFICACIÓN DE INTEGRIDAD ===');
    const integrityCheck = await client.query(`
      SELECT 
        COUNT(*) as total_problematic
      FROM supply_inventory 
      WHERE code ~ '.*-.*-.*'
    `);
    
    if (integrityCheck.rows[0].total_problematic === 0) {
      console.log('✅ Integridad verificada: No hay códigos problemáticos');
    } else {
      console.log(`❌ ATENCIÓN: ${integrityCheck.rows[0].total_problematic} códigos problemáticos detectados`);
    }
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error durante la creación:', error);
    
    // Rollback en caso de error
    try {
      const client = await pool.connect();
      await client.query('ROLLBACK');
      client.release();
      console.log('🔄 Rollback ejecutado exitosamente');
    } catch (rollbackError) {
      console.error('❌ Error en rollback:', rollbackError);
    }
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  createAllSizeVariants();
}

module.exports = { createAllSizeVariants };