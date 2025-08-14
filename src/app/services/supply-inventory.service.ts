import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, tap, map } from 'rxjs';
import { SupplyItem, SupplyItemType } from '../interfaces/supply-item.interface';

@Injectable({
  providedIn: 'root'
})
export class SupplyInventoryService {
  private apiUrl = 'https://renderdesboard.onrender.com/api/supplies';
  private defaultItems = [
    { name: 'camisa', quantity: 0, code: 'CAM', category: 'uniforme', minimumQuantity: 10, description: 'Camisa del uniforme' },
    { name: 'corbata', quantity: 0, code: 'COR', category: 'uniforme', minimumQuantity: 10, description: 'Corbata del uniforme' },
    { name: 'apellido', quantity: 0, code: 'APE', category: 'accesorios', minimumQuantity: 10, description: 'Parche de apellido' },
    { name: 'pantalon', quantity: 0, code: 'PAN', category: 'uniforme', minimumQuantity: 10, description: 'Pantalón del uniforme' },
    { name: 'cinturon', quantity: 0, code: 'CIN', category: 'accesorios', minimumQuantity: 10, description: 'Cinturón reglamentario' },
    { name: 'kepis', quantity: 0, code: 'KEP', category: 'uniforme', minimumQuantity: 10, description: 'Kepis reglamentario' },
    { name: 'moña', quantity: 0, code: 'MOÑ', category: 'accesorios', minimumQuantity: 10, description: 'Moña reglamentaria' },
    { name: 'botas', quantity: 0, code: 'BOT', category: 'uniforme', minimumQuantity: 10, description: 'Botas reglamentarias' },
    { name: 'reata', quantity: 0, code: 'REA', category: 'accesorios', minimumQuantity: 10, description: 'Reata reglamentaria' },
    { name: 'goleana', quantity: 0, code: 'GOL', category: 'accesorios', minimumQuantity: 10, description: 'Goleana reglamentaria' }
  ] as const;

  constructor(private http: HttpClient) {}

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

  checkLowStock(): Observable<SupplyItem[]> {
    return this.getAllSupplies().pipe(
      map(items => items.filter(item => 
        item.quantity < (item.minimumQuantity || 10)
      ))
    );
  }

  getAllSupplies(): Observable<SupplyItem[]> {
    // Primero intentar cargar desde localStorage
    const storedSupplies = this.loadInventoryFromStorage();
    if (storedSupplies.length > 0) {
      return of(storedSupplies);
    }

    // Si no hay datos en localStorage, intentar cargar desde API o usar defaults
    return this.http.get<SupplyItem[]>(this.apiUrl).pipe(
      catchError(() => {
        // Si no se puede conectar a la API, devolvemos los elementos por defecto
        console.log('No se pudo conectar a la API, usando datos por defecto');
        const defaultSupplies: SupplyItem[] = this.defaultItems.map((item, index) => ({
          id: index + 1,
          name: item.name,
          quantity: item.quantity,
          code: item.code,
          category: item.category,
          minimumQuantity: item.minimumQuantity,
          description: item.description,
          lastUpdate: new Date()
        }));
        
        // Guardar los datos por defecto en localStorage
        this.saveInventoryToStorage(defaultSupplies);
        
        return of(defaultSupplies);
      })
    );
  }

  updateSupplyQuantity(id: number, quantity: number): Observable<SupplyItem> {
    return this.http.patch<SupplyItem>(`${this.apiUrl}/${id}`, { quantity }).pipe(
      catchError(() => {
        // Si no se puede conectar a la API, simulamos la actualización
        console.log('Simulando actualización de cantidad sin API');
        const mockItem: SupplyItem = {
          id: id,
          name: 'Item simulado',
          quantity: quantity,
          code: 'SIM',
          category: 'uniforme',
          minimumQuantity: 10,
          description: 'Item simulado para pruebas',
          lastUpdate: new Date()
        };
        return of(mockItem);
      })
    );
  }

  addSupply(supply: Omit<SupplyItem, 'id'>): Observable<SupplyItem> {
    return this.http.post<SupplyItem>(this.apiUrl, supply).pipe(
      catchError(() => {
        // Si no se puede conectar a la API, simulamos la adición
        console.log('Simulando adición de item sin API');
        const mockItem: SupplyItem = {
          id: Math.floor(Math.random() * 1000),
          ...supply
        };
        return of(mockItem);
      })
    );
  }

  private initializeDefaultItems() {
    this.defaultItems.forEach(item => {
      this.addSupply({
        name: item.name,
        quantity: item.quantity,
        code: item.code,
        category: item.category,
        minimumQuantity: item.minimumQuantity,
        description: item.description,
        lastUpdate: new Date()
      }).subscribe({
        next: () => console.log(`Elemento ${item.name} inicializado`),
        error: (error) => console.error(`Error al inicializar ${item.name}:`, error)
      });
    });
  }

  // Método para validar si hay stock suficiente
  validateStock(elementName: string, requestedQuantity: number): Observable<{ valid: boolean, availableQuantity: number }> {
    return this.getAllSupplies().pipe(
      map(supplies => {
        const item = supplies.find(supply => supply.name.toLowerCase() === elementName.toLowerCase());
        if (!item) {
          return { valid: false, availableQuantity: 0 };
        }
        return {
          valid: item.quantity >= requestedQuantity,
          availableQuantity: item.quantity
        };
      })
    );
  }

  // Método para descontar del inventario
  decreaseStock(elementName: string, quantity: number): Observable<boolean> {
    return this.getAllSupplies().pipe(
      map(supplies => {
        const itemIndex = supplies.findIndex(supply => supply.name.toLowerCase() === elementName.toLowerCase());
        if (itemIndex === -1) {
          return false;
        }
        
        const item = supplies[itemIndex];
        if (item.quantity < quantity) {
          return false;
        }

        // Simular descuento (en un caso real, esto se haría en el backend)
        item.quantity -= quantity;
        item.lastUpdate = new Date();
        
        // Guardar en localStorage para persistir el cambio
        this.saveInventoryToStorage(supplies);
        
        return true;
      })
    );
  }

  // Método para guardar el inventario actualizado
  private saveInventoryToStorage(supplies: SupplyItem[]): void {
    try {
      localStorage.setItem('supply-inventory', JSON.stringify(supplies));
    } catch (error) {
      console.error('Error saving inventory to storage:', error);
    }
  }

  // Método para cargar inventario desde localStorage
  private loadInventoryFromStorage(): SupplyItem[] {
    try {
      const stored = localStorage.getItem('supply-inventory');
      if (stored) {
        const supplies = JSON.parse(stored);
        // Convertir strings de fecha a objetos Date
        supplies.forEach((supply: any) => {
          if (typeof supply.lastUpdate === 'string') {
            supply.lastUpdate = new Date(supply.lastUpdate);
          }
        });
        return supplies;
      }
    } catch (error) {
      console.error('Error loading inventory from storage:', error);
    }
    return [];
  }
}
