"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
dotenv_1.default.config();
// server.ts - Servidor Express para exponer la lógica de negocio
const express_1 = tslib_1.__importDefault(require("express"));
const cors_1 = tslib_1.__importDefault(require("cors"));
const userService_1 = require("./userService");
const supplyHistoryService_1 = require("./supplyHistoryService");
const retiredAssociatesService_1 = require("./retiredAssociatesService");
const entregaDotacionService_1 = require("./entregaDotacionService");
const authService_1 = require("./authService");
const app = (0, express_1.default)();
const PORT = process.env["PORT"] || 3000;
// Habilitar CORS para el frontend
app.use((0, cors_1.default)({
    origin: 'http://localhost:4200'
}));
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// =====================================
// ENDPOINTS DE AUTENTICACIÓN
// =====================================
// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        const credentials = req.body;
        const result = await (0, authService_1.authenticateUser)(credentials);
        if (result.success) {
            res.json(result);
        }
        else {
            res.status(401).json(result);
        }
    }
    catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});
// Verificar token y obtener usuario
app.get('/api/auth/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Token no proporcionado' });
            return;
        }
        const token = authHeader.substring(7);
        const decoded = (0, authService_1.verifyToken)(token);
        if (!decoded) {
            res.status(401).json({ error: 'Token inválido' });
            return;
        }
        const user = await (0, authService_1.getUserWithPermissions)(decoded.id);
        if (!user) {
            res.status(404).json({ error: 'Usuario no encontrado' });
            return;
        }
        res.json({ user });
    }
    catch (error) {
        console.error('Error verificando token:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Crear nuevo usuario (solo para administradores)
app.post('/api/auth/users', async (req, res) => {
    try {
        const userData = req.body;
        const newUser = await (0, authService_1.createAuthUser)(userData);
        if (newUser) {
            res.status(201).json(newUser);
        }
        else {
            res.status(400).json({ error: 'Error al crear usuario' });
        }
    }
    catch (error) {
        console.error('Error creando usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// =====================================
// ENDPOINTS EXISTENTES
// =====================================
// Endpoint para historial de dotación por asociado
app.get('/api/associates/:id/supply-history', async (req, res) => {
    try {
        const history = await (0, supplyHistoryService_1.getSupplyHistoryByAssociate)(Number(req.params["id"]));
        res.json(history);
    }
    catch (err) {
        res.status(500).json({ error: 'Error al obtener historial de dotación' });
    }
});
// Endpoint para obtener todos los usuarios
app.get('/api/users', async (req, res) => {
    try {
        const users = await (0, userService_1.getAllUsers)();
        res.json(users);
    }
    catch (err) {
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});
// Endpoint para obtener un usuario por ID
// Endpoint para crear usuario
app.post('/api/users', async (req, res) => {
    try {
        const userData = req.body;
        const newUser = await (0, userService_1.createUser)(userData);
        res.status(201).json(newUser);
    }
    catch (err) {
        res.status(500).json({ error: 'Error al crear usuario' });
    }
});
// Endpoint para actualizar usuario
app.put('/api/users/:id', async (req, res) => {
    try {
        const userId = Number(req.params["id"]);
        const userData = req.body;
        const updatedUser = await (0, userService_1.updateUser)(userId, userData);
        res.json(updatedUser);
    }
    catch (err) {
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
});
app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await (0, userService_1.getUserById)(Number(req.params["id"]));
        if (user) {
            res.json(user);
        }
        else {
            res.status(404).json({ error: 'Usuario no encontrado' });
        }
    }
    catch (err) {
        res.status(500).json({ error: 'Error al obtener usuario' });
    }
});
// Endpoints para asociados retirados
// Retirar un asociado
app.post('/api/associates/:id/retire', async (req, res) => {
    try {
        const associateId = Number(req.params["id"]);
        const { retiredReason, retiredBy } = req.body;
        if (!retiredReason || !retiredBy) {
            res.status(400).json({ error: 'Motivo de retiro y usuario que procesa son requeridos' });
            return;
        }
        await (0, retiredAssociatesService_1.retireAssociate)(associateId, retiredReason, retiredBy);
        res.json({ message: 'Asociado retirado exitosamente' });
    }
    catch (error) {
        console.error('Error retirando asociado:', error);
        res.status(500).json({ error: 'Error al retirar asociado' });
    }
});
// Obtener todos los asociados retirados
app.get('/api/retired-associates', async (req, res) => {
    try {
        const retiredAssociates = await (0, retiredAssociatesService_1.getRetiredAssociates)();
        res.json(retiredAssociates);
    }
    catch (error) {
        console.error('Error obteniendo asociados retirados:', error);
        res.status(500).json({ error: 'Error al obtener asociados retirados' });
    }
});
// Obtener historial de un asociado retirado
app.get('/api/retired-associates/:id/history', async (req, res) => {
    try {
        const retiredAssociateId = Number(req.params["id"]);
        const history = await (0, retiredAssociatesService_1.getRetiredAssociateHistory)(retiredAssociateId);
        res.json(history);
    }
    catch (error) {
        console.error('Error obteniendo historial:', error);
        res.status(500).json({ error: 'Error al obtener historial del asociado retirado' });
    }
});
// Buscar asociado retirado por cédula
app.get('/api/retired-associates/search/:cedula', async (req, res) => {
    try {
        const cedula = req.params["cedula"];
        const associate = await (0, retiredAssociatesService_1.findRetiredAssociateByCedula)(cedula);
        if (associate) {
            res.json(associate);
        }
        else {
            res.status(404).json({ error: 'Asociado retirado no encontrado' });
        }
    }
    catch (error) {
        console.error('Error buscando asociado retirado:', error);
        res.status(500).json({ error: 'Error al buscar asociado retirado' });
    }
});
// Obtener estadísticas de asociados retirados
app.get('/api/retired-associates/stats', async (req, res) => {
    try {
        const stats = await (0, retiredAssociatesService_1.getRetiredAssociatesStats)();
        res.json(stats);
    }
    catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});
// Endpoints para entregas de dotación
// Obtener todas las entregas
app.get('/api/delivery', async (req, res) => {
    try {
        const entregas = await (0, entregaDotacionService_1.getAllEntregas)();
        res.json(entregas);
    }
    catch (error) {
        console.error('Error obteniendo entregas:', error);
        res.status(500).json({ error: 'Error al obtener entregas' });
    }
});
// Obtener entregas por usuario
app.get('/api/delivery/user/:userId', async (req, res) => {
    try {
        const userId = Number(req.params["userId"]);
        const entregas = await (0, entregaDotacionService_1.getEntregasByUser)(userId);
        res.json(entregas);
    }
    catch (error) {
        console.error('Error obteniendo entregas por usuario:', error);
        res.status(500).json({ error: 'Error al obtener entregas del usuario' });
    }
});
// Crear nueva entrega
app.post('/api/delivery', async (req, res) => {
    try {
        const entregaData = req.body;
        const nuevaEntrega = await (0, entregaDotacionService_1.createEntrega)(entregaData);
        res.status(201).json(nuevaEntrega);
    }
    catch (error) {
        console.error('Error creando entrega:', error);
        res.status(500).json({ error: 'Error al crear entrega' });
    }
});
// Actualizar entrega
app.put('/api/delivery/:id', async (req, res) => {
    try {
        const entregaId = Number(req.params["id"]);
        const entregaData = req.body;
        const entregaActualizada = await (0, entregaDotacionService_1.updateEntrega)(entregaId, entregaData);
        res.json(entregaActualizada);
    }
    catch (error) {
        console.error('Error actualizando entrega:', error);
        res.status(500).json({ error: 'Error al actualizar entrega' });
    }
});
// Eliminar entrega
app.delete('/api/delivery/:id', async (req, res) => {
    try {
        const entregaId = Number(req.params["id"]);
        const entregaEliminada = await (0, entregaDotacionService_1.deleteEntrega)(entregaId);
        res.json(entregaEliminada);
    }
    catch (error) {
        console.error('Error eliminando entrega:', error);
        res.status(500).json({ error: 'Error al eliminar entrega' });
    }
});
// Endpoint raíz
app.get('/', (req, res) => {
    res.send('API corriendo');
});
app.listen(PORT, () => {
    console.log(`Servidor backend escuchando en el puerto ${PORT}`);
}).on('error', (err) => {
    console.error('Error al iniciar el servidor:', err);
});
//# sourceMappingURL=server.js.map