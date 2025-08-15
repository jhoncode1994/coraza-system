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
    
    console.log('Cargando usuarios desde la API:', this.apiUrl);
    
    // Cargar directamente los datos sin verificar cabeceras (simplificado)
    this.http.get<any[]>(this.apiUrl)
      .pipe(
        tap(response => {
          console.log('Respuesta API /users:', response);
          console.log('Tipo de respuesta:', typeof response);
          if (Array.isArray(response)) {
            console.log('Es un array con', response.length, 'elementos');
            if (response.length > 0) {
              console.log('Ejemplo de un registro:', response[0]);
              console.log('Propiedades disponibles:', Object.keys(response[0]));
            }
          } else {
            console.log('No es un array');
          }
        }),
        map((users) => {
          if (!Array.isArray(users)) {
            console.error('La respuesta no es un array:', users);
            return [];
          }
          return users.map(user => this.mapApiUserToAppUser(user))
            .filter(user => user !== null); // Filtrar usuarios nulos
        }),
        catchError((error) => {
          console.error('Error al cargar usuarios:', error);
          return this.handleError(error);
        }),
        finalize(() => this.loadingSubject.next(false))
      )
      .subscribe({
        next: (users) => {
          console.log('Usuarios mapeados correctamente:', users);
          this.usersSubject.next(users);
        },
        error: (err) => {
          console.error('Error en la suscripción de usuarios:', err);
          this.errorSubject.next(err);
        }
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
    
    console.log('UsersService.addUser - Datos originales:', user);
    console.log('UsersService.addUser - Datos mapeados para API:', apiUser);
    console.log('UsersService.addUser - Enviando POST a:', this.apiUrl);
    
    return this.http.post<any>(this.apiUrl, apiUser).pipe(
      tap(response => {
        console.log('UsersService.addUser - Respuesta del servidor:', response);
      }),
      map(user => this.mapApiUserToAppUser(user)),
      tap(newUser => {
        const updatedUsers = [...this.currentUsers, newUser];
        this.usersSubject.next(updatedUsers);
      }),
      catchError((error) => {
        console.error('UsersService.addUser - Error completo:', error);
        console.error('UsersService.addUser - Error status:', error.status);
        console.error('UsersService.addUser - Error message:', error.message);
        console.error('UsersService.addUser - Error body:', error.error);
        return this.handleError(error);
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  // Método para actualizar un usuario existente
  updateUser(id: number, userData: Partial<User>): Observable<User> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    console.log('Datos a actualizar:', userData);
    
    // Adaptar el formato de fecha para la API
    const apiUser = this.mapAppUserToApiUser(userData as User, true);
    
    console.log('Datos mapeados para la API:', apiUser);
    
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
      errorMessage = `Error del cliente: ${error.error.message}`;
      console.error('Error del cliente:', error.error.message);
    } else {
      // El backend devolvió un código de error
      errorMessage = error.error?.error || `Código ${error.status}: ${error.message}`;
      console.error('Error del servidor:', {
        status: error.status,
        statusText: error.statusText,
        message: error.message,
        error: error.error,
        url: error.url
      });
    }
    
    // Log adicional para depuración
    console.log('Error completo:', error);
    
    return throwError(() => errorMessage);
  }

  // Método para convertir fechas y formatos entre la API y la aplicación
  private mapApiUserToAppUser(apiUser: any): User {
    console.log('Mapeando usuario de API:', apiUser);
    if (!apiUser) {
      console.error('Error: apiUser es undefined o null');
      return null as any; // Devolver un valor para evitar errores, aunque sea null
    }
    
    try {
      // Depurar para ver todas las propiedades disponibles
      console.log('Propiedades disponibles en apiUser:', Object.keys(apiUser));
      
      // Verificar las propiedades fecha antes de proceder
      if (apiUser.fecha_ingreso) {
        console.log('Encontrado fecha_ingreso (snake_case):', apiUser.fecha_ingreso);
      } else if (apiUser.fechaingreso) {
        console.log('Encontrado fechaingreso (minúsculas):', apiUser.fechaingreso);
      } else if (apiUser.fechaIngreso) {
        console.log('Encontrado fechaIngreso (camelCase):', apiUser.fechaIngreso);
      } else {
        console.log('No se encontró ningún campo de fecha en el usuario:', apiUser.id);
      }
      
      const user = {
        id: apiUser.id,
        nombre: apiUser.nombre || '',
        apellido: apiUser.apellido || '',
        cedula: apiUser.cedula || '',
        zona: apiUser.zona || 0,
        // Usar fecha_ingreso como clave principal y tener respaldo para todas las variantes posibles
        fechaIngreso: apiUser.fecha_ingreso 
          ? new Date(apiUser.fecha_ingreso) 
          : (apiUser.fechaingreso // minúsculas
              ? new Date(apiUser.fechaingreso)
              : (apiUser.fechaIngreso // camelCase
                  ? new Date(apiUser.fechaIngreso) 
                  : new Date()))
      };
      // Verificar la fecha después del mapeo
      if (user.fechaIngreso instanceof Date) {
        console.log(`Fecha mapeada correctamente: ${user.fechaIngreso.toLocaleDateString('es-ES')}`);
      } else if (user.fechaIngreso) {
        console.log(`Fecha en formato no Date: ${user.fechaIngreso}`);
        // Intentar convertir a Date si es un string
        try {
          user.fechaIngreso = new Date(user.fechaIngreso);
          console.log(`Convertida a Date: ${user.fechaIngreso.toLocaleDateString('es-ES')}`);
        } catch (error) {
          console.error('Error al convertir fecha:', error);
        }
      } else {
        console.log('No hay fecha disponible, usando fecha actual');
        user.fechaIngreso = new Date();
      }
      
      console.log('Usuario mapeado para App:', user);
      return user;
    } catch (error) {
      console.error('Error al mapear el usuario:', error, apiUser);
      // Crear un usuario básico con los datos mínimos
      return {
        id: apiUser?.id || 0,
        nombre: apiUser?.nombre || '',
        apellido: apiUser?.apellido || '',
        cedula: apiUser?.cedula || '',
        zona: apiUser?.zona || 0,
        fechaIngreso: new Date()
      } as User;
    }
  }

  // Método para convertir el formato de usuario de la aplicación al formato de la API
  private mapAppUserToApiUser(appUser: User, isUpdate: boolean = false): any {
    const apiUser: any = {
      nombre: appUser.nombre,
      apellido: appUser.apellido,
      cedula: appUser.cedula,
      zona: appUser.zona
    };
    
    // Manejar la conversión de la fecha con mejor gestión de errores
    if (appUser.fechaIngreso || !isUpdate) {
      try {
        if (appUser.fechaIngreso instanceof Date) {
          // Si es una instancia de Date, convertir a formato ISO y tomar solo la parte de la fecha
          apiUser.fecha_ingreso = appUser.fechaIngreso.toISOString().split('T')[0];
          console.log(`Fecha convertida: ${appUser.fechaIngreso} → ${apiUser.fecha_ingreso}`);
        } else if (typeof appUser.fechaIngreso === 'string') {
          // Si es un string, intentar parsear como Date y luego convertir
          const date = new Date(appUser.fechaIngreso);
          if (!isNaN(date.getTime())) {
            apiUser.fecha_ingreso = date.toISOString().split('T')[0];
            console.log(`Fecha string convertida: ${appUser.fechaIngreso} → ${apiUser.fecha_ingreso}`);
          } else {
            // Si no se puede parsear, usar el string directamente
            apiUser.fecha_ingreso = appUser.fechaIngreso;
            console.log(`Usando fecha string directamente: ${apiUser.fecha_ingreso}`);
          }
        } else {
          // Si no es Date ni string, usar fecha actual como respaldo
          apiUser.fecha_ingreso = new Date().toISOString().split('T')[0];
          console.log(`Usando fecha actual como respaldo: ${apiUser.fecha_ingreso}`);
        }
      } catch (error) {
        console.error('Error al convertir fecha:', error);
        // En caso de error, usar la fecha actual
        apiUser.fecha_ingreso = new Date().toISOString().split('T')[0];
      }
    }
    
    return apiUser;
  }
}
