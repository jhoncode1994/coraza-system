// Script de prueba para el endpoint de entrega
const data = {
  userId: 1,
  elemento: "Pantalón",
  talla: "38",
  cantidad: 1,
  fechaEntrega: new Date().toISOString(),
  observaciones: "Prueba de entrega",
  firma_url: "test-signature-url"
};

console.log('Enviando datos de prueba:', data);

fetch('http://localhost:3000/api/delivery', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data)
})
.then(response => {
  console.log('Status:', response.status);
  return response.json();
})
.then(result => {
  console.log('Respuesta exitosa:', result);
})
.catch(error => {
  console.error('Error en la petición:', error);
});