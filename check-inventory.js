// Script para revisar el inventario actual
fetch('http://localhost:3000/api/supply-inventory')
.then(response => response.json())
.then(items => {
  console.log('=== INVENTARIO COMPLETO ===');
  console.log(`Total de elementos: ${items.length}`);
  
  console.log('\n=== ELEMENTOS CON TALLAS ===');
  const itemsConTalla = items.filter(item => item.talla);
  itemsConTalla.forEach((item, index) => {
    console.log(`${index + 1}. ID: ${item.id}, Nombre: "${item.name}", Talla: "${item.talla}", Stock: ${item.quantity}, Categoría: "${item.category}"`);
  });
  
  console.log('\n=== ELEMENTOS SIN TALLAS ===');
  const itemsSinTalla = items.filter(item => !item.talla);
  itemsSinTalla.forEach((item, index) => {
    console.log(`${index + 1}. ID: ${item.id}, Nombre: "${item.name}", Stock: ${item.quantity}, Categoría: "${item.category}"`);
  });
  
  console.log('\n=== BÚSQUEDA DE PANTALONES ===');
  const pantalones = items.filter(item => item.name.toLowerCase().includes('pantalón') || item.name.toLowerCase().includes('pantalon'));
  if (pantalones.length > 0) {
    pantalones.forEach((item, index) => {
      console.log(`${index + 1}. ID: ${item.id}, Nombre: "${item.name}", Talla: "${item.talla || 'Sin talla'}", Stock: ${item.quantity}, Categoría: "${item.category}"`);
    });
  } else {
    console.log('No se encontraron elementos que contengan "pantalón"');
    
    // Buscar por categoría "uniforme"
    console.log('\n=== ELEMENTOS DE CATEGORÍA UNIFORME ===');
    const uniformes = items.filter(item => item.category && item.category.toLowerCase().includes('uniforme'));
    uniformes.forEach((item, index) => {
      console.log(`${index + 1}. ID: ${item.id}, Nombre: "${item.name}", Talla: "${item.talla || 'Sin talla'}", Stock: ${item.quantity}, Categoría: "${item.category}"`);
    });
  }
})
.catch(error => {
  console.error('Error obteniendo inventario:', error);
});