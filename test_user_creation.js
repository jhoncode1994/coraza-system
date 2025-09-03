const axios = require('axios');

async function testUserCreation() {
  try {
    console.log('🧪 Probando creación de usuario con campo cargo...');
    
    const newUser = {
      nombre: 'Juan Carlos',
      apellido: 'Pérez García',
      cedula: '12345678',
      zona: 1,
      fechaIngreso: '2024-03-15',
      cargo: 'Vigilante'
    };
    
    console.log('📤 Enviando datos:', JSON.stringify(newUser, null, 2));
    
    const response = await axios.post('http://localhost:3000/api/users', newUser, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const result = response.data;
    
    if (response.status === 201) {
      console.log('✅ Usuario creado exitosamente:');
      console.log('📄 Respuesta del servidor:', JSON.stringify(result, null, 2));
      
      if (result.cargo === 'Vigilante') {
        console.log('🎉 ¡ÉXITO! El campo cargo se guardó correctamente');
      } else {
        console.log('⚠️  El campo cargo no se guardó como se esperaba');
        console.log('Esperado: Vigilante');
        console.log('Recibido:', result.cargo);
      }
    } else {
      console.log('❌ Error al crear usuario:');
      console.log('Status:', response.status);
      console.log('Respuesta:', JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Error al crear usuario:');
      console.log('Status:', error.response.status);
      console.log('Respuesta:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('💥 Error durante la prueba:', error.message);
    }
  }
}

testUserCreation();
