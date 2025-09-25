const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://neondb_owner:1VHR7WYSJwxJ@ep-billowing-cloud-a5xb2yux.us-east-2.aws.neon.tech/neondb?sslmode=require"
});

async function debugSizes() {
  try {
    await client.connect();
    console.log('=== DEBUGGING SIZE SELECTION ===\n');

    // Obtener todos los pantalones
    const result = await client.query(`
      SELECT id, name, category, talla, quantity 
      FROM supply_inventory 
      WHERE LOWER(name) LIKE '%pantal%' 
      ORDER BY id
    `);

    console.log('PANTALONES EN INVENTARIO:');
    console.log('ID | Nombre | Categoria | Talla | Stock');
    console.log('---|--------|-----------|-------|-------');
    
    result.rows.forEach(row => {
      console.log(`${row.id} | ${row.name} | ${row.category} | ${row.talla || 'NULL'} | ${row.quantity}`);
    });

    console.log('\n=== ANÁLISIS PARA FRONTEND ===');
    
    // Simular lo que hace getNombreBase
    const pantalones = result.rows.filter(r => r.quantity > 0);
    
    console.log('\nPantalones con stock > 0:');
    pantalones.forEach(p => {
      console.log(`- Nombre: "${p.name}", Talla: "${p.talla}", Stock: ${p.quantity}`);
      console.log(`  getNombreBase("${p.name}") = "${p.name.split(' ')[0]}"`);
    });

    console.log('\n=== TALLAS DISPONIBLES PARA "pantalón" ===');
    const tallasDisponibles = pantalones
      .filter(p => p.name.split(' ')[0].toLowerCase() === 'pantalón')
      .map(p => p.talla)
      .filter(t => t !== null);
    
    console.log('Tallas que debería mostrar el frontend:', tallasDisponibles);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

debugSizes();