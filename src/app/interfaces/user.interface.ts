export interface User {
  id?: number;
  cedula: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  cargo?: string;
  area?: string;
  fechaIngreso?: string;
  activo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserWithDeliveries extends User {
  entregasPendientes?: number;
  ultimaEntrega?: string;
}