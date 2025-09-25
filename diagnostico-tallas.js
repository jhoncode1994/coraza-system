const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Función para verificar configuración de tallas
function requiereTalla(tipo) {
  if (!tipo) return false;
  
  const tipoLower = tipo.toLowerCase().trim();
  const ELEMENTOS_CON_TALLA = ['botas', 'camisa', 'chaqueta', 'overol', 'pantalon'];
  
  // Buscar coincidencias exactas primero
  if (ELEMENTOS_CON_TALLA.includes(tipoLower)) {
    return true;
  }
  
  // Buscar coincidencias parciales para mayor flexibilidad
  const coincidencias = [
    { palabras: ['pantalon', 'pantalón'], categoria: 'pantalon' },
    { palabras: ['camisa', 'camisas'], categoria: 'camisa' },
    { palabras: ['chaqueta', 'chaquetas', 'jacket'], categoria: 'chaqueta' },
    { palabras: ['overol', 'overoles', 'overall'], categoria: 'overol' },
    { palabras: ['bota', 'botas', 'zapato', 'zapatos', 'calzado'], categoria: 'botas' }
  ];
  
  for (const grupo of coincidencias) {
    for (const palabra of grupo.palabras) {
      if (tipoLower.includes(palabra)) {
        return true;
      }
    }
  }
  
  return false;
}

async function diagnosticarTallas() {
  const client = await pool.connect();
  try {
    console.log('🔍 DIAGNÓSTICO DEL SISTEMA DE TALLAS\n');
    
    const result = await client.query('SELECT id, name, category, code, quantity FROM supply_inventory ORDER BY name');
    
    console.log('📋 ELEMENTOS EN INVENTARIO:\n');
    console.log('| ID | CÓDIGO | NOMBRE | CATEGORÍA | REQUIERE TALLA | STOCK |');
    console.log('|----|--------|--------|-----------|----------------|-------|');
    
    for (const item of result.rows) {
      const requiereTallaPorCategoria = requiereTalla(item.category);
      const requiereTallaPorNombre = requiereTalla(item.name);
      const requiereTallaFinal = requiereTallaPorCategoria || requiereTallaPorNombre;
      
      console.log(`| ${item.id} | ${item.code} | ${item.name} | ${item.category} | ${requiereTallaFinal ? '✅ SÍ' : '❌ NO'} | ${item.quantity} |`);
      
      if (requiereTallaFinal) {
        console.log(`   └─ Detección: Categoría (${item.category}): ${requiereTallaPorCategoria}, Nombre (${item.name}): ${requiereTallaPorNombre}`);
      }
    }
    
    console.log('\n🎯 ELEMENTOS QUE DEBERÍAN TENER TALLAS:');
    const elementosConTallas = result.rows.filter(item => 
      requiereTalla(item.category) || requiereTalla(item.name)
    );
    
    if (elementosConTallas.length === 0) {
      console.log('⚠️  NO se encontraron elementos que requieran tallas.');
      console.log('💡 Esto podría indicar que las categorías no coinciden con la configuración.');
    } else {
      elementosConTallas.forEach(item => {
        console.log(`   - ${item.name} (Categoría: ${item.category})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
  }
}

diagnosticarTallas().then(() => {
  console.log('\n✅ Diagnóstico completado');
  process.exit(0);
});