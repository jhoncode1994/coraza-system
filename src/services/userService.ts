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

export async function createUser(user: any) {
  const result = await query(
    `INSERT INTO users (nombre, apellido, cedula, zona, cargo, fecha_ingreso)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      user.nombre,
      user.apellido,
      user.cedula,
      user.zona,
      user.cargo,
      user.fecha_ingreso || new Date().toISOString().split('T')[0]
    ]
  );
  return result.rows[0];
}

export async function updateUser(id: number, user: any) {
  const result = await query(
    `UPDATE users SET nombre = $1, apellido = $2, cedula = $3, zona = $4, cargo = $5, fecha_ingreso = $6 WHERE id = $7 RETURNING *`,
    [
      user.nombre,
      user.apellido,
      user.cedula,
      user.zona,
      user.cargo,
      user.fecha_ingreso || new Date().toISOString().split('T')[0],
      id
    ]
  );
  return result.rows[0];
}
