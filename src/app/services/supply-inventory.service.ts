import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap } from 'rxjs';
import { SupplyItem } from '../interfaces/supply-item.interface';

@Injectable({
  providedIn: 'root'
})
export class SupplyInventoryService {
  private apiUrl = '/api/supply-inventory';
  
  constructor(private http: HttpClient) {}

  getAllSupplies(): Observable<SupplyItem[]> {
    return this.http.get<SupplyItem[]>(this.apiUrl);
  }

  updateSupplyQuantity(id: number, quantity: number): Observable<SupplyItem> {
    return this.http.put<SupplyItem>(`${this.apiUrl}/${id}/quantity`, { quantity });
  }

  getLowStockItems(): Observable<SupplyItem[]> {
    return this.http.get<SupplyItem[]>(`${this.apiUrl}/low-stock`);
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }

  checkLowStock(): Observable<SupplyItem[]> {
    return this.getLowStockItems();
  }

  exportToExcel(): Observable<Blob> {
    return this.getAllSupplies().pipe(
      map(supplies => {
        const headers = ['Código', 'Elemento', 'Categoría', 'Cantidad', 'Cantidad Mínima', 'Última Actualización'];
        const rows = supplies.map(item => [
          item.code,
          item.name,
          item.category,
          item.quantity.toString(),
          item.minimumQuantity?.toString() || '10',
          new Date(item.lastUpdate || new Date()).toLocaleDateString()
        ]);

        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.join(','))
        ].join('\n');

        return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      })
    );
  }

  // Method to increase stock quantity (what the dialog should actually do)
  addSupply(elementId: number, quantityToAdd: number): Observable<SupplyItem> {
    return this.getAllSupplies().pipe(
      map(supplies => supplies.find(s => s.id === elementId)),
      switchMap(supply => {
        if (supply) {
          const newQuantity = supply.quantity + quantityToAdd;
          return this.updateSupplyQuantity(elementId, newQuantity);
        }
        throw new Error('Supply item not found');
      })
    );
  }

  validateStock(elementIdOrName: number | string, quantity: number): Observable<any> {
    return this.getAllSupplies().pipe(
      map(supplies => {
        const supply = typeof elementIdOrName === 'number' 
          ? supplies.find(s => s.id === elementIdOrName)
          : supplies.find(s => s.name === elementIdOrName);
        
        if (supply) {
          return {
            valid: supply.quantity >= quantity,
            currentStock: supply.quantity,
            requestedQuantity: quantity,
            availableQuantity: supply.quantity
          };
        }
        return { valid: false, error: 'Item not found' };
      })
    );
  }

  decreaseStock(elementIdOrName: number | string, quantity: number): Observable<any> {
    return this.getAllSupplies().pipe(
      map(supplies => typeof elementIdOrName === 'number' 
        ? supplies.find(s => s.id === elementIdOrName)
        : supplies.find(s => s.name === elementIdOrName)),
      switchMap(supply => {
        if (supply && supply.quantity >= quantity) {
          const newQuantity = supply.quantity - quantity;
          return this.updateSupplyQuantity(supply.id, newQuantity);
        }
        throw new Error('Insufficient stock or item not found');
      })
    );
  }
}