const { Client } = require('pg');

// Usar las mismas credenciales que el servidor de desarrollo local (puerto 3000)
async function testNewEndpoint() {
  try {
    console.log('🧪 TESTING NEW ENDPOINT FOR AVAILABLE SIZES...\n');

    // Test via HTTP request to our local server
    const fetch = require('node-fetch');
    const baseUrl = 'http://localhost:3000';
    
    // Test para pantalón
    console.log('=== TESTING: Pantalón ===');
    const responseP = await fetch(`${baseUrl}/api/supply-inventory/available-sizes/pantalón/uniforme`);
    
    if (responseP.ok) {
      const dataP = await responseP.json();
      console.log('✅ SUCCESS - Pantalón sizes:', dataP);
    } else {
      const errorP = await responseP.text();
      console.log('❌ ERROR - Pantalón:', responseP.status, errorP);
    }

    // Test para camiseta  
    console.log('\n=== TESTING: Camiseta ===');
    const responseC = await fetch(`${baseUrl}/api/supply-inventory/available-sizes/camiseta/uniforme`);
    
    if (responseC.ok) {
      const dataC = await responseC.json();
      console.log('✅ SUCCESS - Camiseta sizes:', dataC);
    } else {
      const errorC = await responseC.text();
      console.log('❌ ERROR - Camiseta:', responseC.status, errorC);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testNewEndpoint();