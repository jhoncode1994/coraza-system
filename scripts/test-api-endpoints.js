// Script de prueba de endpoints de la API - Coraza System
// Prueba el funcionamiento de todos los endpoints principales

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Función para hacer requests HTTP
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (e) => reject(e));
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testEndpoints() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║      🧪 CORAZA SYSTEM - PRUEBA DE ENDPOINTS API              ║');
  console.log('║                    ' + new Date().toLocaleString('es-CO').padEnd(35) + '  ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');

  const tests = [];
  let passed = 0;
  let failed = 0;

  // Helper para registrar resultados
  function logTest(name, success, details = '') {
    const icon = success ? '✅' : '❌';
    console.log(`   ${icon} ${name}`);
    if (details && !success) console.log(`      └─ ${details}`);
    if (success) passed++; else failed++;
    tests.push({ name, success, details });
  }

  // ═══════════════════════════════════════════════════════════════
  // PRUEBAS DE API
  // ═══════════════════════════════════════════════════════════════

  console.log('┌───────────────────────────────────────────────────────────────┐');
  console.log('│ 1️⃣  ENDPOINTS DE USUARIOS (Asociados)                         │');
  console.log('└───────────────────────────────────────────────────────────────┘');

  try {
    // GET /api/users
    const users = await makeRequest('GET', '/api/users');
    logTest('GET /api/users - Listar asociados', users.status === 200, 
      `Status: ${users.status}, Registros: ${Array.isArray(users.data) ? users.data.length : 'N/A'}`);
    
    if (Array.isArray(users.data) && users.data.length > 0) {
      console.log(`      └─ ${users.data.length} asociados encontrados`);
      
      // GET /api/users/:id
      const firstUser = users.data[0];
      const singleUser = await makeRequest('GET', `/api/users/${firstUser.id}`);
      logTest('GET /api/users/:id - Obtener asociado', singleUser.status === 200);
    }

    // GET /api/users con filtro por zona
    const usersByZone = await makeRequest('GET', '/api/users?zona=4');
    logTest('GET /api/users?zona=4 - Filtrar por zona', usersByZone.status === 200);

  } catch (e) {
    logTest('Endpoints de usuarios', false, e.message);
  }

  console.log('\n┌───────────────────────────────────────────────────────────────┐');
  console.log('│ 2️⃣  ENDPOINTS DE INVENTARIO                                   │');
  console.log('└───────────────────────────────────────────────────────────────┘');

  try {
    // GET /api/inventory
    const inventory = await makeRequest('GET', '/api/inventory');
    logTest('GET /api/inventory - Listar inventario', inventory.status === 200,
      `Registros: ${Array.isArray(inventory.data) ? inventory.data.length : 'N/A'}`);

    if (Array.isArray(inventory.data) && inventory.data.length > 0) {
      console.log(`      └─ ${inventory.data.length} items en inventario`);
    }

    // GET /api/inventory/low-stock
    const lowStock = await makeRequest('GET', '/api/inventory/low-stock');
    logTest('GET /api/inventory/low-stock - Items con stock bajo', 
      lowStock.status === 200 || lowStock.status === 404);

  } catch (e) {
    logTest('Endpoints de inventario', false, e.message);
  }

  console.log('\n┌───────────────────────────────────────────────────────────────┐');
  console.log('│ 3️⃣  ENDPOINTS DE ENTREGAS DE DOTACIÓN                         │');
  console.log('└───────────────────────────────────────────────────────────────┘');

  try {
    // GET /api/entregas
    const entregas = await makeRequest('GET', '/api/entregas');
    logTest('GET /api/entregas - Listar entregas', entregas.status === 200,
      `Registros: ${Array.isArray(entregas.data) ? entregas.data.length : 'N/A'}`);

    // GET /api/entregas/user/:userId
    const entregasUser = await makeRequest('GET', '/api/entregas/user/1');
    logTest('GET /api/entregas/user/:id - Entregas por asociado', 
      entregasUser.status === 200 || entregasUser.status === 404);

  } catch (e) {
    logTest('Endpoints de entregas', false, e.message);
  }

  console.log('\n┌───────────────────────────────────────────────────────────────┐');
  console.log('│ 4️⃣  ENDPOINTS DE MOVIMIENTOS DE INVENTARIO                    │');
  console.log('└───────────────────────────────────────────────────────────────┘');

  try {
    // GET /api/inventory-movements
    const movements = await makeRequest('GET', '/api/inventory-movements');
    logTest('GET /api/inventory-movements - Listar movimientos', movements.status === 200,
      `Registros: ${Array.isArray(movements.data) ? movements.data.length : 'N/A'}`);

  } catch (e) {
    logTest('Endpoints de movimientos', false, e.message);
  }

  console.log('\n┌───────────────────────────────────────────────────────────────┐');
  console.log('│ 5️⃣  ENDPOINTS DE AUTENTICACIÓN                                │');
  console.log('└───────────────────────────────────────────────────────────────┘');

  try {
    // POST /api/auth/login (con credenciales incorrectas - debe fallar)
    const badLogin = await makeRequest('POST', '/api/auth/login', {
      username: 'test',
      password: 'wrongpassword'
    });
    logTest('POST /api/auth/login - Rechazar credenciales inválidas', 
      badLogin.status === 401 || badLogin.status === 400);

    // POST /api/auth/login (con credenciales correctas)
    const goodLogin = await makeRequest('POST', '/api/auth/login', {
      username: 'Administrador',
      password: 'admin123'
    });
    logTest('POST /api/auth/login - Login con credenciales válidas', 
      goodLogin.status === 200,
      goodLogin.status !== 200 ? `Status: ${goodLogin.status}` : '');

  } catch (e) {
    logTest('Endpoints de autenticación', false, e.message);
  }

  console.log('\n┌───────────────────────────────────────────────────────────────┐');
  console.log('│ 6️⃣  ENDPOINTS DE ASOCIADOS RETIRADOS                          │');
  console.log('└───────────────────────────────────────────────────────────────┘');

  try {
    // GET /api/retired-associates
    const retired = await makeRequest('GET', '/api/retired-associates');
    logTest('GET /api/retired-associates - Listar retirados', 
      retired.status === 200 || retired.status === 404,
      `Registros: ${Array.isArray(retired.data) ? retired.data.length : 'N/A'}`);

  } catch (e) {
    logTest('Endpoints de retirados', false, e.message);
  }

  console.log('\n┌───────────────────────────────────────────────────────────────┐');
  console.log('│ 7️⃣  ENDPOINTS DE REPORTES                                     │');
  console.log('└───────────────────────────────────────────────────────────────┘');

  try {
    // GET /api/reports/inventory-summary
    const invSummary = await makeRequest('GET', '/api/reports/inventory-summary');
    logTest('GET /api/reports/inventory-summary', 
      invSummary.status === 200 || invSummary.status === 404);

    // GET /api/reports/deliveries-summary
    const delSummary = await makeRequest('GET', '/api/reports/deliveries-summary');
    logTest('GET /api/reports/deliveries-summary', 
      delSummary.status === 200 || delSummary.status === 404);

  } catch (e) {
    logTest('Endpoints de reportes', false, e.message);
  }

  console.log('\n┌───────────────────────────────────────────────────────────────┐');
  console.log('│ 8️⃣  FRONTEND Y ARCHIVOS ESTÁTICOS                             │');
  console.log('└───────────────────────────────────────────────────────────────┘');

  try {
    // GET / (página principal)
    const home = await makeRequest('GET', '/');
    logTest('GET / - Página principal', home.status === 200);

    // GET /test-api.html
    const testPage = await makeRequest('GET', '/test-api.html');
    logTest('GET /test-api.html - Página de prueba', 
      testPage.status === 200 || testPage.status === 404);

  } catch (e) {
    logTest('Frontend estático', false, e.message);
  }

  // ═══════════════════════════════════════════════════════════════
  // RESUMEN
  // ═══════════════════════════════════════════════════════════════
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                    📋 RESUMEN DE PRUEBAS                      ║');
  console.log('╠═══════════════════════════════════════════════════════════════╣');
  console.log(`║  ✅ Pruebas exitosas: ${passed.toString().padEnd(3)}                                     ║`);
  console.log(`║  ❌ Pruebas fallidas: ${failed.toString().padEnd(3)}                                     ║`);
  console.log(`║  📊 Total pruebas: ${(passed + failed).toString().padEnd(3)}                                       ║`);
  console.log(`║  🎯 Tasa de éxito: ${((passed / (passed + failed)) * 100).toFixed(1)}%                                     ║`);
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');

  if (failed > 0) {
    console.log('⚠️ Endpoints con problemas:');
    tests.filter(t => !t.success).forEach(t => {
      console.log(`   • ${t.name}: ${t.details || 'Error'}`);
    });
  }
}

testEndpoints().catch(console.error);
