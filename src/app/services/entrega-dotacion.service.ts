import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { getApiBaseUrl } from '../config/api.config';

export interface EntregaHistorial {
  id: number;
  userId: number;
  elemento: string;
  cantidad: number;
  fechaEntrega: Date;
  observaciones?: string;
  tipo: 'entrega' | 'devolucion';
  firma?: string; // Firma digital en base64
  firmaDigital?: string; // Campo de la base de datos
}

@Injectable({
  providedIn: 'root'
})
export class EntregaDotacionService {
  private apiUrl = getApiBaseUrl();
  private entregas: EntregaHistorial[] = [];
  private entregasSubject = new BehaviorSubject<EntregaHistorial[]>([]);

  constructor(private http: HttpClient) {
    // Cargar datos desde la API si existen
    this.loadFromAPI();
  }

  getEntregas(): Observable<EntregaHistorial[]> {
    return this.entregasSubject.asObservable();
  }

  getEntregasByUser(userId: number): Observable<EntregaHistorial[]> {
    return this.http.get<any[]>(`${this.apiUrl}/delivery/user/${userId}`).pipe(
      map(entregas => entregas.map(entrega => ({
        ...entrega,
        firma: entrega.firmaDigital || entrega.firma // Mapear firmaDigital a firma
      })))
    );
  }

  addEntrega(entrega: Omit<EntregaHistorial, 'id'>): Observable<any> {
    const deliveryData = {
      userId: entrega.userId,
      elemento: entrega.elemento,
      cantidad: entrega.cantidad,
      fechaEntrega: entrega.fechaEntrega,
      observaciones: entrega.observaciones,
      firmaDigital: entrega.firma || entrega.firmaDigital
    };

    return this.http.post(`${this.apiUrl}/delivery`, deliveryData);
  }

  getHistorialByUser(userId: number): Observable<EntregaHistorial[]> {
    return this.getEntregasByUser(userId);
  }

  private loadFromAPI(): void {
    this.http.get<EntregaHistorial[]>(`${this.apiUrl}/delivery`).subscribe({
      next: (entregas) => {
        this.entregas = entregas;
        this.entregasSubject.next([...this.entregas]);
      },
      error: (error) => {
        console.error('Error loading entregas from API:', error);
        // Fallback a localStorage si la API falla
        this.loadFromStorage();
      }
    });
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem('entregas-dotacion');
    if (stored) {
      try {
        this.entregas = JSON.parse(stored);
        // Convertir strings de fecha a objetos Date
        this.entregas.forEach(entrega => {
          if (typeof entrega.fechaEntrega === 'string') {
            entrega.fechaEntrega = new Date(entrega.fechaEntrega);
          }
        });
        this.entregasSubject.next([...this.entregas]);
      } catch (error) {
        console.error('Error loading entregas from storage:', error);
        this.entregas = [];
      }
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('entregas-dotacion', JSON.stringify(this.entregas));
    } catch (error) {
      console.error('Error saving entregas to storage:', error);
    }
  }
}
