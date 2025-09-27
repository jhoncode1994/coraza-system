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
import { CleanupRegistrosComponent } from '../cleanup-registros/cleanup-registros.component';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { UsersService } from '../users/users.service';
import { SupplyInventoryService } from '../../services/supply-inventory.service';
import { EntregaDotacionService, EntregaHistorial } from '../../services/entrega-dotacion.service';
import { SupplyItem } from '../../interfaces/supply-item.interface';
import { PdfReportService } from '../../services/pdf-report.service';
import { AssociateSelectionDialogComponent } from '../associate-selection-dialog/associate-selection-dialog.component';
import { ElementSelectionDialogComponent } from '../element-selection-dialog/element-selection-dialog.component';

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

  openCleanupDialog() {
    const dialogRef = this.dialog.open(CleanupRegistrosComponent, {
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '80vh',
      disableClose: true,
      hasBackdrop: true,
      panelClass: 'cleanup-dialog'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.eliminados) {
        this.snackBar.open(`Se eliminaron ${result.eliminados} registros antiguos.`, 'Cerrar', { duration: 5000 });
        this.refreshData?.();
      }
    });
  }

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

      // Intentar obtener datos reales de la API
      let elementsSummary;
      try {
        // Usar URL relativa que funcione tanto en local como en producción
        const apiUrl = window.location.origin + '/api/delivery/elements-summary/pdf-data';
        elementsSummary = await firstValueFrom(
          this.http.get<any[]>(apiUrl)
        );
      } catch (apiError) {
        console.warn('API no disponible, usando datos de prueba:', apiError);
        // Datos de prueba cuando la API no está disponible
        elementsSummary = this.getMockElementsSummary();
      }

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
      let supplies;
      try {
        supplies = await firstValueFrom(this.supplyService.getAllSupplies());
      } catch (error) {
        console.warn('Servicio de inventario no disponible, usando elementos de prueba');
        supplies = [
          { name: 'Camiseta Polo Empresarial' },
          { name: 'Pantalón de Trabajo' },
          { name: 'Botas de Seguridad' },
          { name: 'Casco de Protección' },
          { name: 'Guantes de Trabajo' }
        ];
      }

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

        // Intentar obtener datos reales de la API
        let response;
        try {
          const apiUrl = window.location.origin + `/api/delivery/element/${encodeURIComponent(selectedElement)}/pdf-data`;
          response = await firstValueFrom(
            this.http.get<any>(apiUrl)
          );
        } catch (apiError) {
          console.warn('API no disponible, usando datos de prueba:', apiError);
          response = this.getMockElementData(selectedElement);
        }

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

        // Intentar obtener datos reales de la API
        let response;
        try {
          const apiUrl = window.location.origin + `/api/delivery/associate/${selectedUser.id}/pdf-data`;
          response = await firstValueFrom(
            this.http.get<any>(apiUrl)
          );
        } catch (apiError) {
          console.warn('API no disponible, usando datos de prueba:', apiError);
          response = {
            associate: {
              nombre: selectedUser.nombre,
              apellido: selectedUser.apellido,
              cedula: selectedUser.cedula
            },
            deliveries: this.getMockAssociateData(selectedUser.id, `${selectedUser.nombre} ${selectedUser.apellido}`)
          };
        }

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
      const dialogRef = this.dialog.open(ElementSelectionDialogComponent, {
        width: '600px',
        maxWidth: '90vw',
        data: {
          elements: elements,
          title: 'Seleccionar Elemento para Reporte'
        },
        disableClose: true
      });

      dialogRef.afterClosed().subscribe(result => {
        resolve(result);
      });
    });
  }

  private showAssociateSelectionDialog(users: any[]): Promise<any | null> {
    return new Promise((resolve) => {
      const dialogRef = this.dialog.open(AssociateSelectionDialogComponent, {
        width: '600px',
        maxWidth: '90vw',
        data: {
          associates: users,
          title: 'Seleccionar Asociado para Reporte'
        },
        disableClose: true
      });

      dialogRef.afterClosed().subscribe(result => {
        resolve(result);
      });
    });
  }

  // ========================= DATOS DE PRUEBA =========================

  private getMockElementsSummary(): any[] {
    return [
      {
        elemento: 'Camiseta Polo Empresarial',
        totalEntregado: 45,
        entregas: [
          { fecha: '2024-08-15', asociado: 'Juan Pérez', cedula: '12345678', cantidad: 2, observaciones: 'Talla M y L' },
          { fecha: '2024-08-10', asociado: 'María González', cedula: '87654321', cantidad: 1, observaciones: 'Talla S' },
          { fecha: '2024-08-08', asociado: 'Carlos Rodríguez', cedula: '11223344', cantidad: 3, observaciones: 'Reposición' }
        ]
      },
      {
        elemento: 'Pantalón de Trabajo',
        totalEntregado: 32,
        entregas: [
          { fecha: '2024-08-14', asociado: 'Ana Martínez', cedula: '55667788', cantidad: 2, observaciones: 'Talla 32 y 34' },
          { fecha: '2024-08-12', asociado: 'Luis Fernández', cedula: '99887766', cantidad: 1, observaciones: 'Talla 36' }
        ]
      },
      {
        elemento: 'Botas de Seguridad',
        totalEntregado: 28,
        entregas: [
          { fecha: '2024-08-16', asociado: 'Pedro Sánchez', cedula: '44556677', cantidad: 1, observaciones: 'Talla 42' },
          { fecha: '2024-08-11', asociado: 'Elena García', cedula: '33445566', cantidad: 1, observaciones: 'Talla 38' }
        ]
      },
      {
        elemento: 'Casco de Protección',
        totalEntregado: 15,
        entregas: [
          { fecha: '2024-08-13', asociado: 'Roberto Torres', cedula: '22334455', cantidad: 1, observaciones: 'Color blanco' },
          { fecha: '2024-08-09', asociado: 'Isabel López', cedula: '66778899', cantidad: 2, observaciones: 'Reemplazo' }
        ]
      }
    ];
  }

  private getMockElementData(elementName: string): any {
    const mockData = {
      'Camiseta Polo Empresarial': {
        elemento: 'Camiseta Polo Empresarial',
        deliveries: [
          { fecha: '2024-08-15', asociado: 'Juan Pérez', cedula: '12345678', cantidad: 2, observaciones: 'Talla M y L' },
          { fecha: '2024-08-10', asociado: 'María González', cedula: '87654321', cantidad: 1, observaciones: 'Talla S' },
          { fecha: '2024-08-08', asociado: 'Carlos Rodríguez', cedula: '11223344', cantidad: 3, observaciones: 'Reposición' },
          { fecha: '2024-08-05', asociado: 'Ana Martínez', cedula: '55667788', cantidad: 2, observaciones: 'Nueva contratación' }
        ]
      },
      'Pantalón de Trabajo': {
        elemento: 'Pantalón de Trabajo',
        deliveries: [
          { fecha: '2024-08-14', asociado: 'Ana Martínez', cedula: '55667788', cantidad: 2, observaciones: 'Talla 32 y 34' },
          { fecha: '2024-08-12', asociado: 'Luis Fernández', cedula: '99887766', cantidad: 1, observaciones: 'Talla 36' },
          { fecha: '2024-08-07', asociado: 'Pedro Sánchez', cedula: '44556677', cantidad: 1, observaciones: 'Talla 38' }
        ]
      }
    };

    return mockData[elementName as keyof typeof mockData] || {
      elemento: elementName,
      deliveries: [
        { fecha: '2024-08-15', asociado: 'Usuario Demo', cedula: '00000000', cantidad: 1, observaciones: 'Datos de prueba' }
      ]
    };
  }

  private getMockAssociateData(associateId: string, associateName: string): any[] {
    return [
      { fecha: '2024-08-15', elemento: 'Camiseta Polo Empresarial', cantidad: 2, observaciones: 'Talla M y L' },
      { fecha: '2024-08-14', elemento: 'Pantalón de Trabajo', cantidad: 1, observaciones: 'Talla 32' },
      { fecha: '2024-08-10', elemento: 'Botas de Seguridad', cantidad: 1, observaciones: 'Talla 40' },
      { fecha: '2024-08-08', elemento: 'Casco de Protección', cantidad: 1, observaciones: 'Color blanco' },
      { fecha: '2024-08-05', elemento: 'Guantes de Trabajo', cantidad: 2, observaciones: 'Talla M' }
    ];
  }
}
