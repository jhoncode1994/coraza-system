import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

interface CacheEntry {
  data: any;
  timestamp: number;
}

@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  private readonly MAX_CACHE_SIZE = 50; // Máximo de entradas en caché

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Solo cachear peticiones GET que no sean de autenticación
    if (req.method !== 'GET' || req.url.includes('/auth/')) {
      return next.handle(req);
    }

    // No cachear si hay parámetros de forzar actualización
    if (req.params.has('refresh') || req.headers.has('x-no-cache')) {
      this.cache.delete(req.url);
      return next.handle(req);
    }

    // Verificar si existe en caché y no ha expirado
    const cached = this.cache.get(req.url);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      console.log(`📦 Cache HIT: ${req.url}`);
      return of(new HttpResponse({ 
        body: cached.data,
        status: 200,
        statusText: 'OK (from cache)'
      }));
    }

    // Si no está en caché o expiró, hacer la petición
    console.log(`🌐 Cache MISS: ${req.url}`);
    
    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse && event.status === 200) {
          // Limpiar caché si está lleno
          if (this.cache.size >= this.MAX_CACHE_SIZE) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
          }

          // Guardar en caché
          this.cache.set(req.url, {
            data: event.body,
            timestamp: now
          });
        }
      })
    );
  }

  /**
   * Limpiar toda la caché
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Caché limpiada');
  }

  /**
   * Limpiar caché de una URL específica
   */
  clearCacheForUrl(url: string): void {
    this.cache.delete(url);
    console.log(`🗑️ Caché limpiada para: ${url}`);
  }

  /**
   * Limpiar caché que contenga un patrón
   */
  clearCachePattern(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
    console.log(`🗑️ Caché limpiada para patrón: ${pattern}`);
  }

  /**
   * Obtener estadísticas del caché
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      cacheDuration: this.CACHE_DURATION / 1000 / 60, // en minutos
      entries: Array.from(this.cache.keys())
    };
  }
}
