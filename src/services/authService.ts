// authService.ts - Servicio de autenticación para el backend
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from './db';

const JWT_SECRET = process.env["JWT_SECRET"] || 'tu-secreto-jwt-super-seguro-cambia-esto-en-produccion';
const SALT_ROUNDS = 10;

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'delivery_user' | 'gerencia';
  fechaIngreso: Date;
  permissions: {
    canViewInventory: boolean;
    canEditInventory: boolean;
    canViewAssociates: boolean;
    canEditAssociates: boolean;
    canMakeDeliveries: boolean;
    canViewReports: boolean;
    canManageUsers: boolean;
  };
}

export interface LoginCredentials {
  email?: string;
  username?: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
}

/**
 * Hashear contraseña
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verificar contraseña
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Generar JWT token
 */
export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * Verificar JWT token
 */
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Obtener usuario con permisos por ID
 */
export async function getUserWithPermissions(userId: number): Promise<AuthUser | null> {
  try {
    const result = await query(`
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
  } catch (error) {
    console.error('Error obteniendo usuario con permisos:', error);
    return null;
  }
}

/**
 * Autenticar usuario
 */
export async function authenticateUser(credentials: LoginCredentials): Promise<LoginResponse> {
  try {
    // Buscar usuario por email o username
    const searchField = credentials.email ? 'email' : 'username';
    const searchValue = credentials.email || credentials.username;

    const result = await query(`
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
    const user: AuthUser = {
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

  } catch (error) {
    console.error('Error en autenticación:', error);
    return {
      success: false,
      error: 'Error interno del servidor'
    };
  }
}

/**
 * Crear nuevo usuario
 */
export async function createAuthUser(userData: {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'delivery_user';
  permissions: {
    canViewInventory: boolean;
    canEditInventory: boolean;
    canViewAssociates: boolean;
    canEditAssociates: boolean;
    canMakeDeliveries: boolean;
    canViewReports: boolean;
    canManageUsers: boolean;
  };
}): Promise<AuthUser | null> {
  try {
    // Hashear contraseña
    const passwordHash = await hashPassword(userData.password);

    // Insertar usuario
    const userResult = await query(`
      INSERT INTO auth_users (username, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, role, fecha_ingreso
    `, [userData.username, userData.email, passwordHash, userData.role]);

    if (userResult.rows.length === 0) {
      return null;
    }

    const user = userResult.rows[0];

    // Insertar permisos
    await query(`
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

  } catch (error) {
    console.error('Error creando usuario:', error);
    return null;
  }
}