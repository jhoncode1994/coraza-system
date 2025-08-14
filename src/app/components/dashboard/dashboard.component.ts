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
import { RouterModule } from '@angular/router';

import { UsersService } from '../users/users.service';
import { SupplyInventoryService } from '../../services/supply-inventory.service';
import { EntregaDotacionService, EntregaHistorial } from '../../services/entrega-dotacion.service';
import { SupplyItem } from '../../interfaces/supply-item.interface';

interface DashboardMetrics {
  totalEmployees: number;
  totalSupplies: number;
  lowStockItems: number;
  deliveriesToday: number;
  deliveriesThisMonth: number;
  employeesByZone: { [key: number]: number };
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
    RouterModule
  ]
})
export class DashboardComponent implements OnInit {
  metrics: DashboardMetrics = {
    totalEmployees: 0,
    totalSupplies: 0,
    lowStockItems: 0,
    deliveriesToday: 0,
    deliveriesThisMonth: 0,
    employeesByZone: {},
    topSuppliesUsed: [],
    criticalStockItems: []
  };

  isLoading = true;

  constructor(
    private usersService: UsersService,
    private supplyService: SupplyInventoryService,
    private deliveryService: EntregaDotacionService
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.isLoading = true;
    
    // Cargar métricas de empleados
    this.loadEmployeeMetrics();
    
    // Cargar métricas de inventario
    this.loadInventoryMetrics();
    
    // Cargar métricas de entregas
    this.loadDeliveryMetrics();
    
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  private loadEmployeeMetrics() {
    const users = this.usersService.getUsers();
    this.metrics.totalEmployees = users.length;
    
    // Agrupar empleados por zona
    this.metrics.employeesByZone = users.reduce((acc, user) => {
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
    return Object.keys(this.metrics.employeesByZone).map(key => parseInt(key));
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
}
