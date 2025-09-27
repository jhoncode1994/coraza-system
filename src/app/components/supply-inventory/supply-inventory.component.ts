import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
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
import { requiereTalla } from '../../config/tallas.config';

@Component({
  selector: 'app-supply-inventory',
  templateUrl: './supply-inventory.component.html',
  styleUrls: ['./supply-inventory.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
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
  displayedColumns: string[] = ['name', 'category', 'talla', 'quantity', 'minimumQuantity', 'lastUpdate', 'addStock'];
  isLoading = false;
  error: string | null = null;
  lowStockItems: SupplyItem[] = [];
  selectedCategory: string = '';

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
      next: (supplies) => {
        // Aplicar ordenamiento inteligente por tallas
        const sortedSupplies = this.sortSuppliesIntelligently(supplies);
        this.dataSource.data = sortedSupplies;
        this.dataSource.sort = this.sort;
        this.isLoading = false;
        this.error = null;
      },
      error: (error) => {
        console.error('Error loading supplies:', error);
        this.error = 'Error al cargar el inventario de dotación';
        this.isLoading = false;
      }
    });
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

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  filterByCategory(category: string): void {
    this.selectedCategory = category;
    this.dataSource.filter = category.trim().toLowerCase();
    
    // Custom filter predicate para categorías
    this.dataSource.filterPredicate = (data: SupplyItem, filter: string) => {
      return !filter || data.category === filter;
    };
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
        // result contains: { quantity: number, reason: string, notes?: string, talla?: string }
        this.movementsService.addStock(item.id, result.quantity, result.reason, result.notes, result.talla)
          .subscribe({
            next: (response) => {
              const tallaText = result.talla ? ` (Talla: ${result.talla})` : '';
              this.snackBar.open(
                `Se agregaron ${result.quantity} unidades de ${item.name.toUpperCase()}${tallaText}`, 
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

  requiereTalla(category: string): boolean {
    return requiereTalla(category);
  }
}
