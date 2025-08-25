import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { getApiBaseUrl } from '../config/api.config';

export interface InventoryMovement {
  id?: number;
  supply_id: number;
  supply_name: string;
  movement_type: 'entrada' | 'salida';
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reason: string;
  user_name: string;
  movement_date: Date | string;
  notes?: string;
}

export interface InventoryMovementCreate {
  supply_id: number;
  movement_type: 'entrada' | 'salida';
  quantity: number;
  reason: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryMovementsService {
  private apiUrl = `${getApiBaseUrl()}/inventory-movements`;
  
  private movementsSubject = new BehaviorSubject<InventoryMovement[]>([]);
  public movements$ = this.movementsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadMovements();
  }

  loadMovements(): void {
    this.http.get<InventoryMovement[]>(this.apiUrl).subscribe({
      next: (movements) => {
        this.movementsSubject.next(movements);
      },
      error: (error) => {
        console.error('Error loading inventory movements:', error);
      }
    });
  }

  getMovementsBySupply(supplyId: number): Observable<InventoryMovement[]> {
    return this.http.get<InventoryMovement[]>(`${this.apiUrl}/supply/${supplyId}`);
  }

  addMovement(movement: InventoryMovementCreate): Observable<InventoryMovement> {
    return this.http.post<InventoryMovement>(this.apiUrl, movement).pipe(
      tap(() => this.loadMovements())
    );
  }

  // Método específico para agregar stock con confirmación
  addStock(supplyId: number, quantity: number, reason: string, notes?: string): Observable<any> {
    const payload = {
      supplyId,
      quantity,
      reason,
      notes
    };
    
    return this.http.post<any>(`${this.apiUrl}/add-stock`, payload).pipe(
      tap(() => this.loadMovements())
    );
  }

  // Método específico para reducir stock (usado en entregas)
  removeStock(supplyId: number, quantity: number, reason: string, notes?: string): Observable<InventoryMovement> {
    const movement: InventoryMovementCreate = {
      supply_id: supplyId,
      movement_type: 'salida',
      quantity,
      reason,
      notes
    };
    
    return this.addMovement(movement);
  }

  getCurrentMovements(): InventoryMovement[] {
    return this.movementsSubject.getValue();
  }
}
