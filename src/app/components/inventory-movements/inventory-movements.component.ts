import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { InventoryMovementsService, InventoryMovement } from '../../services/inventory-movements.service';

@Component({
  selector: 'app-inventory-movements',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSortModule,
    MatChipsModule,
    FormsModule
  ],
  templateUrl: './inventory-movements.component.html',
  styleUrls: ['./inventory-movements.component.scss']
})
export class InventoryMovementsComponent implements OnInit {
  dataSource: MatTableDataSource<InventoryMovement>;
  displayedColumns: string[] = [
    'created_at',
    'supply_name',
    'movement_type',
    'quantity',
    'previous_quantity',
    'new_quantity',
    'reason'
  ];

  isLoading = false;
  allMovements: InventoryMovement[] = [];
  
  // Filtros
  selectedMovementType: string = 'all';
  searchText: string = '';

  @ViewChild(MatSort) sort!: MatSort;

  constructor(private movementsService: InventoryMovementsService) {
    this.dataSource = new MatTableDataSource<InventoryMovement>([]);
  }

  ngOnInit() {
    this.loadMovements();
  }

  loadMovements() {
    this.isLoading = true;
    this.movementsService.movements$.subscribe({
      next: (movements: InventoryMovement[]) => {
        this.allMovements = movements;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading movements:', error);
        this.isLoading = false;
      }
    });
    this.movementsService.loadMovements();
  }

  applyFilters() {
    let filtered = [...this.allMovements];

    // Filtrar por tipo de movimiento
    if (this.selectedMovementType !== 'all') {
      filtered = filtered.filter(m => m.movement_type === this.selectedMovementType);
    }

    // Filtrar por texto de búsqueda
    if (this.searchText.trim()) {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter(m => 
        m.supply_name?.toLowerCase().includes(search) ||
        m.reason?.toLowerCase().includes(search) ||
        m.user_name?.toLowerCase().includes(search)
      );
    }

    this.dataSource.data = filtered;
    this.dataSource.sort = this.sort;
  }

  clearFilters() {
    this.selectedMovementType = 'all';
    this.searchText = '';
    this.applyFilters();
  }

  getMovementTypeColor(type: string): string {
    return type === 'entrada' ? 'primary' : 'warn';
  }

  getMovementTypeIcon(type: string): string {
    return type === 'entrada' ? 'arrow_downward' : 'arrow_upward';
  }

  formatDate(date: any): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
