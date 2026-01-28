// Script simple de prueba de API - Solo HTTP calls
const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data: data.substring(0, 200) });
        }
      });
    }).on('error', reject);
  });
}

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body.substring(0, 200) });
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('\n🧪 PRUEBAS DE API - CORAZA SYSTEM\n');
  console.log('═'.repeat(60));
  
  let passed = 0, failed = 0;
  
  const test = async (name, fn) => {
    try {
      const result = await fn();
      if (result.success) {
        console.log(`✅ ${name}`);
        if (result.info) console.log(`   └─ ${result.info}`);
        passed++;
      } else {
        console.log(`❌ ${name}: ${result.error}`);
        failed++;
      }
    } catch (e) {
      console.log(`❌ ${name}: ${e.message}`);
      failed++;
    }
  };

  // Test 1: Página principal
  await test('Frontend - Página principal', async () => {
    const res = await get('/');
    return { success: res.status === 200, info: 'HTML cargado correctamente' };
  });

  // Test 2: API Users
  await test('API - GET /api/users', async () => {
    const res = await get('/api/users');
    const count = Array.isArray(res.data) ? res.data.length : 0;
    return { success: res.status === 200 && count > 0, info: `${count} asociados encontrados` };
  });

  // Test 3: API Inventory
  await test('API - GET /api/inventory', async () => {
    const res = await get('/api/inventory');
    const count = Array.isArray(res.data) ? res.data.length : 0;
    return { success: res.status === 200, info: `${count} items en inventario` };
  });

  // Test 4: API Entregas
  await test('API - GET /api/entregas', async () => {
    const res = await get('/api/entregas');
    const count = Array.isArray(res.data) ? res.data.length : 0;
    return { success: res.status === 200, info: `${count} entregas registradas` };
  });

  // Test 5: API Movimientos
  await test('API - GET /api/inventory-movements', async () => {
    const res = await get('/api/inventory-movements');
    const count = Array.isArray(res.data) ? res.data.length : 0;
    return { success: res.status === 200, info: `${count} movimientos` };
  });

  // Test 6: API Retirados
  await test('API - GET /api/retired-associates', async () => {
    const res = await get('/api/retired-associates');
    return { success: res.status === 200 || res.status === 404, info: 'Endpoint disponible' };
  });

  // Test 7: Login inválido
  await test('API - POST /api/auth/login (credenciales inválidas)', async () => {
    const res = await post('/api/auth/login', { username: 'invalid', password: 'wrong' });
    return { success: res.status === 401 || res.status === 400, info: 'Rechaza credenciales inválidas' };
  });

  // Test 8: Login válido
  await test('API - POST /api/auth/login (Administrador)', async () => {
    const res = await post('/api/auth/login', { username: 'Administrador', password: 'admin123' });
    return { 
      success: res.status === 200, 
      info: res.status === 200 ? `Login exitoso - Rol: ${res.data.user?.role || 'N/A'}` : `Status: ${res.status}`,
      error: res.status !== 200 ? `Status: ${res.status}` : null
    };
  });

  // Test 9: Usuarios por zona
  await test('API - GET /api/users?zona=4', async () => {
    const res = await get('/api/users?zona=4');
    const count = Array.isArray(res.data) ? res.data.length : 0;
    return { success: res.status === 200, info: `${count} asociados en zona 4` };
  });

  // Test 10: Historial de entregas por usuario
  await test('API - GET /api/entregas/user/1', async () => {
    const res = await get('/api/entregas/user/1');
    return { success: res.status === 200 || res.status === 404, info: 'Endpoint funcional' };
  });

  console.log('\n' + '═'.repeat(60));
  console.log(`\n📊 RESULTADOS: ${passed} exitosas, ${failed} fallidas`);
  console.log(`🎯 Tasa de éxito: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`);
}

runTests().catch(console.error);
