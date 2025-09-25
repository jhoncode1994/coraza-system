const http = require('http');

async function testAvailableSizes() {
  console.log('🧪 TESTING NEW AVAILABLE SIZES ENDPOINT...\n');

  const testCases = [
    { element: 'pantalón', category: 'uniforme' },
    { element: 'camiseta', category: 'uniforme' },
    { element: 'Pantalón', category: 'uniforme' } // Test case sensitivity
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 Testing: ${testCase.element} / ${testCase.category}`);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/supply-inventory/available-sizes/${encodeURIComponent(testCase.element)}/${encodeURIComponent(testCase.category)}`,
      method: 'GET'
    };

    try {
      const response = await new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve({ status: res.statusCode, data }));
        });
        req.on('error', reject);
        req.end();
      });

      console.log(`Status: ${response.status}`);
      if (response.status === 200) {
        const parsed = JSON.parse(response.data);
        console.log(`✅ Available sizes: [${parsed.available_sizes.join(', ')}]`);
      } else {
        console.log(`❌ Error: ${response.data}`);
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
  }
}

testAvailableSizes();