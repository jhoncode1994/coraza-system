// userService.ts - Ejemplo de lógica de negocio para usuarios
import { query } from './db';

export async function getAllUsers() {
  const result = await query('SELECT * FROM users');
  return result.rows;
}

export async function getUserById(id: number) {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0];
}

// Agrega aquí más funciones de negocio según tus necesidades
