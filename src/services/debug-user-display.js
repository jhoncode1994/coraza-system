// Programa de prueba para diagnosticar el problema de visualización de usuarios

// Importar los módulos necesarios
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Configurar la conexión a la base de datos usando variables de entorno
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: process.env.DB_HOST.includes('neon') ? { rejectUnauthorized: false } : false
});

// Función para obtener todos los usuarios directamente de la base de datos
async function getAllUsersFromDB() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM usuarios ORDER BY id');
    client.release();
    return result.rows;
  } catch (err) {
    console.error('Error consultando la base de datos:', err);
    return [];
  }
}

// Función para mapear un usuario de la API al formato de la aplicación (snake_case a camelCase)
function mapApiUserToAppUser(apiUser) {
  if (!apiUser) {
    console.error('Error: apiUser es undefined o null');
    return null;
  }
  
  try {
    // Crear un nuevo objeto mapeando las propiedades
    const user = {
      id: apiUser.id,
      nombre: apiUser.nombre,
      apellido: apiUser.apellido,
      cedula: apiUser.cedula,
      zona: apiUser.zona,
      // Aquí está el mapeo clave: convertir fecha_ingreso a fechaIngreso
      fechaIngreso: apiUser.fecha_ingreso 
        ? new Date(apiUser.fecha_ingreso) 
        : null
    };
    
    return user;
  } catch (error) {
    console.error('Error al mapear el usuario:', error, apiUser);
    return null;
  }
}

// Función para realizar una solicitud HTTP a la API local
async function fetchFromApi(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: endpoint,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Error parsing JSON: ${e.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Función principal para ejecutar el diagnóstico
async function runDiagnostics() {
  console.log('\n=============== DIAGNÓSTICO DE VISUALIZACIÓN DE USUARIOS ===============\n');

  try {
    // 1. Comprobar la conexión a la base de datos
    console.log('1. Comprobando conexión a la base de datos...');
    const client = await pool.connect();
    console.log('✅ Conexión a la base de datos exitosa');
    
    // 2. Obtener usuarios directamente de la base de datos
    console.log('\n2. Obteniendo usuarios directamente de la base de datos...');
    const dbUsers = await getAllUsersFromDB();
    console.log(`Encontrados ${dbUsers.length} usuarios en la base de datos:`);
    if (dbUsers.length > 0) {
      console.log(JSON.stringify(dbUsers[0], null, 2));
      
      // Mostrar los nombres de las propiedades
      console.log('\nNombres de propiedades en la base de datos:');
      console.log(Object.keys(dbUsers[0]));
      
      // Verificar específicamente fecha_ingreso
      if (dbUsers[0].fecha_ingreso) {
        console.log(`\nfecha_ingreso existe en formato: ${typeof dbUsers[0].fecha_ingreso}`);
        console.log(`Valor de fecha_ingreso: ${dbUsers[0].fecha_ingreso}`);
      } else {
        console.log('\n❌ La propiedad fecha_ingreso no existe en los datos');
      }
    }
    
    // 3. Intentar obtener usuarios desde la API
    console.log('\n3. Intentando obtener usuarios desde la API...');
    try {
      const apiUsers = await fetchFromApi('/api/users');
      console.log(`Encontrados ${apiUsers.length} usuarios desde la API:`);
      if (apiUsers.length > 0) {
        console.log(JSON.stringify(apiUsers[0], null, 2));
        
        // Mostrar los nombres de las propiedades
        console.log('\nNombres de propiedades en la respuesta de la API:');
        console.log(Object.keys(apiUsers[0]));
        
        // Verificar específicamente fecha_ingreso
        if (apiUsers[0].fecha_ingreso) {
          console.log(`\nfecha_ingreso existe en formato: ${typeof apiUsers[0].fecha_ingreso}`);
          console.log(`Valor de fecha_ingreso: ${apiUsers[0].fecha_ingreso}`);
        } else {
          console.log('\n❌ La propiedad fecha_ingreso no existe en la respuesta de la API');
        }
      }
    } catch (error) {
      console.error('\n❌ Error obteniendo usuarios desde la API:', error.message);
      console.log('Nota: Asegúrate de que el servidor Express esté ejecutándose en el puerto 3000');
    }
    
    // 4. Probar el mapeo entre formatos
    console.log('\n4. Probando el mapeo entre formatos API y Aplicación...');
    if (dbUsers.length > 0) {
      const mappedUser = mapApiUserToAppUser(dbUsers[0]);
      console.log('Usuario mapeado (snake_case a camelCase):');
      console.log(JSON.stringify(mappedUser, null, 2));
      
      if (mappedUser && mappedUser.fechaIngreso) {
        console.log('\n✅ La propiedad fechaIngreso se ha mapeado correctamente');
      } else {
        console.log('\n❌ Error al mapear la propiedad fechaIngreso');
      }
    }
    
    console.log('\n=============== FIN DEL DIAGNÓSTICO ===============\n');
  } catch (err) {
    console.error('Error durante el diagnóstico:', err);
  } finally {
    pool.end();
  }
}

// Ejecutar el diagnóstico
runDiagnostics();
