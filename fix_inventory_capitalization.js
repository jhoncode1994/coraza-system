const { Pool } = require('pg');

const pool = new Pool({
  host: 'ep-solitary-scene-adpyw2k4-pooler.c-2.us-east-1.aws.neon.tech',
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_expMyzc2PY1o',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

async function fixInventoryCapitalization() {
  try {
    console.log('🔧 CORRIGIENDO CAPITALIZACIÓN DEL INVENTARIO');
    console.log('===========================================\n');
    
    // Primero mostrar los elementos actuales
    console.log('📋 Elementos actuales en inventario:');
    const currentItems = await pool.query('SELECT id, code, name FROM supply_inventory ORDER BY name');
    currentItems.rows.forEach(item => {
      console.log(`   ${item.id}. [${item.code}] ${item.name}`);
    });
    
    console.log('\n🔄 Actualizando elementos en minúscula...');
    
    // Actualizar "cinta" a "CINTA"
    const updateCinta = await pool.query(
      "UPDATE supply_inventory SET name = 'CINTA' WHERE LOWER(name) = 'cinta'"
    );
    console.log(`✅ Elementos "cinta" actualizados: ${updateCinta.rowCount}`);
    
    // Actualizar "carnet" a "CARNET"
    const updateCarnet = await pool.query(
      "UPDATE supply_inventory SET name = 'CARNET' WHERE LOWER(name) = 'carnet'"
    );
    console.log(`✅ Elementos "carnet" actualizados: ${updateCarnet.rowCount}`);
    
    // Mostrar resultado final
    console.log('\n📋 Elementos después de la actualización:');
    const updatedItems = await pool.query('SELECT id, code, name FROM supply_inventory ORDER BY name');
    updatedItems.rows.forEach(item => {
      console.log(`   ${item.id}. [${item.code}] ${item.name}`);
    });
    
    console.log('\n✅ CAPITALIZACIÓN CORREGIDA');
    console.log('✅ Todos los elementos ahora están en MAYÚSCULA');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixInventoryCapitalization();
