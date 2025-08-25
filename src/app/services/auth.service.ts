import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin';
  lastLogin?: Date;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private readonly baseUrl = 'http://localhost:3000/api';
  
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
        console.error('Error en login:', error);
        let errorMessage = 'Error de conexión con el servidor';
        
        if (error.error && error.error.error) {
          errorMessage = error.error.error;
        } else if (error.status === 401) {
          errorMessage = 'Credenciales incorrectas';
        } else if (error.status === 0) {
          errorMessage = 'No se puede conectar al servidor';
        }
        
        return of({ 
          success: false, 
          error: errorMessage 
        });
      })
    );
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
}
