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
const app = (0, express_1.default)();
const PORT = process.env["PORT"] || 3000;
// Habilitar CORS para el frontend
app.use((0, cors_1.default)({
    origin: 'http://localhost:4200'
}));
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Endpoint para historial de dotación por empleado
app.get('/api/employees/:id/supply-history', async (req, res) => {
    try {
        const history = await (0, supplyHistoryService_1.getSupplyHistoryByEmployee)(Number(req.params["id"]));
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