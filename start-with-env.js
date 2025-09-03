require('dotenv').config();
const express = require('express');

console.log('✅ Variables de entorno cargadas:');
console.log('PGHOST:', process.env.PGHOST ? 'Set' : 'Not set');
console.log('PGDATABASE:', process.env.PGDATABASE ? 'Set' : 'Not set');
console.log('PGUSER:', process.env.PGUSER ? 'Set' : 'Not set');

if (!process.env.PGHOST) {
  console.error('❌ Variables de entorno no cargadas. Verificar archivo .env');
  process.exit(1);
}

// Ahora cargar el servidor principal
require('./server.js');
