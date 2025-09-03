const http = require('http');

const postData = JSON.stringify({
  nombre: "Juan Carlos",
  apellido: "Perez Garcia",
  cedula: "12345678",
  zona: 1,
  fechaIngreso: "2024-03-15",
  cargo: "Vigilante"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/users',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🧪 Probando creación de usuario con campo cargo...');
console.log('📤 Enviando datos:', postData);

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('📄 Respuesta del servidor:', data);
    
    try {
      const result = JSON.parse(data);
      if (res.statusCode === 201) {
        console.log('✅ Usuario creado exitosamente');
        if (result.cargo === 'Vigilante') {
          console.log('🎉 ¡ÉXITO! El campo cargo se guardó correctamente');
        } else {
          console.log('⚠️ El campo cargo no se guardó como se esperaba');
          console.log('Esperado: Vigilante');
          console.log('Recibido:', result.cargo);
        }
      } else {
        console.log('❌ Error al crear usuario');
      }
    } catch (error) {
      console.log('Error parseando respuesta:', error.message);
    }
  });
});

req.on('error', (error) => {
  console.error('💥 Error durante la prueba:', error.message);
});

req.write(postData);
req.end();
