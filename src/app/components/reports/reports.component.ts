import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

import { UsersService } from '../users/users.service';
import { User } from '../users/users.component';
import { SupplyInventoryService } from '../../services/supply-inventory.service';
import { EntregaDotacionService, EntregaHistorial } from '../../services/entrega-dotacion.service';
import { SupplyItem } from '../../interfaces/supply-item.interface';

interface DeliveryReport {
  associateName: string;
  associateId: number;
  cedula: string;
  zona: number;
  elemento: string;
  cantidad: number;
  fechaEntrega: Date;
  observaciones?: string;
}

interface InventoryReport {
  code: string;
  name: string;
  category: string;
  currentStock: number;
  minimumStock: number;
  status: 'OK' | 'LOW' | 'CRITICAL';
  lastUpdate: Date;
}

interface ConsumptionReport {
  elemento: string;
  totalEntregado: number;
  numeroEntregas: number;
  promedioEntrega: number;
  zona: number;
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class ReportsComponent implements OnInit {
  filterForm: FormGroup;
  
  // Datos para reportes
  deliveryReports: DeliveryReport[] = [];
  inventoryReports: InventoryReport[] = [];
  consumptionReports: ConsumptionReport[] = [];
  
  // Configuración de tablas
  deliveryColumns: string[] = ['associateName', 'cedula', 'zona', 'elemento', 'cantidad', 'fechaEntrega'];
  inventoryColumns: string[] = ['name', 'category', 'currentStock', 'minimumStock', 'status'];
  consumptionColumns: string[] = ['elemento', 'totalEntregado', 'numeroEntregas', 'promedioEntrega', 'zona'];
  
  // Estados
  isLoading = false;
  users: User[] = [];
  supplies: SupplyItem[] = [];
  deliveries: EntregaHistorial[] = [];
  
  // Filtros disponibles
  availableZones: number[] = [];
  availableSupplies: string[] = [];

  constructor(
    private fb: FormBuilder,
    private usersService: UsersService,
    private supplyService: SupplyInventoryService,
    private deliveryService: EntregaDotacionService,
    private snackBar: MatSnackBar
  ) {
    this.filterForm = this.fb.group({
      startDate: [''],
      endDate: [''],
      zone: [''],
      supply: [''],
      associate: ['']
    });
  }

  ngOnInit() {
    this.loadInitialData();
  }

  loadInitialData() {
    this.isLoading = true;
    
    // Cargar usuarios
    this.users = this.usersService.getUsers();
    this.availableZones = [...new Set(this.users.map(user => user.zona))].sort();
    
    // Cargar suministros
    this.supplyService.getAllSupplies().subscribe({
      next: (supplies) => {
        // Aplicar ordenamiento inteligente por tallas
        this.supplies = this.sortSuppliesIntelligently(supplies);
        this.availableSupplies = this.supplies.map(s => s.name).sort();
        this.generateInventoryReport();
      },
      error: (error) => {
        console.error('Error loading supplies:', error);
      }
    });
    
    // Cargar entregas
    this.deliveryService.getEntregas().subscribe({
      next: (deliveries) => {
        this.deliveries = deliveries;
        this.generateDeliveryReport();
        this.generateConsumptionReport();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading deliveries:', error);
        this.isLoading = false;
      }
    });
  }

  generateDeliveryReport() {
    this.deliveryReports = this.deliveries.map(delivery => {
      const user = this.users.find(u => u.id === delivery.userId);
      return {
        associateName: user ? `${user.nombre} ${user.apellido}` : 'Usuario desconocido',
        associateId: delivery.userId,
        cedula: user?.cedula || 'N/A',
        zona: user?.zona || 0,
        elemento: delivery.elemento,
        cantidad: delivery.cantidad,
        fechaEntrega: new Date(delivery.fechaEntrega),
        observaciones: delivery.observaciones
      };
    });
  }

  generateInventoryReport() {
    this.inventoryReports = this.supplies.map(supply => {
      let status: 'OK' | 'LOW' | 'CRITICAL' = 'OK';
      const minQuantity = supply.minimumQuantity || 0;
      
      if (supply.quantity === 0) {
        status = 'CRITICAL';
      } else if (supply.quantity <= minQuantity) {
        status = 'LOW';
      }
      
      return {
        code: supply.code || 'N/A',
        name: supply.name,
        category: supply.category || 'Sin categoría',
        currentStock: supply.quantity,
        minimumStock: minQuantity,
        status: status,
        lastUpdate: new Date()
      };
    });
  }

  generateConsumptionReport() {
    const consumptionMap = new Map<string, ConsumptionReport>();
    
    this.deliveries.forEach(delivery => {
      const user = this.users.find(u => u.id === delivery.userId);
      const key = `${delivery.elemento}-${user?.zona || 0}`;
      
      if (consumptionMap.has(key)) {
        const existing = consumptionMap.get(key)!;
        existing.totalEntregado += delivery.cantidad;
        existing.numeroEntregas += 1;
        existing.promedioEntrega = existing.totalEntregado / existing.numeroEntregas;
      } else {
        consumptionMap.set(key, {
          elemento: delivery.elemento,
          totalEntregado: delivery.cantidad,
          numeroEntregas: 1,
          promedioEntrega: delivery.cantidad,
          zona: user?.zona || 0
        });
      }
    });
    
    this.consumptionReports = Array.from(consumptionMap.values())
      .sort((a, b) => b.totalEntregado - a.totalEntregado);
  }

  applyFilters() {
    const filters = this.filterForm.value;
    
    // Filtrar reportes de entregas
    let filteredDeliveries = [...this.deliveries];
    
    if (filters.startDate) {
      filteredDeliveries = filteredDeliveries.filter(d => 
        new Date(d.fechaEntrega) >= new Date(filters.startDate)
      );
    }
    
    if (filters.endDate) {
      filteredDeliveries = filteredDeliveries.filter(d => 
        new Date(d.fechaEntrega) <= new Date(filters.endDate)
      );
    }
    
    if (filters.zone) {
      filteredDeliveries = filteredDeliveries.filter(d => {
        const user = this.users.find(u => u.id === d.userId);
        return user?.zona === filters.zone;
      });
    }
    
    if (filters.supply) {
      filteredDeliveries = filteredDeliveries.filter(d => 
        d.elemento.toLowerCase().includes(filters.supply.toLowerCase())
      );
    }
    
    if (filters.associate) {
      filteredDeliveries = filteredDeliveries.filter(d => {
        const user = this.users.find(u => u.id === d.userId);
        return user?.nombre.toLowerCase().includes(filters.associate.toLowerCase()) ||
               user?.apellido.toLowerCase().includes(filters.associate.toLowerCase()) ||
               user?.cedula.includes(filters.associate);
      });
    }
    
    // Regenerar reportes con datos filtrados
    this.deliveries = filteredDeliveries;
    this.generateDeliveryReport();
    this.generateConsumptionReport();
    
    this.snackBar.open('Filtros aplicados correctamente', 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  clearFilters() {
    this.filterForm.reset();
    this.loadInitialData();
    
    this.snackBar.open('Filtros limpiados', 'Cerrar', {
      duration: 3000
    });
  }

  exportToExcel(reportType: 'delivery' | 'inventory' | 'consumption') {
    // Esta función se implementará con una librería de Excel
    let dataToExport: any[] = [];
    let filename = '';
    
    switch (reportType) {
      case 'delivery':
        dataToExport = this.deliveryReports;
        filename = 'reporte_entregas';
        break;
      case 'inventory':
        dataToExport = this.inventoryReports;
        filename = 'reporte_inventario';
        break;
      case 'consumption':
        dataToExport = this.consumptionReports;
        filename = 'reporte_consumo';
        break;
    }
    
    // Por ahora, mostrar mensaje
    this.snackBar.open(`Exportando ${filename}... (Función en desarrollo)`, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
    
    // TODO: Implementar exportación real a Excel
    console.log('Datos para exportar:', dataToExport);
  }

  printReport(reportType: 'delivery' | 'inventory' | 'consumption') {
    window.print();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'OK': return 'primary';
      case 'LOW': return 'accent';
      case 'CRITICAL': return 'warn';
      default: return 'primary';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'OK': return 'Stock Normal';
      case 'LOW': return 'Stock Bajo';
      case 'CRITICAL': return 'Stock Crítico';
      default: return status;
    }
  }

  /**
   * Ordena los elementos de manera inteligente:
   * 1. Por nombre del elemento
   * 2. Por orden lógico de tallas
   */
  private sortSuppliesIntelligently(supplies: SupplyItem[]): SupplyItem[] {
    return supplies.sort((a, b) => {
      // Primero ordenar por nombre
      const nameComparison = a.name.localeCompare(b.name);
      if (nameComparison !== 0) {
        return nameComparison;
      }

      // Si son del mismo nombre, ordenar por tallas de manera inteligente
      return this.compareSizes(a.talla || null, b.talla || null);
    });
  }

  /**
   * Compara tallas de manera inteligente:
   * - Tallas numéricas (28, 30, 32, etc.) en orden numérico
   * - Tallas de texto (XS, S, M, L, XL, XXL) en orden lógico
   * - Sin talla va primero
   */
  private compareSizes(sizeA: string | null, sizeB: string | null): number {
    // Si no tienen talla, van primero
    if (!sizeA && !sizeB) return 0;
    if (!sizeA) return -1;
    if (!sizeB) return 1;

    // Definir orden para tallas de ropa
    const clothingSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    const sizeAIndex = clothingSizes.indexOf(sizeA);
    const sizeBIndex = clothingSizes.indexOf(sizeB);

    // Si ambas son tallas de ropa (XS, S, M, L, XL, XXL)
    if (sizeAIndex !== -1 && sizeBIndex !== -1) {
      return sizeAIndex - sizeBIndex;
    }

    // Si ambas son números (tallas de zapatos/pantalones)
    const numA = parseInt(sizeA);
    const numB = parseInt(sizeB);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }

    // Si una es número y otra es texto, números van primero
    if (!isNaN(numA) && isNaN(numB)) return -1;
    if (isNaN(numA) && !isNaN(numB)) return 1;

    // Fallback: ordenamiento alfabético
    return sizeA.localeCompare(sizeB);
  }
}
