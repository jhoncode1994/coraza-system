import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { UsersService } from '../users/users.service';
import { SupplyInventoryService } from '../../services/supply-inventory.service';
import { EntregaDotacionService, EntregaHistorial } from '../../services/entrega-dotacion.service';
import { SupplyItem } from '../../interfaces/supply-item.interface';
import { PdfReportService } from '../../services/pdf-report.service';

interface DashboardMetrics {
  totalAssociates: number;
  totalSupplies: number;
  lowStockItems: number;
  deliveriesToday: number;
  deliveriesThisMonth: number;
  associatesByZone: { [key: number]: number };
  topSuppliesUsed: Array<{ name: string; count: number }>;
  criticalStockItems: Array<{ name: string; stock: number; minStock: number }>;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatGridListModule,
    MatProgressBarModule,
    MatChipsModule,
    MatBadgeModule,
    MatDividerModule,
    MatSnackBarModule,
    MatDialogModule,
    RouterModule
  ]
})
export class DashboardComponent implements OnInit {
  metrics: DashboardMetrics = {
    totalAssociates: 0,
    totalSupplies: 0,
    lowStockItems: 0,
    deliveriesToday: 0,
    deliveriesThisMonth: 0,
    associatesByZone: {},
    topSuppliesUsed: [],
    criticalStockItems: []
  };

  isLoading = true;

