import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface EntregaHistorial {
  id: number;
  userId: number;
  elemento: string;
  cantidad: number;
  fechaEntrega: Date;
  observaciones?: string;
  tipo: 'entrega' | 'devolucion';
  firma?: string; // Firma digital en base64
}

@Injectable({
  providedIn: 'root'
})
export class EntregaDotacionService {
  private entregas: EntregaHistorial[] = [];
  private entregasSubject = new BehaviorSubject<EntregaHistorial[]>([]);

  constructor() {
    // Cargar datos desde localStorage si existen
    this.loadFromStorage();
  }

  getEntregas(): Observable<EntregaHistorial[]> {
    return this.entregasSubject.asObservable();
  }

  getEntregasByUser(userId: number): Observable<EntregaHistorial[]> {
    return new Observable(observer => {
      const userEntregas = this.entregas.filter(entrega => entrega.userId === userId);
      observer.next(userEntregas);
      observer.complete();
    });
  }

  addEntrega(entrega: Omit<EntregaHistorial, 'id'>): void {
    const newEntrega: EntregaHistorial = {
      ...entrega,
      id: Date.now()
    };
    
    this.entregas.push(newEntrega);
    this.entregasSubject.next([...this.entregas]);
    this.saveToStorage();
  }

  getHistorialByUser(userId: number): EntregaHistorial[] {
    return this.entregas.filter(entrega => entrega.userId === userId);
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
