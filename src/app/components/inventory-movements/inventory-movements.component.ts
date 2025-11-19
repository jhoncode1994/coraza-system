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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InventoryMovementsService, InventoryMovement } from '../../services/inventory-movements.service';
import { AuthService } from '../../services/auth.service';
import { RevertIngresoDialogComponent } from '../revert-ingreso-dialog/revert-ingreso-dialog.component';
import { PdfReportService } from '../../services/pdf-report.service';

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
    FormsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule
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
    'reason',
    'actions'
  ];

  isLoading = false;
  allMovements: InventoryMovement[] = [];
  
  // Filtros
  selectedMovementType: string = 'all';
  searchText: string = '';

  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private movementsService: InventoryMovementsService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private pdfReportService: PdfReportService
  ) {
    this.dataSource = new MatTableDataSource<InventoryMovement>([]);
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
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

  canRevertMovement(movement: InventoryMovement): boolean {
    // Solo admin puede revertir y solo movimientos de tipo 'entrada'
    return this.isAdmin && movement.movement_type === 'entrada';
  }

  revertIngreso(movement: InventoryMovement): void {
    const dialogRef = this.dialog.open(RevertIngresoDialogComponent, {
      width: '600px',
      data: { movement }
    });

    dialogRef.afterClosed().subscribe((motivo: string) => {
      if (motivo) {
        this.isLoading = true;
        const currentUser = this.authService.getCurrentUser();
        const revertidoPor = currentUser?.username || 'Administrador';

        this.movementsService.revertMovement(movement.id!, motivo, revertidoPor).subscribe({
          next: (response) => {
            this.snackBar.open(
              `Ingreso revertido exitosamente. Stock actualizado: ${response.newStock}`,
              'Cerrar',
              { duration: 5000, panelClass: ['success-snackbar'] }
            );
            this.loadMovements();
          },
          error: (error) => {
            console.error('Error al revertir ingreso:', error);
            this.snackBar.open(
              error.error?.error || 'Error al revertir el ingreso',
              'Cerrar',
              { duration: 5000, panelClass: ['error-snackbar'] }
            );
            this.isLoading = false;
          }
        });
      }
    });
  }

  downloadPDF(): void {
    try {
      // Obtener los movimientos actualmente filtrados/mostrados
      const movementsToExport = this.dataSource.data;
      
      if (movementsToExport.length === 0) {
        this.snackBar.open(
          'No hay movimientos para exportar',
          'Cerrar',
          { duration: 3000 }
        );
        return;
      }

      // Preparar filtros para incluir en el PDF
      const filters = {
        type: this.selectedMovementType,
        search: this.searchText
      };

      // Generar PDF
      this.pdfReportService.generateInventoryMovementsReport(movementsToExport, filters);
      
      this.snackBar.open(
        `PDF generado con ${movementsToExport.length} movimiento(s)`,
        'Cerrar',
        { duration: 3000, panelClass: ['success-snackbar'] }
      );
    } catch (error) {
      console.error('Error generando PDF:', error);
      this.snackBar.open(
        'Error al generar el PDF',
        'Cerrar',
        { duration: 5000, panelClass: ['error-snackbar'] }
      );
    }
  }
}
