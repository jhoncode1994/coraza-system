const { Pool } = require('pg');
require('dotenv').config();

async function addSupplyInventoryItems() {
  const pool = new Pool({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
    port: 5432
  });

  try {
    console.log('🔌 Connecting to database...');
    const client = await pool.connect();
    
    console.log('📦 Adding comprehensive supply inventory items...');
    
    // Expanded supply inventory items
    const supplyItems = [
      // Uniformes
      { code: 'UNI-004', name: 'Camisa Manga Larga Blanca', category: 'uniforme', quantity: 20, min_qty: 8, price: 50000, desc: 'Camisa manga larga blanca talla L' },
      { code: 'UNI-005', name: 'Pantalón Formal Negro', category: 'uniforme', quantity: 18, min_qty: 10, price: 85000, desc: 'Pantalón formal negro talla 34' },
      { code: 'UNI-006', name: 'Falda Corporativa Azul', category: 'uniforme', quantity: 12, min_qty: 6, price: 65000, desc: 'Falda corporativa azul marino' },
      { code: 'UNI-007', name: 'Blazer Ejecutivo', category: 'uniforme', quantity: 10, min_qty: 5, price: 150000, desc: 'Blazer ejecutivo color azul' },
      { code: 'UNI-008', name: 'Vestido Corporativo', category: 'uniforme', quantity: 8, min_qty: 4, price: 120000, desc: 'Vestido corporativo formal' },
      
      // Calzado
      { code: 'CAL-001', name: 'Zapatos Oxford Negros', category: 'calzado', quantity: 15, min_qty: 8, price: 180000, desc: 'Zapatos Oxford negros cuero genuino' },
      { code: 'CAL-002', name: 'Zapatos Tacón Bajo Negro', category: 'calzado', quantity: 12, min_qty: 6, price: 160000, desc: 'Zapatos tacón bajo para dama' },
      { code: 'CAL-003', name: 'Zapatos Deportivos Negros', category: 'calzado', quantity: 20, min_qty: 10, price: 120000, desc: 'Zapatos deportivos área operativa' },
      
      // Accesorios adicionales
      { code: 'ACC-003', name: 'Cinturón Cuero Negro', category: 'accesorios', quantity: 25, min_qty: 12, price: 45000, desc: 'Cinturón cuero negro ejecutivo' },
      { code: 'ACC-004', name: 'Pañuelo Corporativo', category: 'accesorios', quantity: 30, min_qty: 15, price: 15000, desc: 'Pañuelo con logo corporativo' },
      { code: 'ACC-005', name: 'Pin Identificación', category: 'accesorios', quantity: 50, min_qty: 20, price: 8000, desc: 'Pin de identificación corporativo' },
      { code: 'ACC-006', name: 'Bufanda Corporativa', category: 'accesorios', quantity: 15, min_qty: 8, price: 35000, desc: 'Bufanda corporativa invierno' },
      
      // Elementos de protección
      { code: 'EPP-001', name: 'Tapabocas Corporativo', category: 'epp', quantity: 100, min_qty: 50, price: 2500, desc: 'Tapabocas con logo corporativo' },
      { code: 'EPP-002', name: 'Guantes Latex', category: 'epp', quantity: 200, min_qty: 100, price: 1500, desc: 'Guantes latex desechables' },
      { code: 'EPP-003', name: 'Gafas Protección', category: 'epp', quantity: 25, min_qty: 15, price: 25000, desc: 'Gafas protección área técnica' },
      
      // Tecnología y equipos
      { code: 'TEC-001', name: 'Tablet Corporativa', category: 'tecnologia', quantity: 5, min_qty: 2, price: 800000, desc: 'Tablet Android 10" para campo' },
      { code: 'TEC-002', name: 'Radio Comunicación', category: 'tecnologia', quantity: 8, min_qty: 4, price: 150000, desc: 'Radio comunicación seguridad' },
      { code: 'TEC-003', name: 'Cargador Portátil', category: 'tecnologia', quantity: 15, min_qty: 8, price: 45000, desc: 'Power bank 10000mAh' },
      
      // Artículos de oficina
      { code: 'OFI-001', name: 'Agenda Corporativa', category: 'oficina', quantity: 30, min_qty: 15, price: 25000, desc: 'Agenda ejecutiva con logo' },
      { code: 'OFI-002', name: 'Bolígrafo Corporativo', category: 'oficina', quantity: 100, min_qty: 50, price: 3500, desc: 'Bolígrafo metálico con logo' },
      { code: 'OFI-003', name: 'Portafolio Ejecutivo', category: 'oficina', quantity: 12, min_qty: 6, price: 85000, desc: 'Portafolio cuero ejecutivo' },
      
      // Elementos deportivos
      { code: 'DEP-001', name: 'Camiseta Deportiva', category: 'deportivo', quantity: 25, min_qty: 12, price: 35000, desc: 'Camiseta deportiva con logo' },
      { code: 'DEP-002', name: 'Pantaloneta Deportiva', category: 'deportivo', quantity: 20, min_qty: 10, price: 30000, desc: 'Pantaloneta deportiva corporativa' },
      { code: 'DEP-003', name: 'Tenis Deportivos', category: 'deportivo', quantity: 15, min_qty: 8, price: 120000, desc: 'Tenis para actividades deportivas' }
    ];

    // Insert each item
    for (const item of supplyItems) {
      await client.query(`
        INSERT INTO supply_inventory (code, name, category, quantity, minimum_quantity, unit_price, description) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        ON CONFLICT (code) DO UPDATE SET
          name = EXCLUDED.name,
          category = EXCLUDED.category,
          quantity = EXCLUDED.quantity,
          minimum_quantity = EXCLUDED.minimum_quantity,
          unit_price = EXCLUDED.unit_price,
          description = EXCLUDED.description,
          last_update = CURRENT_TIMESTAMP
      `, [item.code, item.name, item.category, item.quantity, item.min_qty, item.price, item.desc]);
    }
    
    // Get final count
    const result = await client.query('SELECT COUNT(*) FROM supply_inventory');
    console.log(`✅ Supply inventory updated successfully!`);
    console.log(`📦 Total items in inventory: ${result.rows[0].count}`);
    
    // Show items by category
    const categories = await client.query(`
      SELECT category, COUNT(*) as count 
      FROM supply_inventory 
      GROUP BY category 
      ORDER BY category
    `);
    
    console.log('📊 Items by category:');
    categories.rows.forEach(cat => {
      console.log(`   ${cat.category}: ${cat.count} items`);
    });
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error updating inventory:', error);
    process.exit(1);
  }
}

addSupplyInventoryItems();
