import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { SupplyInventoryService } from '../../services/supply-inventory.service';
import { InventoryMovementsService } from '../../services/inventory-movements.service';
import { SupplyItem } from '../../interfaces/supply-item.interface';
import { AddStockDialogComponent, AddStockDialogData } from './add-stock-dialog.component';

@Component({
  selector: 'app-supply-inventory',
  templateUrl: './supply-inventory.component.html',
  styleUrls: ['./supply-inventory.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSortModule,
    MatSnackBarModule,
    MatChipsModule,
    MatSelectModule,
    MatBadgeModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    AddStockDialogComponent
  ]
})
export class SupplyInventoryComponent implements OnInit {
  dataSource: MatTableDataSource<SupplyItem>;
  displayedColumns: string[] = ['code', 'name', 'category', 'quantity', 'minimumQuantity', 'lastUpdate', 'addStock'];
  isLoading = false;
  error: string | null = null;
  categories = ['uniforme', 'accesorios'];
  selectedCategory = '';
  lowStockItems: SupplyItem[] = [];

  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private supplyInventoryService: SupplyInventoryService,
    private movementsService: InventoryMovementsService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.dataSource = new MatTableDataSource<SupplyItem>([]);
  }

  ngOnInit() {
    this.loadSupplies();
    this.checkLowStock();
  }

  loadSupplies() {
    this.isLoading = true;
    this.supplyInventoryService.getAllSupplies().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.dataSource.sort = this.sort;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar el inventario';
        this.snackBar.open('Error al cargar el inventario', 'Cerrar', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  filterByCategory(category: string) {
    this.selectedCategory = category;
    this.dataSource.filter = category;
    this.dataSource.filterPredicate = (data: SupplyItem, filter: string) => {
      return !filter || data.category === filter;
    };
  }

  exportToExcel(): void {
    // Use native browser download method for better compatibility
    this.downloadCSV();
  }

  private downloadCSV(): void {
    // Create worksheet headers
    const headers = ['ID', 'Código', 'Nombre', 'Categoría', 'Cantidad', 'Cantidad Mínima', 'Última Actualización'];
    
    // Prepare data for export
    const exportData = this.dataSource.data.map((item: SupplyItem) => [
      item.id,
      item.code,
      item.name,
      item.category,
      item.quantity,
      item.minimumQuantity,
      item.lastUpdate
    ]);
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...exportData.map((row: any[]) => row.join(','))
    ].join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventario-suministros-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  openAddStockDialog(item: SupplyItem): void {
    const dialogData: AddStockDialogData = {
      supply: item
    };

    const dialogRef = this.dialog.open(AddStockDialogComponent, {
      width: '500px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // result contains: { quantity: number, reason: string, notes?: string }
        this.movementsService.addStock(item.id, result.quantity, result.reason, result.notes)
          .subscribe({
            next: (response) => {
              this.snackBar.open(
                `Se agregaron ${result.quantity} unidades de ${item.name}`, 
                'Cerrar', 
                { duration: 3000 }
              );
              this.loadSupplies();
            },
            error: (error) => {
              console.error('Error adding stock:', error);
              this.snackBar.open('Error al agregar stock al inventario', 'Cerrar', { duration: 3000 });
            }
          });
      }
    });
  }

  private checkLowStock(): void {
    this.supplyInventoryService.checkLowStock().subscribe((items: SupplyItem[]) => {
      this.lowStockItems = items;
      if (items.length > 0) {
        this.snackBar.open(`¡Alerta! ${items.length} elementos con stock bajo`, 'Ver', {
          duration: 5000
        }).onAction().subscribe(() => {
          this.filterByCategory('low-stock');
        });
      }
    });
  }
}
