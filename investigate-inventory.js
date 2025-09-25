const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_expMyzc2PY1o@ep-solitary-scene-adpyw2k4-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
});

async function investigateInventory() {
  try {
    await client.connect();
    console.log('🔍 INVESTIGANDO ELEMENTO PAN001-32-44...\n');

    // Obtener TODOS los registros del inventario
    const result = await client.query(`
      SELECT id, code, name, category, talla, quantity, description, created_at
      FROM supply_inventory 
      ORDER BY id
    `);

    console.log('📦 INVENTARIO COMPLETO:');
    console.log('════════════════════════════════════════════════════════════════');
    console.log('ID | CODE | NAME | CATEGORY | TALLA | QTY | DESCRIPTION');
    console.log('---|------|------|----------|-------|-----|-------------');

    result.rows.forEach(item => {
      console.log(`${item.id.toString().padStart(2)} | ${(item.code || 'NULL').padEnd(15)} | ${(item.name || 'NULL').padEnd(15)} | ${(item.category || 'NULL').padEnd(10)} | ${(item.talla || 'NULL').padEnd(5)} | ${item.quantity.toString().padStart(3)} | ${(item.description || 'NULL').substring(0, 20)}`);
    });

    console.log('════════════════════════════════════════════════════════════════\n');

    // Buscar específicamente el elemento que mencionas
    const panResult = await client.query(`
      SELECT * FROM supply_inventory 
      WHERE name LIKE '%PAN001%' OR code LIKE '%PAN001%' OR name LIKE '%32-44%'
    `);

    if (panResult.rows.length > 0) {
      console.log('🎯 ELEMENTO PAN001-32-44 ENCONTRADO:');
      console.log('════════════════════════════════════════');
      panResult.rows.forEach(item => {
        console.log(`ID: ${item.id}`);
        console.log(`CODE: ${item.code}`);
        console.log(`NAME: ${item.name}`);
        console.log(`CATEGORY: ${item.category}`);
        console.log(`TALLA: ${item.talla}`);
        console.log(`QUANTITY: ${item.quantity}`);
        console.log(`DESCRIPTION: ${item.description}`);
        console.log(`CREATED: ${item.created_at}`);
        console.log('----------------------------------------');
      });
    } else {
      console.log('❌ No se encontró elemento con PAN001-32-44');
    }

    // Analizar patrones en los nombres
    console.log('\n🔍 ANÁLISIS DE PATRONES:');
    console.log('════════════════════════════════════');
    
    const patterns = {};
    result.rows.forEach(item => {
      if (item.name) {
        // Buscar patrones como XXX-YY-ZZ
        if (item.name.match(/\w+-\d+-\d+/)) {
          patterns['Código con guiones'] = patterns['Código con guiones'] || [];
          patterns['Código con guiones'].push(item.name);
        }
        // Buscar nombres simples
        else if (item.name.match(/^\w+$/)) {
          patterns['Nombres simples'] = patterns['Nombres simples'] || [];
          patterns['Nombres simples'].push(item.name);
        }
        // Otros patrones
        else {
          patterns['Otros formatos'] = patterns['Otros formatos'] || [];
          patterns['Otros formatos'].push(item.name);
        }
      }
    });

    Object.entries(patterns).forEach(([pattern, items]) => {
      console.log(`\n📋 ${pattern}:`);
      items.forEach(item => console.log(`  - ${item}`));
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

investigateInventory();