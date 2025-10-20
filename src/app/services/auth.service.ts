import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { getApiBaseUrl } from '../config/api.config';
import { UserPermissions } from './user-role.interface';

export interface User {
  id: number;
  username: string;
  email?: string;
  role: 'admin' | 'delivery_user';
  fechaIngreso: Date;
  lastLogin?: Date;
  permissions: UserPermissions;
}

export interface LoginCredentials {
  username?: string;
  email?: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private readonly baseUrl = getApiBaseUrl();
  
  // Usuarios de prueba para desarrollo
  private mockUsers = {
    'admin': { 
      id: 1, 
      username: 'admin', 
      email: 'admin@coraza.com', 
      password: 'admin123', 
      role: 'admin' as const,
      fechaIngreso: new Date('2024-01-01'),
      permissions: {
        canViewInventory: true,
        canEditInventory: true,
        canViewAssociates: true,
        canEditAssociates: true,
        canMakeDeliveries: true,
        canViewReports: true,
        canManageUsers: true,
      }
    },
    'entregador': { 
      id: 2, 
      username: 'entregador', 
      email: 'entregador@coraza.com', 
      password: 'entrega123', 
      role: 'delivery_user' as const,
      fechaIngreso: new Date('2024-01-15'),
      permissions: {
        canViewInventory: true,
        canEditInventory: false,
        canViewAssociates: true,
        canEditAssociates: false,
        canMakeDeliveries: true,
        canViewReports: false,
        canManageUsers: false,
      }
    }
  };
  
  constructor(
    private router: Router,
    private http: HttpClient
  ) {
    // Verificar si hay una sesión activa al inicializar el servicio
    this.checkStoredSession();
  }

  /**
   * Iniciar sesión
   */
  login(credentials: LoginCredentials): Observable<{ success: boolean; user?: User; error?: string }> {
    // Primero intentar con el backend
    return this.http.post<any>(`${this.baseUrl}/auth/login`, credentials).pipe(
      map(response => {
        if (response.success && response.user) {
          // Guardar sesión en localStorage
          this.setCurrentUser(response.user);
          this.saveSession(response.user);
          
          return { 
            success: true, 
            user: response.user 
          };
        } else {
          return { 
            success: false, 
            error: response.error || 'Error de autenticación' 
          };
        }
      }),
      catchError(error => {
        console.error('Error en login con backend, intentando con usuarios locales:', error);
        
        // Si falla el backend, intentar con usuarios locales
        return this.tryLocalLogin(credentials);
      })
    );
  }

  /**
   * Intentar login con usuarios locales (fallback)
   */
  private tryLocalLogin(credentials: LoginCredentials): Observable<{ success: boolean; user?: User; error?: string }> {
    console.log('Intentando login local con:', credentials);
    console.log('Usuarios disponibles:', this.mockUsers);
    
    const user = Object.values(this.mockUsers).find(u => {
      const emailMatch = u.email === credentials.email;
      const usernameMatch = u.username === credentials.username;
      const passwordMatch = u.password === credentials.password;
      
      console.log(`Verificando usuario ${u.username}:`, {
        emailMatch,
        usernameMatch, 
        passwordMatch,
        userEmail: u.email,
        credentialsEmail: credentials.email,
        userPassword: u.password,
        credentialsPassword: credentials.password
      });
      
      return (emailMatch || usernameMatch) && passwordMatch;
    });

    if (user) {
      console.log('Usuario encontrado:', user);
      // Crear una copia del usuario sin la contraseña para la sesión
      const userForSession: User = {
        id: user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions,
        fechaIngreso: user.fechaIngreso
      };

      this.setCurrentUser(userForSession);
      this.saveSession(userForSession);

      return of({
        success: true,
        user: userForSession
      });
    } else {
      console.log('Usuario no encontrado con las credenciales proporcionadas');
      return of({
        success: false,
        error: 'Credenciales incorrectas'
      });
    }
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem('coraza_session');
    localStorage.removeItem('coraza_user');
    this.router.navigate(['/login']);
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  /**
   * Obtener el usuario actual
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Establecer usuario actual
   */
  private setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
  }