  constructor(
    private usersService: UsersService,
    private supplyService: SupplyInventoryService,
    private deliveryService: EntregaDotacionService,
    private pdfReportService: PdfReportService,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.isLoading = true;
    
    // Cargar métricas de asociados
    this.loadAssociateMetrics();
    
    // Cargar métricas de inventario
    this.loadInventoryMetrics();
    
    // Cargar métricas de entregas
    this.loadDeliveryMetrics();
    
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  private loadAssociateMetrics() {
    const users = this.usersService.getUsers();
    this.metrics.totalAssociates = users.length;
    
    // Agrupar asociados por zona
    this.metrics.associatesByZone = users.reduce((acc, user) => {
      acc[user.zona] = (acc[user.zona] || 0) + 1;
      return acc;
    }, {} as { [key: number]: number });
  }

  private loadInventoryMetrics() {
    this.supplyService.getAllSupplies().subscribe({
      next: (supplies: SupplyItem[]) => {
        this.metrics.totalSupplies = supplies.length;
        
        // Calcular artículos con stock bajo (menos de 10 unidades)
        this.metrics.lowStockItems = supplies.filter((item: SupplyItem) => item.quantity < 10).length;
        
        // Artículos críticos (menos de 5 unidades)
        this.metrics.criticalStockItems = supplies
          .filter((item: SupplyItem) => item.quantity < 5)
          .map((item: SupplyItem) => ({
            name: item.name,
            stock: item.quantity,
            minStock: 5
          }))
          .slice(0, 5); // Top 5
      },
      error: (error) => {
        console.error('Error loading inventory metrics:', error);
      }
    });
  }

  private loadDeliveryMetrics() {
    this.deliveryService.getEntregas().subscribe({
      next: (deliveries: EntregaHistorial[]) => {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        // Entregas de hoy
        this.metrics.deliveriesToday = deliveries.filter((delivery: EntregaHistorial) => {
          const deliveryDate = new Date(delivery.fechaEntrega);
          return deliveryDate >= startOfDay;
        }).length;

        // Entregas del mes
        this.metrics.deliveriesThisMonth = deliveries.filter((delivery: EntregaHistorial) => {
          const deliveryDate = new Date(delivery.fechaEntrega);
          return deliveryDate >= startOfMonth;
        }).length;

        // Top artículos más entregados
        const supplyCount = deliveries.reduce((acc: { [key: string]: number }, delivery: EntregaHistorial) => {
          acc[delivery.elemento] = (acc[delivery.elemento] || 0) + delivery.cantidad;
          return acc;
        }, {});

        this.metrics.topSuppliesUsed = Object.entries(supplyCount)
          .map(([name, count]) => ({ name, count: count as number }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
      },
      error: (error) => {
        console.error('Error loading delivery metrics:', error);
      }
    });
  }

  getZoneKeys(): number[] {
    return Object.keys(this.metrics.associatesByZone).map(key => parseInt(key));
  }

  getStockPercentage(current: number, min: number): number {
    if (min === 0) return 100;
    return Math.max(0, Math.min(100, (current / (min * 2)) * 100));
  }

  getStockColor(current: number, min: number): string {
    const percentage = this.getStockPercentage(current, min);
    if (percentage < 30) return 'warn';
    if (percentage < 60) return 'accent';
    return 'primary';
  }

  refreshData() {
    this.loadDashboardData();
  }

  // ========================= MÉTODOS PARA REPORTES PDF =========================

  /**
   * 1. Reporte General por Elementos
   * Lista de todos los elementos entregados, total de cantidades, detalles de entregas
   */
  async downloadGeneralElementsReport(): Promise<void> {
    try {
      this.snackBar.open('Generando reporte general por elementos...', '', { duration: 2000 });

      const elementsSummary = await firstValueFrom(
        this.http.get<any[]>('/api/delivery/elements-summary/pdf-data')
      );

      if (!elementsSummary || elementsSummary.length === 0) {
        this.snackBar.open('No hay datos de entregas para generar el reporte', '', { duration: 3000 });
        return;
      }

      await this.pdfReportService.generateElementSummaryReport(elementsSummary);
      this.snackBar.open('✅ Reporte general generado exitosamente', '', { duration: 3000 });
    } catch (error) {
      console.error('Error generando reporte general:', error);
      this.snackBar.open('❌ Error al generar el reporte general', '', { duration: 5000 });
    }
  }

  /**
   * 2. Reporte por Elemento Específico
   * Historial completo de un elemento específico (quién, cuándo, cantidades)
   */
  async downloadSpecificElementReport(): Promise<void> {
    try {
      // Obtener lista de elementos únicos del inventario
      const supplies = await firstValueFrom(this.supplyService.getAllSupplies());
      const uniqueElements = Array.from(new Set(supplies.map(item => item.name)))
        .sort()
        .map(elemento => ({ value: elemento, viewValue: elemento }));

      if (uniqueElements.length === 0) {
        this.snackBar.open('No hay elementos en el inventario', '', { duration: 3000 });
        return;
      }

      // Mostrar diálogo de selección
      const selectedElement = await this.showElementSelectionDialog(uniqueElements);
      
      if (selectedElement) {
        this.snackBar.open(`Generando reporte para ${selectedElement}...`, '', { duration: 2000 });

        const response = await firstValueFrom(
          this.http.get<any>(`/api/delivery/element/${encodeURIComponent(selectedElement)}/pdf-data`)
        );

        await this.pdfReportService.generateSingleElementReport(
          response.elemento,
          response.deliveries
        );

        this.snackBar.open('✅ Reporte de elemento generado exitosamente', '', { duration: 3000 });
      }
    } catch (error) {
      console.error('Error generando reporte del elemento:', error);
      this.snackBar.open('❌ Error al generar el reporte del elemento', '', { duration: 5000 });
    }
  }

  /**
   * 3. Reporte Individual de Asociado
   * Todo lo que ha recibido un asociado específico (fechas, elementos, cantidades, observaciones)
   */
  async downloadAssociateReport(): Promise<void> {
    try {
      const users = this.usersService.getUsers();
      
      if (users.length === 0) {
        this.snackBar.open('No hay asociados registrados', '', { duration: 3000 });
        return;
      }

      // Mostrar diálogo de selección de asociado
      const selectedUser = await this.showAssociateSelectionDialog(users);
      
      if (selectedUser) {
        this.snackBar.open(`Generando reporte para ${selectedUser.nombre} ${selectedUser.apellido}...`, '', { duration: 2000 });

        const response = await firstValueFrom(
          this.http.get<any>(`/api/delivery/associate/${selectedUser.id}/pdf-data`)
        );

        await this.pdfReportService.generateAssociateDeliveryReport(
          `${response.associate.nombre} ${response.associate.apellido}`,
          response.associate.cedula,
          response.deliveries
        );

        this.snackBar.open('✅ Reporte de asociado generado exitosamente', '', { duration: 3000 });
      }
    } catch (error) {
      console.error('Error generando reporte del asociado:', error);
      this.snackBar.open('❌ Error al generar el reporte del asociado', '', { duration: 5000 });
    }
  }

  // ========================= MÉTODOS AUXILIARES =========================

  private showElementSelectionDialog(elements: { value: string, viewValue: string }[]): Promise<string | null> {
    return new Promise((resolve) => {
      const elementsList = elements.map((el, index) => `${index + 1}. ${el.value}`).join('\n');
      const userInput = prompt(`📋 SELECCIONE ELEMENTO PARA REPORTE\n\n${elementsList}\n\nIngrese el número del elemento:`);
      
      if (userInput) {
        const selectedIndex = parseInt(userInput) - 1;
        if (selectedIndex >= 0 && selectedIndex < elements.length) {
          resolve(elements[selectedIndex].value);
        } else {
          alert('❌ Número inválido. Por favor intente de nuevo.');
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  }

  private showAssociateSelectionDialog(users: any[]): Promise<any | null> {
    return new Promise((resolve) => {
      const usersList = users.map((user, index) => 
        `${index + 1}. ${user.nombre} ${user.apellido} (${user.cedula})`
      ).join('\n');
      
      const userInput = prompt(`👥 SELECCIONE ASOCIADO PARA REPORTE\n\n${usersList}\n\nIngrese el número del asociado:`);
      
      if (userInput) {
        const selectedIndex = parseInt(userInput) - 1;
        if (selectedIndex >= 0 && selectedIndex < users.length) {
          resolve(users[selectedIndex]);
        } else {
          alert('❌ Número inválido. Por favor intente de nuevo.');
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  }
}
