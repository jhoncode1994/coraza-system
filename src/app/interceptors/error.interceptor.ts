import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      retry({
        count: 2,
        delay: (error: HttpErrorResponse, retryCount: number) => {
          // Solo reintentar en errores de red o del servidor
          if (error.status === 0 || error.status >= 500) {
            console.log(`🔄 Reintento ${retryCount} para: ${req.url}`);
            return timer(1000 * retryCount); // Esperar progresivamente más
          }
          // Para otros errores, no reintentar
          throw error;
        }
      }),
      catchError((error: HttpErrorResponse) => {
        let message = 'Error desconocido';
        let duration = 5000;

        if (error.status === 0) {
          message = '❌ Sin conexión al servidor';
          duration = 8000;
        } else if (error.status === 401) {
          message = '🔒 Sesión expirada. Por favor inicia sesión nuevamente';
          duration = 6000;
          // Redirigir al login después de un breve delay
          setTimeout(() => this.router.navigate(['/login']), 2000);
        } else if (error.status === 403) {
          message = '🚫 No tienes permisos para realizar esta acción';
        } else if (error.status === 404) {
          message = '🔍 Recurso no encontrado';
        } else if (error.status >= 500) {
          message = '⚠️ Error del servidor. Intenta nuevamente';
        } else if (error.error?.error) {
          message = error.error.error;
        } else if (error.message) {
          message = error.message;
        }

        // Mostrar mensaje al usuario (excepto 401 que ya tiene su mensaje)
        if (error.status !== 401 || !req.url.includes('/auth/login')) {
          this.snackBar.open(message, 'Cerrar', {
            duration,
            panelClass: ['error-snackbar'],
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
        }

        // Log para debugging (solo en desarrollo)
        if (!environment.production) {
          console.error('HTTP Error:', {
            url: req.url,
            status: error.status,
            message: error.message,
            error: error.error
          });
        }

        return throwError(() => error);
      })
    );
  }
}
