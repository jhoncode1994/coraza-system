// userService.ts - Lógica de negocio para usuarios
import { query } from './db';

// Interfaz que refleja la estructura de la tabla de usuarios
export interface User {
  id: number;
  nombre: string;
  apellido: string;
  cedula: string;
  zona: number;
  fecha_ingreso: Date;
  created_at?: Date;
  updated_at?: Date;
}

// Obtener todos los usuarios
export async function getAllUsers() {
  const result = await query('SELECT * FROM usuarios ORDER BY id');
  return result.rows;
}

// Obtener un usuario por ID
export async function getUserById(id: number) {
  const result = await query('SELECT * FROM usuarios WHERE id = $1', [id]);
  return result.rows[0];
}

// Crear un nuevo usuario
export async function createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>) {
  const { nombre, apellido, cedula, zona, fecha_ingreso } = user;
  const result = await query(
    'INSERT INTO usuarios (nombre, apellido, cedula, zona, fecha_ingreso) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [nombre, apellido, cedula, zona, fecha_ingreso]
  );
  return result.rows[0];
}

// Actualizar un usuario existente
export async function updateUser(id: number, user: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>) {
  // Construir dinámicamente la consulta SQL según los campos proporcionados
  const setStatements = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(user)) {
    if (value !== undefined) {
      setStatements.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (setStatements.length === 0) {
    return null; // No hay nada que actualizar
  }

  values.push(id);
  const result = await query(
    `UPDATE usuarios SET ${setStatements.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows[0];
}

// Eliminar un usuario
export async function deleteUser(id: number) {
  const result = await query('DELETE FROM usuarios WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
}
