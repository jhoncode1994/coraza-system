import dotenv from 'dotenv';
dotenv.config();

// server.ts - Servidor Express para exponer la lógica de negocio
import express, { Request, Response } from 'express';
import cors from 'cors';
import { getAllUsers, getUserById, createUser, updateUser } from './userService';
import { getSupplyHistoryByAssociate } from './supplyHistoryService';
import { 
  retireAssociate, 
  getRetiredAssociates, 
  getRetiredAssociateHistory,
  findRetiredAssociateByCedula,
  getRetiredAssociatesStats 
} from './retiredAssociatesService';
import { 
  getAllEntregas, 
  getEntregasByUser, 
  createEntrega, 
  updateEntrega, 
  deleteEntrega 
} from './entregaDotacionService';
import { 
  authenticateUser, 
  getUserWithPermissions, 
  createAuthUser,
  verifyToken 
} from './authService';

const app = express();
const PORT = process.env["PORT"] || 3000;

// Habilitar CORS para el frontend
app.use(cors({
  origin: 'http://localhost:4200'
}));

app.use(cors());
app.use(express.json());

// =====================================
// ENDPOINTS DE AUTENTICACIÓN
// =====================================

// Login endpoint
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const credentials = req.body;
    const result = await authenticateUser(credentials);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// Verificar token y obtener usuario
app.get('/api/auth/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token no proporcionado' });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      res.status(401).json({ error: 'Token inválido' });
      return;
    }

    const user = await getUserWithPermissions(decoded.id);
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Error verificando token:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear nuevo usuario (solo para administradores)
app.post('/api/auth/users', async (req: Request, res: Response) => {
  try {
    const userData = req.body;
    const newUser = await createAuthUser(userData);
    
    if (newUser) {
      res.status(201).json(newUser);
    } else {
      res.status(400).json({ error: 'Error al crear usuario' });
    }
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =====================================
// ENDPOINTS EXISTENTES
// =====================================

// Endpoint para historial de dotación por asociado
app.get('/api/associates/:id/supply-history', async (req: Request, res: Response) => {
  try {
    const history = await getSupplyHistoryByAssociate(Number(req.params["id"]));
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
// Endpoint para crear usuario
app.post('/api/users', async (req: Request, res: Response) => {
  try {
    const userData = req.body;
    const newUser = await createUser(userData);
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// Endpoint para actualizar usuario
app.put('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params["id"]);
    const userData = req.body;
    const updatedUser = await updateUser(userId, userData);
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});
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

// Endpoints para asociados retirados

// Retirar un asociado
app.post('/api/associates/:id/retire', async (req: Request, res: Response): Promise<void> => {
  try {
    const associateId = Number(req.params["id"]);
    const { retiredReason, retiredBy } = req.body;
    
    if (!retiredReason || !retiredBy) {
      res.status(400).json({ error: 'Motivo de retiro y usuario que procesa son requeridos' });
      return;
    }
    
    await retireAssociate(associateId, retiredReason, retiredBy);
    res.json({ message: 'Asociado retirado exitosamente' });
  } catch (error) {
    console.error('Error retirando asociado:', error);
    res.status(500).json({ error: 'Error al retirar asociado' });
  }
});

// Obtener todos los asociados retirados
app.get('/api/retired-associates', async (req: Request, res: Response) => {
  try {
    const retiredAssociates = await getRetiredAssociates();
    res.json(retiredAssociates);
  } catch (error) {
    console.error('Error obteniendo asociados retirados:', error);
    res.status(500).json({ error: 'Error al obtener asociados retirados' });
  }
});

// Obtener historial de un asociado retirado
app.get('/api/retired-associates/:id/history', async (req: Request, res: Response) => {
  try {
    const retiredAssociateId = Number(req.params["id"]);
    const history = await getRetiredAssociateHistory(retiredAssociateId);
    res.json(history);
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({ error: 'Error al obtener historial del asociado retirado' });
  }
});

// Buscar asociado retirado por cédula
app.get('/api/retired-associates/search/:cedula', async (req: Request, res: Response) => {
  try {
    const cedula = req.params["cedula"];
    const associate = await findRetiredAssociateByCedula(cedula);
    if (associate) {
      res.json(associate);
    } else {
      res.status(404).json({ error: 'Asociado retirado no encontrado' });
    }
  } catch (error) {
    console.error('Error buscando asociado retirado:', error);
    res.status(500).json({ error: 'Error al buscar asociado retirado' });
  }
});

// Obtener estadísticas de asociados retirados
app.get('/api/retired-associates/stats', async (req: Request, res: Response) => {
  try {
    const stats = await getRetiredAssociatesStats();
    res.json(stats);
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// Endpoints para entregas de dotación

// Obtener todas las entregas
app.get('/api/delivery', async (req: Request, res: Response) => {
  try {
    const entregas = await getAllEntregas();
    res.json(entregas);
  } catch (error) {
    console.error('Error obteniendo entregas:', error);
    res.status(500).json({ error: 'Error al obtener entregas' });
  }
});

// Obtener entregas por usuario
app.get('/api/delivery/user/:userId', async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params["userId"]);
    const entregas = await getEntregasByUser(userId);
    res.json(entregas);
  } catch (error) {
    console.error('Error obteniendo entregas por usuario:', error);
    res.status(500).json({ error: 'Error al obtener entregas del usuario' });
  }
});

// Crear nueva entrega
app.post('/api/delivery', async (req: Request, res: Response) => {
  try {
    const entregaData = req.body;
    const nuevaEntrega = await createEntrega(entregaData);
    res.status(201).json(nuevaEntrega);
  } catch (error) {
    console.error('Error creando entrega:', error);
    res.status(500).json({ error: 'Error al crear entrega' });
  }
});

// Actualizar entrega
app.put('/api/delivery/:id', async (req: Request, res: Response) => {
  try {
    const entregaId = Number(req.params["id"]);
    const entregaData = req.body;
    const entregaActualizada = await updateEntrega(entregaId, entregaData);
    res.json(entregaActualizada);
  } catch (error) {
    console.error('Error actualizando entrega:', error);
    res.status(500).json({ error: 'Error al actualizar entrega' });
  }
});

// Eliminar entrega
app.delete('/api/delivery/:id', async (req: Request, res: Response) => {
  try {
    const entregaId = Number(req.params["id"]);
    const entregaEliminada = await deleteEntrega(entregaId);
    res.json(entregaEliminada);
  } catch (error) {
    console.error('Error eliminando entrega:', error);
    res.status(500).json({ error: 'Error al eliminar entrega' });
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
