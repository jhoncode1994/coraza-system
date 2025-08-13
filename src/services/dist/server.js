"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
// server.ts - Servidor Express para exponer la lógica de negocio
const express_1 = tslib_1.__importDefault(require("express"));
const cors_1 = tslib_1.__importDefault(require("cors"));
const userService_1 = require("./userService");
const app = (0, express_1.default)();
const PORT = process.env["PORT"] || 3000;
// Middlewares
app.use((0, cors_1.default)({
    origin: process.env["FRONTEND_URL"] || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
// Middleware para manejar errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
});
// Endpoint para obtener todos los usuarios
app.get('/api/users', async (req, res) => {
    try {
        const users = await (0, userService_1.getAllUsers)();
        res.json(users);
    }
    catch (err) {
        console.error('Error obteniendo usuarios:', err);
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
        console.error('Error obteniendo usuario por ID:', err);
        res.status(500).json({ error: 'Error al obtener usuario' });
    }
});
// Endpoint para crear un nuevo usuario
app.post('/api/users', async (req, res) => {
    try {
        const newUser = await (0, userService_1.createUser)(req.body);
        return res.status(201).json(newUser);
    }
    catch (err) {
        console.error('Error creando usuario:', err);
        // Manejo de error de cédula duplicada
        if (err.code === '23505' && err.constraint === 'usuarios_cedula_key') {
            return res.status(400).json({ error: 'Ya existe un usuario con esa cédula' });
        }
        return res.status(500).json({ error: 'Error al crear usuario' });
    }
});
// Endpoint para actualizar un usuario
app.put('/api/users/:id', async (req, res) => {
    try {
        const updatedUser = await (0, userService_1.updateUser)(Number(req.params["id"]), req.body);
        if (updatedUser) {
            return res.json(updatedUser);
        }
        else {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
    }
    catch (err) {
        console.error('Error actualizando usuario:', err);
        // Manejo de error de cédula duplicada
        if (err.code === '23505' && err.constraint === 'usuarios_cedula_key') {
            return res.status(400).json({ error: 'Ya existe un usuario con esa cédula' });
        }
        return res.status(500).json({ error: 'Error al actualizar usuario' });
    }
});
// Endpoint para eliminar un usuario
app.delete('/api/users/:id', async (req, res) => {
    try {
        const deletedUser = await (0, userService_1.deleteUser)(Number(req.params["id"]));
        if (deletedUser) {
            res.json(deletedUser);
        }
        else {
            res.status(404).json({ error: 'Usuario no encontrado' });
        }
    }
    catch (err) {
        console.error('Error eliminando usuario:', err);
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
});
// Endpoint raíz
app.get('/', (req, res) => {
    res.send('API corriendo');
});
app.listen(PORT, () => {
    console.log(`Servidor backend escuchando en el puerto ${PORT}`);
});
//# sourceMappingURL=server.js.map