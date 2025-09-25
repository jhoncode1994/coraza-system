import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap } from 'rxjs';
import { SupplyItem } from '../interfaces/supply-item.interface';
import { getApiBaseUrl } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class SupplyInventoryService {
  private apiUrl = `${getApiBaseUrl()}/supply-inventory`;
  
  constructor(private http: HttpClient) {}

  getAllSupplies(): Observable<SupplyItem[]> {
    return this.http.get<SupplyItem[]>(this.apiUrl).pipe(
      map(supplies => {
        this.allSupplies = supplies; // Actualizar cache
        return supplies;
      })
    );
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

  validateStockWithSizes(elementos: Array<{category: string, talla?: string, quantity: number}>): Observable<{valid: boolean, validations: any[]}> {
    return this.http.post<{valid: boolean, validations: any[]}>(`${this.apiUrl}/validate-stock-sizes`, { elementos });
  }

  getAvailableStock(category: string, talla?: string): Observable<{quantity: number}> {
    const params: any = { category };
    if (talla) params.talla = talla;
    
    return this.http.get<{quantity: number}>(`${this.apiUrl}/available-stock`, { params });
  }

  exportToExcel(): Observable<Blob> {
    return this.getAllSupplies().pipe(
      map(supplies => {
        const headers = ['Código', 'Elemento', 'Categoría', 'Talla', 'Cantidad', 'Cantidad Mínima', 'Última Actualización'];
        const rows = supplies.map(item => [
          item.code,
          item.name,
          item.category,
          item.talla || 'N/A',
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

  // Method to increase stock quantity with size support
  addSupply(elementId: number, quantityToAdd: number, talla?: string): Observable<SupplyItem> {
    const payload: any = { quantityToAdd };
    if (talla) payload.talla = talla;
    
    return this.http.post<SupplyItem>(`${this.apiUrl}/${elementId}/add-stock`, payload);
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

  // Nuevos métodos para el sistema de tallas mejorado
  getTallasDisponiblesPorElemento(nombreBase: string, categoria: string): Observable<string[]> {
    // Obtener tallas disponibles desde el servidor
    return this.http.get<{element: string, category: string, available_sizes: string[]}>
      (`${this.apiUrl}/available-sizes/${encodeURIComponent(nombreBase)}/${encodeURIComponent(categoria)}`)
      .pipe(
        map(response => response.available_sizes)
      );
  }

  // Método sincrónico para compatibilidad con el código existente
  getTallasDisponiblesPorElementoSync(nombreBase: string, categoria: string): string[] {
    // Buscar por nombre exacto, no por nombre base
    return this.allSupplies
      .filter(item => 
        item.name.toLowerCase() === nombreBase.toLowerCase() && 
        item.category === categoria && 
        item.quantity > 0 && 
        item.talla !== null && 
        item.talla !== undefined
      )
      .map(item => item.talla) as string[];
  }

  getStockEspecificoPorTalla(nombreBase: string, categoria: string, talla: string): number {
    const item = this.allSupplies.find(supply => 
      supply.name.toLowerCase() === nombreBase.toLowerCase() && 
      supply.category === categoria && 
      supply.talla === talla
    );
    return item ? item.quantity : 0;
  }

  private getNombreBase(nombre: string): string {
    // Los nombres en la BD ya son nombres base (pantalón, camiseta, etc.)
    return nombre;
  }

  private allSupplies: SupplyItem[] = [];
}