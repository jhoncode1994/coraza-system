import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Router } from '@angular/router';

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
  
  // Usuario por defecto del sistema (en producción esto debería venir de una base de datos)
  private readonly defaultUser: User = {
    id: 1,
    username: 'admin',
    email: 'admin@coraza-dotacion.com',
    role: 'admin'
  };
  
  // Contraseña por defecto (en producción debería estar hasheada)
  private readonly defaultPassword = 'coraza2025';
  
  constructor(private router: Router) {
    // Verificar si hay una sesión activa al inicializar el servicio
    this.checkStoredSession();
  }

  /**
   * Iniciar sesión
   */
  login(credentials: LoginCredentials): Observable<{ success: boolean; user?: User; error?: string }> {
    const { username, password } = credentials;
    
    // Simular verificación de credenciales
    if (username === this.defaultUser.username && password === this.defaultPassword) {
      const userWithLogin = {
        ...this.defaultUser,
        lastLogin: new Date()
      };
      
      // Guardar sesión en localStorage
      this.setCurrentUser(userWithLogin);
      this.saveSession(userWithLogin);
      
      return of({ success: true, user: userWithLogin });
    } else {
      return of({ 
        success: false, 
        error: 'Credenciales incorrectas. Verifique su usuario y contraseña.' 
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
    if (currentPassword === this.defaultPassword) {
      // En una implementación real, aquí actualizarías la contraseña en la base de datos
      console.log('Cambio de contraseña solicitado:', { newPassword });
      return of({ 
        success: true
      });
    } else {
      return of({ 
        success: false, 
        error: 'La contraseña actual es incorrecta' 
      });
    }
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
