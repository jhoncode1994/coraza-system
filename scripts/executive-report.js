// Resumen Ejecutivo del Estado del Sistema - Coraza System
require('dotenv').config();

const { Pool } = require('pg');
const http = require('http');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function generateReport() {
  const client = await pool.connect();
  
  try {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║          📊 CORAZA SYSTEM - REPORTE DE ESTADO EN PRODUCCIÓN        ║');
    console.log('║                         ' + new Date().toLocaleString('es-CO').padEnd(40) + '   ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝');
    console.log('');

    // ═══════════════════════════════════════════════════════════════
    // BASE DE DATOS
    // ═══════════════════════════════════════════════════════════════
    console.log('┌────────────────────────────────────────────────────────────────────┐');
    console.log('│                    💾 ESTADO DE LA BASE DE DATOS                  │');
    console.log('└────────────────────────────────────────────────────────────────────┘');

    const dbInfo = await client.query(`SELECT pg_size_pretty(pg_database_size(current_database())) as size`);
    const tableStats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as asociados,
        (SELECT COUNT(*) FROM supply_inventory) as items_inventario,
        (SELECT COUNT(*) FROM entrega_dotacion) as entregas,
        (SELECT COUNT(*) FROM inventory_movements) as movimientos,
        (SELECT COUNT(*) FROM admin_users) as usuarios_admin,
        (SELECT COUNT(*) FROM retired_associates) as retirados
    `);
    
    const stats = tableStats.rows[0];
    console.log(`   📦 Tamaño BD: ${dbInfo.rows[0].size}`);
    console.log(`   ✅ Estado: OPERATIVA`);
    console.log('');
    console.log('   📊 Registros por tabla:');
    console.log(`      • Asociados (users):           ${stats.asociados.toString().padStart(6)}`);
    console.log(`      • Inventario (supply_inventory): ${stats.items_inventario.toString().padStart(6)}`);
    console.log(`      • Entregas (entrega_dotacion): ${stats.entregas.toString().padStart(6)}`);
    console.log(`      • Movimientos:                 ${stats.movimientos.toString().padStart(6)}`);
    console.log(`      • Usuarios Admin:              ${stats.usuarios_admin.toString().padStart(6)}`);
    console.log(`      • Retirados:                   ${stats.retirados.toString().padStart(6)}`);

    // ═══════════════════════════════════════════════════════════════
    // USUARIOS ADMINISTRATIVOS
    // ═══════════════════════════════════════════════════════════════
    console.log('');
    console.log('┌────────────────────────────────────────────────────────────────────┐');
    console.log('│                    👥 USUARIOS ADMINISTRATIVOS                     │');
    console.log('└────────────────────────────────────────────────────────────────────┘');

    const adminUsers = await client.query(`SELECT username, email, role, is_active FROM admin_users ORDER BY id`);
    adminUsers.rows.forEach(u => {
      const status = u.is_active ? '🟢' : '🔴';
      console.log(`   ${status} ${u.username.padEnd(15)} | ${u.role.padEnd(12)} | ${u.email}`);
    });

    // ═══════════════════════════════════════════════════════════════
    // INVENTARIO
    // ═══════════════════════════════════════════════════════════════
    console.log('');
    console.log('┌────────────────────────────────────────────────────────────────────┐');
    console.log('│                    📦 ESTADO DEL INVENTARIO                        │');
    console.log('└────────────────────────────────────────────────────────────────────┘');

    const invStats = await client.query(`
      SELECT 
        category,
        COUNT(*) as items,
        SUM(quantity) as stock,
        COUNT(CASE WHEN quantity <= minimum_quantity THEN 1 END) as bajo_stock
      FROM supply_inventory
      GROUP BY category
      ORDER BY stock DESC
    `);
    
    console.log('   Categoría'.padEnd(30) + '| Items | Stock | Bajo Stock');
    console.log('   ' + '─'.repeat(55));
    let totalBajoStock = 0;
    invStats.rows.forEach(c => {
      totalBajoStock += parseInt(c.bajo_stock || 0);
      console.log(`   ${c.category.padEnd(28)} | ${c.items.toString().padStart(5)} | ${(c.stock || 0).toString().padStart(5)} | ${(c.bajo_stock || 0).toString().padStart(10)}`);
    });

    if (totalBajoStock > 0) {
      console.log('');
      console.log(`   ⚠️ ALERTA: ${totalBajoStock} items con stock bajo o agotado`);
      
      const lowStock = await client.query(`
        SELECT name, talla, genero, quantity, minimum_quantity
        FROM supply_inventory
        WHERE quantity <= minimum_quantity
        ORDER BY quantity
        LIMIT 5
      `);
      
      lowStock.rows.forEach(i => {
        const talla = i.talla ? ` (${i.talla})` : '';
        const genero = i.genero ? ` [${i.genero}]` : '';
        console.log(`      🔴 ${i.name}${talla}${genero}: ${i.quantity} unidades (mínimo: ${i.minimum_quantity})`);
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // ENTREGAS
    // ═══════════════════════════════════════════════════════════════
    console.log('');
    console.log('┌────────────────────────────────────────────────────────────────────┐');
    console.log('│                    🎁 RESUMEN DE ENTREGAS                          │');
    console.log('└────────────────────────────────────────────────────────────────────┘');

    const entregaStats = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT "userId") as asociados_atendidos,
        SUM(cantidad) as items_entregados,
        COUNT(firma_url) as con_firma,
        MAX("fechaEntrega") as ultima_entrega
      FROM entrega_dotacion
    `);
    
    const e = entregaStats.rows[0];
    const pctFirma = ((e.con_firma / e.total) * 100).toFixed(1);
    const pctAtendidos = ((e.asociados_atendidos / stats.asociados) * 100).toFixed(1);
    
    console.log(`   📊 Total entregas: ${e.total}`);
    console.log(`   👥 Asociados atendidos: ${e.asociados_atendidos} de ${stats.asociados} (${pctAtendidos}%)`);
    console.log(`   📦 Items entregados: ${e.items_entregados}`);
    console.log(`   ✍️ Entregas con firma: ${e.con_firma} (${pctFirma}%)`);
    console.log(`   📅 Última entrega: ${e.ultima_entrega ? new Date(e.ultima_entrega).toLocaleDateString('es-CO') : 'N/A'}`);

    // Top elementos entregados
    const topElements = await client.query(`
      SELECT elemento, SUM(cantidad) as total
      FROM entrega_dotacion
      GROUP BY elemento
      ORDER BY total DESC
      LIMIT 5
    `);
    
    console.log('');
    console.log('   🏆 Top 5 elementos más entregados:');
    topElements.rows.forEach((el, i) => {
      console.log(`      ${i+1}. ${el.elemento.padEnd(30)} ${el.total} unidades`);
    });

    // ═══════════════════════════════════════════════════════════════
    // PRUEBA DE API
    // ═══════════════════════════════════════════════════════════════
    console.log('');
    console.log('┌────────────────────────────────────────────────────────────────────┐');
    console.log('│                    🌐 ESTADO DE LA API                             │');
    console.log('└────────────────────────────────────────────────────────────────────┘');

    const endpoints = [
      { name: 'Frontend', path: '/' },
      { name: 'Usuarios', path: '/api/users' },
      { name: 'Inventario', path: '/api/supply-inventory' },
      { name: 'Entregas', path: '/api/delivery' },
      { name: 'Movimientos', path: '/api/inventory-movements' },
      { name: 'Retirados', path: '/api/retired-associates' }
    ];

    let apiOk = 0;
    for (const ep of endpoints) {
      try {
        const res = await makeRequest('GET', ep.path);
        const status = res.status === 200 ? '✅' : '⚠️';
        if (res.status === 200) apiOk++;
        console.log(`   ${status} ${ep.name.padEnd(15)} | Status: ${res.status}`);
      } catch (err) {
        console.log(`   ❌ ${ep.name.padEnd(15)} | Error: ${err.message}`);
      }
    }

    // Login test
    try {
      const loginRes = await makeRequest('POST', '/api/auth/login', { username: 'admin', password: 'admin123' });
      const loginStatus = loginRes.status === 200 ? '✅' : '⚠️';
      if (loginRes.status === 200) apiOk++;
      console.log(`   ${loginStatus} Login API      | Status: ${loginRes.status}`);
    } catch (err) {
      console.log(`   ❌ Login API      | Error: ${err.message}`);
    }

    // ═══════════════════════════════════════════════════════════════
    // RESUMEN FINAL
    // ═══════════════════════════════════════════════════════════════
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║                       📋 RESUMEN EJECUTIVO                         ║');
    console.log('╠════════════════════════════════════════════════════════════════════╣');
    console.log(`║  ✅ Base de datos: OPERATIVA                                       ║`);
    console.log(`║  ✅ API: ${apiOk}/7 endpoints funcionando                                   ║`);
    console.log(`║  👥 Usuarios Admin: ${stats.usuarios_admin} configurados                                   ║`);
    console.log(`║  👷 Asociados: ${stats.asociados} registrados                                      ║`);
    console.log(`║  📦 Inventario: ${stats.items_inventario} items (${totalBajoStock} con stock bajo)                        ║`);
    console.log(`║  🎁 Entregas: ${stats.entregas} registradas (${pctFirma}% con firma)                     ║`);
    console.log('╠════════════════════════════════════════════════════════════════════╣');
    
    // Alertas
    if (totalBajoStock > 0) {
      console.log(`║  ⚠️ ALERTA: ${totalBajoStock} productos con stock bajo - requieren reabastecimiento   ║`);
    }
    if (parseInt(stats.retirados) === 0) {
      console.log(`║  ℹ️ INFO: Módulo de retirados sin registros                          ║`);
    }
    
    console.log('╚════════════════════════════════════════════════════════════════════╝');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

generateReport();
