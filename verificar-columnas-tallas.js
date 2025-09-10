const { Pool } = require('pg');

// Configuración de base de datos usando variables de entorno
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
};

const pool = new Pool(dbConfig);

async function verificarColumnasSupplyInventory() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando columnas de la tabla supply_inventory...\n');
    
    // Obtener estructura completa de la tabla
    const estructura = await client.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'supply_inventory'
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Estructura de la tabla supply_inventory:');
    estructura.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable} - Default: ${col.column_default || 'None'}`);
    });
    
    // Verificar si existen las columnas específicas
    const columnasEspecificas = ['tiene_tallas', 'tallas_disponibles'];
    console.log('\n🔍 Verificando columnas específicas de tallas:');
    
    let columnasTallasExisten = false;
    columnasEspecificas.forEach(columna => {
      const existe = estructura.rows.find(row => row.column_name === columna);
      if (existe) {
        console.log(`✅ Columna '${columna}' encontrada - Tipo: ${existe.data_type} - Nullable: ${existe.is_nullable}`);
        columnasTallasExisten = true;
      } else {
        console.log(`❌ Columna '${columna}' NO encontrada`);
      }
    });
    
    if (columnasTallasExisten) {
      // Verificar datos en estas columnas
      console.log('\n📊 Verificando datos en las columnas de tallas...');
      
      const datos = await client.query(`
        SELECT 
          id,
          name,
          tiene_tallas,
          tallas_disponibles,
          quantity
        FROM supply_inventory
        ORDER BY id;
      `);
      
      console.log(`\n📈 Total de registros en supply_inventory: ${datos.rows.length}`);
      
      if (datos.rows.length > 0) {
        console.log('\n🔍 Datos de las columnas de tallas:');
        datos.rows.forEach(row => {
          console.log(`   ID: ${row.id} | ${row.name} | tiene_tallas: ${row.tiene_tallas} | tallas_disponibles: ${JSON.stringify(row.tallas_disponibles)} | quantity: ${row.quantity}`);
        });
        
        // Estadísticas de uso
        const conTieneTallas = datos.rows.filter(row => row.tiene_tallas === true || row.tiene_tallas === 't').length;
        const conTallasDisponibles = datos.rows.filter(row => row.tallas_disponibles && Object.keys(row.tallas_disponibles || {}).length > 0).length;
        
        console.log('\n📊 Estadísticas de uso:');
        console.log(`   - Elementos con tiene_tallas = true: ${conTieneTallas}/${datos.rows.length}`);
        console.log(`   - Elementos con talla_disponibles definidas: ${conTallasDisponibles}/${datos.rows.length}`);
        
        if (conTieneTallas === 0 && conTallasDisponibles === 0) {
          console.log('\n⚠️ CONCLUSIÓN: Las columnas de tallas NO se están usando (todos los valores están vacíos/false)');
        } else {
          console.log('\n✅ CONCLUSIÓN: Las columnas de tallas SÍ se están usando');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
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

verificarColumnasSupplyInventory();
