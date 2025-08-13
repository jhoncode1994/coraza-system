const express = require('express');
const path = require('path');
const app = express();

// Servir archivos estáticos desde la carpeta dist
app.use(express.static(path.join(__dirname, 'dist/coraza-system-angular')));

// Enviar todas las solicitudes a index.html para que Angular Router funcione
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/coraza-system-angular/index.html'));
});

// Usar el puerto proporcionado por Render o 4200 como fallback
const port = process.env.PORT || 4200;

app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
