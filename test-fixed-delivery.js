const http = require('http');

const entregaData = {
  userId: 1,
  elemento: 'pantalón',
  talla: '36',
  cantidad: 1,
  observaciones: 'Test después de correcciones',
  firma_url: 'Test'
};

const data = JSON.stringify(entregaData);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/delivery',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('🧪 TESTING DELIVERY WITH CORRECTED BACKEND...\n');
console.log('Enviando entrega:', entregaData);

const req = http.request(options, (res) => {
  console.log(`\n📊 Status: ${res.statusCode}`);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsed = JSON.parse(responseData);
      console.log('✅ SUCCESS - Response:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      if (res.statusCode === 200) {
        console.log('✅ SUCCESS - Raw response:', responseData);
      } else {
        console.log('❌ ERROR - Raw response:', responseData);
      }
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Request Error: ${e.message}`);
});

req.write(data);
req.end();