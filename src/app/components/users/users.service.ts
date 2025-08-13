import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from './users.component';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  // Fuente de datos de usuarios con BehaviorSubject para permitir emisión de cambios
  private usersSubject = new BehaviorSubject<User[]>([]);
  
  // Observable público que otros componentes pueden suscribir
  public users$: Observable<User[]> = this.usersSubject.asObservable();

  constructor() {
    // Inicializar con datos de ejemplo
    this.initSampleData();
  }

  // Método para obtener el array actual de usuarios
  private get currentUsers(): User[] {
    return this.usersSubject.getValue();
  }

  // Método para inicializar datos de ejemplo
  private initSampleData(): void {
    const sampleUsers: User[] = [
      {
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        cedula: '1234567890',
        zona: 1,
        fechaIngreso: new Date('2025-07-15')
      },
      {
        id: 2,
        nombre: 'María',
        apellido: 'López',
        cedula: '0987654321',
        zona: 2,
        fechaIngreso: new Date('2025-08-01')
      }
    ];
    this.usersSubject.next(sampleUsers);
  }

  // Método para obtener todos los usuarios
  getUsers(): User[] {
    return [...this.currentUsers];
  }

  // Método para añadir un nuevo usuario
  addUser(user: Omit<User, 'id'>): void {
    const newUser: User = {
      id: Date.now(),
      ...user
    };
    
    const updatedUsers = [...this.currentUsers, newUser];
    this.usersSubject.next(updatedUsers);
  }

  // Método para actualizar un usuario existente
  updateUser(index: number, userData: Partial<User>): void {
    if (index < 0 || index >= this.currentUsers.length) {
      console.error('Índice fuera de rango');
      return;
    }

    const updatedUsers = [...this.currentUsers];
    updatedUsers[index] = {
      ...updatedUsers[index],
      ...userData
    };
    
    this.usersSubject.next(updatedUsers);
  }

  // Método para eliminar un usuario
  deleteUser(index: number): void {
    if (index < 0 || index >= this.currentUsers.length) {
      console.error('Índice fuera de rango');
      return;
    }

    const updatedUsers = [...this.currentUsers];
    updatedUsers.splice(index, 1);
    this.usersSubject.next(updatedUsers);
  }
}
