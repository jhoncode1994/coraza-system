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
import { AddSupplyDialogComponent } from './add-supply-dialog.component';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
// Dynamic import for file-saver to avoid build issues
import { SupplyInventoryService } from '../../services/supply-inventory.service';
import { SupplyItem } from '../../interfaces/supply-item.interface';

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
    MatDialogModule
  ]
})
export class SupplyInventoryComponent implements OnInit {
  dataSource: MatTableDataSource<SupplyItem>;
  displayedColumns: string[] = ['code', 'name', 'category', 'quantity', 'minimumQuantity', 'lastUpdate', 'actions'];
  isLoading = false;
  error: string | null = null;
  categories = ['uniforme', 'accesorios'];
  selectedCategory = '';
  lowStockItems: SupplyItem[] = [];

  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private supplyInventoryService: SupplyInventoryService,
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

  updateQuantity(supply: SupplyItem, change: number) {
    const newQuantity = Math.max(0, supply.quantity + change);
    this.supplyInventoryService.updateSupplyQuantity(supply.id, newQuantity)
      .subscribe({
        next: (updatedSupply) => {
          const data = this.dataSource.data;
          const index = data.findIndex(s => s.id === updatedSupply.id);
          if (index !== -1) {
            data[index] = updatedSupply;
            this.dataSource.data = [...data];
            this.checkLowStock();
          }
        },
        error: (error) => {
          this.snackBar.open('Error al actualizar la cantidad', 'Cerrar', { duration: 3000 });
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

  async exportToExcel(): Promise<void> {
    // Dynamic import to avoid build issues
    try {
      const fileSaver = await import('file-saver');
      
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
      
      // Create blob and save file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      fileSaver.saveAs(blob, `inventario-suministros-${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      console.error('Error loading file-saver:', error);
      // Fallback to native download
      this.fallbackDownload();
    }
  }

  private fallbackDownload(): void {
    // Native browser download method
    const headers = ['ID', 'Código', 'Nombre', 'Categoría', 'Cantidad', 'Cantidad Mínima', 'Última Actualización'];
    const exportData = this.dataSource.data.map((item: SupplyItem) => [
      item.id,
      item.code,
      item.name,
      item.category,
      item.quantity,
      item.minimumQuantity,
      item.lastUpdate
    ]);
    
    const csvContent = [
      headers.join(','),
      ...exportData.map((row: any[]) => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventario-suministros-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  openAddSupplyDialog(): void {
    const dialogRef = this.dialog.open(AddSupplyDialogComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.supplyInventoryService.addSupply(result).subscribe({
          next: (response) => {
            this.snackBar.open('Elemento agregado exitosamente', 'Cerrar', { duration: 3000 });
            this.loadSupplies();
          },
          error: (error) => {
            this.snackBar.open('Error al agregar el elemento', 'Cerrar', { duration: 3000 });
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
