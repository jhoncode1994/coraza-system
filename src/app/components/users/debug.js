// Función para depurar el mapeo entre formatos de usuario
function mapApiUserToAppUser(apiUser) {
  console.log('Mapeando usuario de API:', apiUser);
  if (!apiUser) {
    console.error('Error: apiUser es undefined o null');
    return null;
  }
  
  try {
    // Depurar para ver todas las propiedades disponibles
    console.log('Propiedades disponibles en apiUser:', Object.keys(apiUser));
    
    // Verificar específicamente la propiedad fecha_ingreso
    if (apiUser.fecha_ingreso) {
      console.log('Tiene fecha_ingreso:', apiUser.fecha_ingreso, typeof apiUser.fecha_ingreso);
    } else {
      console.log('No tiene fecha_ingreso');
    }
    
    // Verificar otras variantes del nombre
    if (apiUser.fechaingreso) {
      console.log('Tiene fechaingreso (minúsculas):', apiUser.fechaingreso);
    }
    if (apiUser.fechaIngreso) {
      console.log('Tiene fechaIngreso (camelCase):', apiUser.fechaIngreso);
    }
    
    const user = {
      id: apiUser.id,
      nombre: apiUser.nombre || '',
      apellido: apiUser.apellido || '',
      cedula: apiUser.cedula || '',
      zona: apiUser.zona || 0,
      // Usar fecha_ingreso como clave principal y tener respaldo para todas las variantes posibles
      fechaIngreso: apiUser.fecha_ingreso 
        ? new Date(apiUser.fecha_ingreso) 
        : (apiUser.fechaingreso // minúsculas
            ? new Date(apiUser.fechaingreso)
            : (apiUser.fechaIngreso // camelCase
                ? new Date(apiUser.fechaIngreso) 
                : new Date()))
    };
    
    console.log('Usuario mapeado:', user);
    console.log('fechaIngreso después de mapeo:', user.fechaIngreso);
    
    return user;
  } catch (error) {
    console.error('Error al mapear el usuario:', error, apiUser);
    return null;
  }
}

// Datos de ejemplo para probar (simular datos de la API)
const exampleApiUser = {
  "id": 1,
  "nombre": "Usuario",
  "apellido": "De Prueba",
  "cedula": "123456789",
  "zona": 1,
  "fecha_ingreso": "2023-08-14T00:00:00.000Z",
  "created_at": "2023-08-14T13:02:52.063Z",
  "updated_at": "2023-08-14T13:02:52.063Z"
};

// Ejecutar la prueba de mapeo
console.log('=== PRUEBA DE MAPEO DE USUARIO ===');
const mappedUser = mapApiUserToAppUser(exampleApiUser);
console.log('Resultado final:', mappedUser);

// Verificar si la fecha se ha mapeado correctamente
if (mappedUser && mappedUser.fechaIngreso instanceof Date) {
  console.log('✅ Fecha mapeada correctamente a Date:', 
    mappedUser.fechaIngreso.toLocaleDateString('es-ES'));
} else {
  console.log('❌ Error en el mapeo de la fecha');
}
