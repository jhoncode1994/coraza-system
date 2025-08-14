import dotenv from 'dotenv';
dotenv.config();

// server.ts - Servidor Express para exponer la lógica de negocio
import express, { Request, Response } from 'express';
import cors from 'cors';
import { getAllUsers, getUserById } from './userService';
import { getSupplyHistoryByEmployee } from './supplyHistoryService';

const app = express();
const PORT = process.env["PORT"] || 3000;

// Habilitar CORS para el frontend
app.use(cors({
  origin: 'http://localhost:4200'
}));

app.use(cors());
app.use(express.json());

// Endpoint para historial de dotación por empleado
app.get('/api/employees/:id/supply-history', async (req: Request, res: Response) => {
  try {
    const history = await getSupplyHistoryByEmployee(Number(req.params["id"]));
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener historial de dotación' });
  }
});

// Endpoint para obtener todos los usuarios
app.get('/api/users', async (req: Request, res: Response) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Endpoint para obtener un usuario por ID
app.get('/api/users/:id', async (req: Request, res: Response) => {
  try {
  const user = await getUserById(Number(req.params["id"]));
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'Usuario no encontrado' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

// Endpoint raíz
app.get('/', (req: Request, res: Response) => {
  res.send('API corriendo');
});

app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en el puerto ${PORT}`);
}).on('error', (err) => {
  console.error('Error al iniciar el servidor:', err);
});
