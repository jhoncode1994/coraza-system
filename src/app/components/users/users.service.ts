import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, finalize, map, tap, throwError } from 'rxjs';
import { User } from './users.component';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  // URL de la API - Configúrala según tu entorno
  private apiUrl = '/api/users'; // Esto usará la URL base del navegador + /api/users
  
  // Fuente de datos de usuarios con BehaviorSubject para permitir emisión de cambios
  private usersSubject = new BehaviorSubject<User[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  
  // Observables públicos que otros componentes pueden suscribir
  public users$: Observable<User[]> = this.usersSubject.asObservable();
  public loading$: Observable<boolean> = this.loadingSubject.asObservable();
  public error$: Observable<string | null> = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {
    // Cargar usuarios al inicializar el servicio
    this.loadUsers();
  }

  // Método para obtener el array actual de usuarios (local cache)
  private get currentUsers(): User[] {
    return this.usersSubject.getValue();
  }

  // Método para cargar usuarios desde la API
  loadUsers(): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    
    this.http.get<User[]>(this.apiUrl)
      .pipe(
        map((users) => users.map(user => this.mapApiUserToAppUser(user))),
        catchError(this.handleError),
        finalize(() => this.loadingSubject.next(false))
      )
      .subscribe({
        next: (users) => this.usersSubject.next(users),
        error: (err) => this.errorSubject.next(err)
      });
  }

  // Método para obtener todos los usuarios (del cache local)
  getUsers(): User[] {
    return [...this.currentUsers];
  }

  // Método para añadir un nuevo usuario
  addUser(user: Omit<User, 'id'>): Observable<User> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    // Adaptar el formato de fecha para la API
    const apiUser = this.mapAppUserToApiUser(user as User);
    
    return this.http.post<any>(this.apiUrl, apiUser).pipe(
      map(user => this.mapApiUserToAppUser(user)),
      tap(newUser => {
        const updatedUsers = [...this.currentUsers, newUser];
        this.usersSubject.next(updatedUsers);
      }),
      catchError(this.handleError),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  // Método para actualizar un usuario existente
  updateUser(id: number, userData: Partial<User>): Observable<User> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    // Adaptar el formato de fecha para la API
    const apiUser = this.mapAppUserToApiUser(userData as User, true);
    
    return this.http.put<any>(`${this.apiUrl}/${id}`, apiUser).pipe(
      map(user => this.mapApiUserToAppUser(user)),
      tap(updatedUser => {
        const users = this.currentUsers;
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
          const updatedUsers = [...users];
          updatedUsers[index] = updatedUser;
          this.usersSubject.next(updatedUsers);
        }
      }),
      catchError(this.handleError),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  // Método para eliminar un usuario
  deleteUser(id: number): Observable<User> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(user => this.mapApiUserToAppUser(user)),
      tap(deletedUser => {
        const users = this.currentUsers.filter(user => user.id !== id);
        this.usersSubject.next(users);
      }),
      catchError(this.handleError),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  // Helper para manejar errores HTTP
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ha ocurrido un error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // El backend devolvió un código de error
      errorMessage = error.error?.error || `Código ${error.status}: ${error.message}`;
    }
    
    return throwError(() => errorMessage);
  }

  // Método para convertir fechas y formatos entre la API y la aplicación
  private mapApiUserToAppUser(apiUser: any): User {
    return {
      id: apiUser.id,
      nombre: apiUser.nombre,
      apellido: apiUser.apellido,
      cedula: apiUser.cedula,
      zona: apiUser.zona,
      fechaIngreso: apiUser.fecha_ingreso ? new Date(apiUser.fecha_ingreso) : new Date()
    };
  }

  // Método para convertir el formato de usuario de la aplicación al formato de la API
  private mapAppUserToApiUser(appUser: User, isUpdate: boolean = false): any {
    const apiUser: any = {
      nombre: appUser.nombre,
      apellido: appUser.apellido,
      cedula: appUser.cedula,
      zona: appUser.zona
    };
    
    // Solo incluir la fecha si está definida o si es una creación (no actualización)
    if (appUser.fechaIngreso || !isUpdate) {
      apiUser.fecha_ingreso = appUser.fechaIngreso instanceof Date 
        ? appUser.fechaIngreso.toISOString().split('T')[0] 
        : appUser.fechaIngreso;
    }
    
    return apiUser;
  }
}
