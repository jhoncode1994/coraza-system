const { Pool } = require('pg');

// Configuración de base de datos usando variables de entorno
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
};

const pool = new Pool(dbConfig);

async function limpiarColumnasHuerfanas() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Iniciando limpieza de columnas huérfanas de tallas...\n');
    
    // Paso 1: Verificar que las columnas existen antes de eliminarlas
    console.log('1. Verificando existencia de columnas...');
    const verificarColumnas = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'supply_inventory'
      AND table_schema = 'public'
      AND column_name IN ('tiene_tallas', 'tallas_disponibles')
      ORDER BY column_name;
    `);
    
    if (verificarColumnas.rows.length === 0) {
      console.log('✅ No se encontraron columnas de tallas para eliminar');
      return;
    }
    
    console.log('   Columnas encontradas:');
    verificarColumnas.rows.forEach(row => {
      console.log(`   - ${row.column_name}`);
    });
    
    // Paso 2: Mostrar datos actuales antes de eliminar
    console.log('\n2. Datos actuales en las columnas (para respaldo):');
    const datosActuales = await client.query(`
      SELECT 
        id,
        name,
        tiene_tallas,
        tallas_disponibles
      FROM supply_inventory
      WHERE tiene_tallas = true OR tallas_disponibles IS NOT NULL
      ORDER BY id;
    `);
    
    if (datosActuales.rows.length > 0) {
      console.log('   Elementos con datos de tallas:');
      datosActuales.rows.forEach(row => {
        console.log(`   - ID: ${row.id} | ${row.name} | tiene_tallas: ${row.tiene_tallas} | tallas: ${JSON.stringify(row.tallas_disponibles)}`);
      });
    } else {
      console.log('   No hay elementos con datos de tallas activos');
    }
    
    // Paso 3: Eliminar las columnas
    console.log('\n3. Eliminando columnas...');
    
    // Eliminar columna tiene_tallas
    try {
      await client.query('ALTER TABLE supply_inventory DROP COLUMN IF EXISTS tiene_tallas;');
      console.log('✅ Columna "tiene_tallas" eliminada');
    } catch (error) {
      console.error('❌ Error eliminando columna "tiene_tallas":', error.message);
    }
    
    // Eliminar columna tallas_disponibles
    try {
      await client.query('ALTER TABLE supply_inventory DROP COLUMN IF EXISTS tallas_disponibles;');
      console.log('✅ Columna "tallas_disponibles" eliminada');
    } catch (error) {
      console.error('❌ Error eliminando columna "tallas_disponibles":', error.message);
    }
    
    // Paso 4: Verificar eliminación
    console.log('\n4. Verificando eliminación...');
    const verificarEliminacion = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'supply_inventory'
      AND table_schema = 'public'
      AND column_name IN ('tiene_tallas', 'tallas_disponibles');
    `);
    
    if (verificarEliminacion.rows.length === 0) {
      console.log('✅ Columnas eliminadas exitosamente');
    } else {
      console.log('⚠️ Algunas columnas no fueron eliminadas:');
      verificarEliminacion.rows.forEach(row => {
        console.log(`   - ${row.column_name} aún existe`);
      });
    }
    
    // Paso 5: Mostrar estructura final de la tabla
    console.log('\n5. Estructura final de supply_inventory:');
    const estructuraFinal = await client.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'supply_inventory'
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    console.log('   Columnas restantes:');
    estructuraFinal.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    
    console.log('\n🎉 Limpieza completada!');
    console.log('📊 Estado: La tabla supply_inventory está ahora limpia de columnas de tallas huérfanas');
    console.log('💡 Próximos pasos: Cuando necesites implementar tallas, hazlo con un diseño desde cero');
        
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Cargar variables de entorno
try {
  require('dotenv').config();
} catch (e) {
  console.log('dotenv no disponible, usando variables de entorno del sistema');
}

limpiarColumnasHuerfanas();