  /**
   * Guardar sesión en localStorage
   */
  private saveSession(user: User): void {
    const sessionData = {
      user,
      timestamp: new Date().getTime(),
      expiresIn: 24 * 60 * 60 * 1000 // 24 horas
    };
    
    localStorage.setItem('coraza_session', JSON.stringify(sessionData));
    localStorage.setItem('coraza_user', JSON.stringify(user));
  }

  /**
   * Verificar sesión almacenada
   */
  private checkStoredSession(): void {
    try {
      const sessionData = localStorage.getItem('coraza_session');
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        const now = new Date().getTime();
        
        // Verificar si la sesión no ha expirado
        if (now - parsed.timestamp < parsed.expiresIn) {
          this.setCurrentUser(parsed.user);
        } else {
          // Sesión expirada, limpiar
          this.clearExpiredSession();
        }
      }
    } catch (error) {
      console.error('Error loading stored session:', error);
      this.clearExpiredSession();
    }
  }

  /**
   * Limpiar sesión expirada
   */
  private clearExpiredSession(): void {
    localStorage.removeItem('coraza_session');
    localStorage.removeItem('coraza_user');
  }

  /**
   * Cambiar contraseña (para futuras implementaciones)
   */
  changePassword(currentPassword: string, newPassword: string): Observable<{ success: boolean; error?: string }> {
    // TODO: Implementar endpoint para cambio de contraseña
    console.log('Cambio de contraseña solicitado:', { newPassword });
    return of({ 
      success: true,
      error: 'Funcionalidad de cambio de contraseña pendiente de implementar'
    });
  }

  /**
   * Obtener información del sistema para mostrar en el login
   */
  getSystemInfo(): { version: string; lastUpdate: string } {
    return {
      version: '1.0.0',
      lastUpdate: 'Agosto 2025'
    };
  }

  /**
   * Verificar fuerza de contraseña
   */
  checkPasswordStrength(password: string): { 
    strength: 'weak' | 'medium' | 'strong'; 
    score: number;
    feedback: string[];
  } {
    let score = 0;
    const feedback: string[] = [];

    if (password.length >= 8) score += 1;
    else feedback.push('Al menos 8 caracteres');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Al menos una mayúscula');

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Al menos una minúscula');

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Al menos un número');

    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('Al menos un carácter especial');

    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    if (score >= 4) strength = 'strong';
    else if (score >= 3) strength = 'medium';

    return { strength, score, feedback };
  }

  /**
   * Verificar si el usuario tiene un permiso específico
   */
  hasPermission(permission: keyof UserPermissions): boolean {
    const user = this.getCurrentUser();
    if (!user?.permissions) return false;
    return (user.permissions as any)[permission] || false;
  }

  /**
   * Verificar si el usuario es administrador
   */
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  /**
   * Verificar si el usuario es de entregas
   */
  isDeliveryUser(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'delivery_user';
  }

  /**
   * Obtener lista de permisos del usuario actual
   */
  getUserPermissions(): UserPermissions | null {
    const user = this.getCurrentUser();
    return user?.permissions || null;
  }

  /**
   * Verificar si puede realizar entregas
   */
  canMakeDeliveries(): boolean {
    return this.hasPermission('canMakeDeliveries');
  }

  /**
   * Verificar si puede editar inventario
   */
  canEditInventory(): boolean {
    return this.hasPermission('canEditInventory');
  }

  /**
   * Verificar si puede gestionar usuarios
   */
  canManageUsers(): boolean {
    return this.hasPermission('canManageUsers');
  }

  /**
   * Verificar si puede editar asociados
   */
  canEditAssociates(): boolean {
    return this.hasPermission('canEditAssociates');
  }
}
