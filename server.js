const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

// Proxy para API - redirige las peticiones /api a nuestro backend
// Por defecto, intentamos usar el mismo servidor si el backend está integrado
// Si el backend está en otro servidor, cambia la URL en las variables de entorno
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

// Middleware para redirigir solicitudes API
app.use('/api', createProxyMiddleware({ 
  target: BACKEND_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api', // No reescribimos el path en este caso
  },
}));

// Servir archivos estáticos desde la carpeta dist
app.use(express.static(path.join(__dirname, 'dist/coraza-system-angular')));

// Servir archivos estáticos desde la carpeta public para pruebas
app.use(express.static(path.join(__dirname, 'public')));

// Ruta especial para la página de prueba de API
app.get('/test-api', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/test-api.html'));
});

// Enviar todas las solicitudes no-api a index.html para que Angular Router funcione
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/coraza-system-angular/index.html'));
});

// Usar el puerto proporcionado por Render o 4200 como fallback
const port = process.env.PORT || 4200;

app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
