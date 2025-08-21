"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
dotenv_1.default.config();
// server.ts - Servidor Express para exponer la lógica de negocio
const express_1 = require("express");
const cors_1 = require("cors");
const userService_1 = require("./userService");
const supplyHistoryService_1 = require("./supplyHistoryService");
const retiredAssociatesService_1 = require("./retiredAssociatesService");
const app = (0, express_1.default)();
const PORT = process.env["PORT"] || 3000;
// Habilitar CORS para el frontend
app.use((0, cors_1.default)({
    origin: 'http://localhost:4200'
}));
app.use((0, cors_1.default)());
app.use(express_1.default.json());
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
            return res.status(400).json({ error: 'Motivo de retiro y usuario que procesa son requeridos' });
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
// Endpoint raíz
app.get('/', (req, res) => {
    res.send('API corriendo');
});
app.listen(PORT, () => {
    console.log(`Servidor backend escuchando en el puerto ${PORT}`);
}).on('error', (err) => {
    console.error('Error al iniciar el servidor:', err);
});
