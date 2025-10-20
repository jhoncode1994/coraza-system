"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthUser = exports.authenticateUser = exports.getUserWithPermissions = exports.verifyToken = exports.generateToken = exports.verifyPassword = exports.hashPassword = void 0;
const tslib_1 = require("tslib");
// authService.ts - Servicio de autenticación para el backend
const bcrypt_1 = tslib_1.__importDefault(require("bcrypt"));
const jsonwebtoken_1 = tslib_1.__importDefault(require("jsonwebtoken"));
const db_1 = require("./db");
const JWT_SECRET = process.env["JWT_SECRET"] || 'tu-secreto-jwt-super-seguro-cambia-esto-en-produccion';
const SALT_ROUNDS = 10;
/**
 * Hashear contraseña
 */
async function hashPassword(password) {
    return bcrypt_1.default.hash(password, SALT_ROUNDS);
}
exports.hashPassword = hashPassword;
/**
 * Verificar contraseña
 */
async function verifyPassword(password, hashedPassword) {
    return bcrypt_1.default.compare(password, hashedPassword);
}
exports.verifyPassword = verifyPassword;
/**
 * Generar JWT token
 */
function generateToken(user) {
    return jsonwebtoken_1.default.sign({
        id: user.id,
        email: user.email,
        role: user.role
    }, JWT_SECRET, { expiresIn: '24h' });
}
exports.generateToken = generateToken;
/**
 * Verificar JWT token
 */
function verifyToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (error) {
        return null;
    }
}
exports.verifyToken = verifyToken;
/**
 * Obtener usuario con permisos por ID
 */
async function getUserWithPermissions(userId) {
    try {
        const result = await (0, db_1.query)(`
      SELECT 
        au.id,
        au.username,
        au.email,
        au.role,
        au.fecha_ingreso,
        up.can_view_inventory,
        up.can_edit_inventory,
        up.can_view_associates,
        up.can_edit_associates,
        up.can_make_deliveries,
        up.can_view_reports,
        up.can_manage_users
      FROM auth_users au
      LEFT JOIN user_permissions up ON au.id = up.user_id
      WHERE au.id = $1 AND au.is_active = true
    `, [userId]);
        if (result.rows.length === 0) {
            return null;
        }
        const row = result.rows[0];
        return {
            id: row.id,
            username: row.username,
            email: row.email,
            role: row.role,
            fechaIngreso: row.fecha_ingreso,
            permissions: {
                canViewInventory: row.can_view_inventory || false,
                canEditInventory: row.can_edit_inventory || false,
                canViewAssociates: row.can_view_associates || false,
                canEditAssociates: row.can_edit_associates || false,
                canMakeDeliveries: row.can_make_deliveries || false,
                canViewReports: row.can_view_reports || false,
                canManageUsers: row.can_manage_users || false,
            }
        };
    }
    catch (error) {
        console.error('Error obteniendo usuario con permisos:', error);
        return null;
    }
}
exports.getUserWithPermissions = getUserWithPermissions;
/**
 * Autenticar usuario
 */
async function authenticateUser(credentials) {
    try {
        // Buscar usuario por email o username
        const searchField = credentials.email ? 'email' : 'username';
        const searchValue = credentials.email || credentials.username;
        const result = await (0, db_1.query)(`
      SELECT 
        au.id,
        au.username,
        au.email,
        au.password_hash,
        au.role,
        au.fecha_ingreso,
        up.can_view_inventory,
        up.can_edit_inventory,
        up.can_view_associates,
        up.can_edit_associates,
        up.can_make_deliveries,
        up.can_view_reports,
        up.can_manage_users
      FROM auth_users au
      LEFT JOIN user_permissions up ON au.id = up.user_id
      WHERE au.${searchField} = $1 AND au.is_active = true
    `, [searchValue]);
        if (result.rows.length === 0) {
            return {
                success: false,
                error: 'Usuario no encontrado'
            };
        }
        const row = result.rows[0];
        // Verificar contraseña
        const isValidPassword = await verifyPassword(credentials.password, row.password_hash);
        if (!isValidPassword) {
            return {
                success: false,
                error: 'Contraseña incorrecta'
            };
        }
        // Crear objeto usuario
        const user = {
            id: row.id,
            username: row.username,
            email: row.email,
            role: row.role,
            fechaIngreso: row.fecha_ingreso,
            permissions: {
                canViewInventory: row.can_view_inventory || false,
                canEditInventory: row.can_edit_inventory || false,
                canViewAssociates: row.can_view_associates || false,
                canEditAssociates: row.can_edit_associates || false,
                canMakeDeliveries: row.can_make_deliveries || false,
                canViewReports: row.can_view_reports || false,
                canManageUsers: row.can_manage_users || false,
            }
        };
        // Generar token
        const token = generateToken(user);
        return {
            success: true,
            user,
            token
        };
    }
    catch (error) {
        console.error('Error en autenticación:', error);
        return {
            success: false,
            error: 'Error interno del servidor'
        };
    }
}
exports.authenticateUser = authenticateUser;
/**
 * Crear nuevo usuario
 */
async function createAuthUser(userData) {
    try {
        // Hashear contraseña
        const passwordHash = await hashPassword(userData.password);
        // Insertar usuario
        const userResult = await (0, db_1.query)(`
      INSERT INTO auth_users (username, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, role, fecha_ingreso
    `, [userData.username, userData.email, passwordHash, userData.role]);
        if (userResult.rows.length === 0) {
            return null;
        }
        const user = userResult.rows[0];
        // Insertar permisos
        await (0, db_1.query)(`
      INSERT INTO user_permissions (
        user_id, 
        can_view_inventory, 
        can_edit_inventory, 
        can_view_associates, 
        can_edit_associates, 
        can_make_deliveries, 
        can_view_reports, 
        can_manage_users
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
            user.id,
            userData.permissions.canViewInventory,
            userData.permissions.canEditInventory,
            userData.permissions.canViewAssociates,
            userData.permissions.canEditAssociates,
            userData.permissions.canMakeDeliveries,
            userData.permissions.canViewReports,
            userData.permissions.canManageUsers
        ]);
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            fechaIngreso: user.fecha_ingreso,
            permissions: userData.permissions
        };
    }
    catch (error) {
        console.error('Error creando usuario:', error);
        return null;
    }
}
exports.createAuthUser = createAuthUser;
//# sourceMappingURL=authService.js.map