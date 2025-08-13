// server.ts - Servidor Express para exponer la lógica de negocio
import express, { Request, Response } from 'express';
import cors from 'cors';
import { getAllUsers, getUserById, createUser, updateUser, deleteUser } from './userService';

const app = express();
const PORT = process.env["PORT"] || 3000;

// Middlewares
app.use(cors({
  origin: process.env["FRONTEND_URL"] || '*', // Permitir solicitudes desde el frontend desplegado
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Middleware para manejar errores
app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Endpoint para obtener todos los usuarios
app.get('/api/users', async (req: Request, res: Response) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (err) {
    console.error('Error obteniendo usuarios:', err);
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
    console.error('Error obteniendo usuario por ID:', err);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

// Endpoint para crear un nuevo usuario
app.post('/api/users', async (req: Request, res: Response) => {
  try {
    const newUser = await createUser(req.body);
    res.status(201).json(newUser);
  } catch (err: any) {
    console.error('Error creando usuario:', err);
    // Manejo de error de cédula duplicada
    if (err.code === '23505' && err.constraint === 'usuarios_cedula_key') {
      return res.status(400).json({ error: 'Ya existe un usuario con esa cédula' });
    }
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// Endpoint para actualizar un usuario
app.put('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const updatedUser = await updateUser(Number(req.params["id"]), req.body);
    if (updatedUser) {
      res.json(updatedUser);
    } else {
      res.status(404).json({ error: 'Usuario no encontrado' });
    }
  } catch (err: any) {
    console.error('Error actualizando usuario:', err);
    // Manejo de error de cédula duplicada
    if (err.code === '23505' && err.constraint === 'usuarios_cedula_key') {
      return res.status(400).json({ error: 'Ya existe un usuario con esa cédula' });
    }
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// Endpoint para eliminar un usuario
app.delete('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const deletedUser = await deleteUser(Number(req.params["id"]));
    if (deletedUser) {
      res.json(deletedUser);
    } else {
      res.status(404).json({ error: 'Usuario no encontrado' });
    }
  } catch (err) {
    console.error('Error eliminando usuario:', err);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// Endpoint raíz
app.get('/', (req: Request, res: Response) => {
  res.send('API corriendo');
});

app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en el puerto ${PORT}`);
});
