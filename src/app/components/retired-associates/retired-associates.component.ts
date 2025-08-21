import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RetiredAssociatesService, RetiredAssociate } from '../../services/retired-associates.service';

@Component({
  selector: 'app-retired-associates',
  template: `
    <div class="retired-associates-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <mat-icon>person_off</mat-icon>
            Asociados Retirados
          </mat-card-title>
          <mat-card-subtitle>
            Historial de asociados que se han retirado de la cooperativa
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <!-- Filtro de búsqueda -->
          <div class="search-container">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Buscar por nombre, apellido o cédula</mat-label>
              <mat-icon matPrefix>search</mat-icon>
              <input matInput [(ngModel)]="searchTerm" (input)="applyFilter()" placeholder="Buscar...">
            </mat-form-field>
          </div>

          <!-- Estadísticas -->
          <div class="stats-container" *ngIf="stats">
            <div class="stat-card">
              <h3>{{stats.total}}</h3>
              <p>Total Retirados</p>
            </div>
          </div>

          <!-- Tabla de asociados retirados -->
          <div class="table-container" *ngIf="!isLoading; else loadingTemplate">
            <table mat-table [dataSource]="filteredAssociates" class="retired-table">
              
              <!-- Columna Nombre -->
              <ng-container matColumnDef="nombre">
                <th mat-header-cell *matHeaderCellDef>Nombre Completo</th>
                <td mat-cell *matCellDef="let associate">
                  {{associate.nombre}} {{associate.apellido}}
                </td>
              </ng-container>

              <!-- Columna Cédula -->
              <ng-container matColumnDef="cedula">
                <th mat-header-cell *matHeaderCellDef>Cédula</th>
                <td mat-cell *matCellDef="let associate">{{associate.cedula}}</td>
              </ng-container>

              <!-- Columna Zona -->
              <ng-container matColumnDef="zona">
                <th mat-header-cell *matHeaderCellDef>Zona</th>
                <td mat-cell *matCellDef="let associate">
                  <mat-chip color="primary">Zona {{associate.zona}}</mat-chip>
                </td>
              </ng-container>

              <!-- Columna Fecha de Retiro -->
              <ng-container matColumnDef="retired_date">
                <th mat-header-cell *matHeaderCellDef>Fecha de Retiro</th>
                <td mat-cell *matCellDef="let associate">
                  {{formatDate(associate.retired_date)}}
                </td>
              </ng-container>

              <!-- Columna Motivo -->
              <ng-container matColumnDef="retired_reason">
                <th mat-header-cell *matHeaderCellDef>Motivo</th>
                <td mat-cell *matCellDef="let associate">
                  <span class="reason-text" [matTooltip]="associate.retired_reason">
                    {{truncateText(associate.retired_reason, 30)}}
                  </span>
                </td>
              </ng-container>

              <!-- Columna Acciones -->
              <ng-container matColumnDef="acciones">
                <th mat-header-cell *matHeaderCellDef>Acciones</th>
                <td mat-cell *matCellDef="let associate">
                  <button mat-icon-button color="primary" 
                          (click)="viewHistory(associate)"
                          matTooltip="Ver historial de dotaciones">
                    <mat-icon>history</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <div class="no-data" *ngIf="filteredAssociates.length === 0">
              <mat-icon>inbox</mat-icon>
              <p>No hay asociados retirados</p>
            </div>
          </div>

          <ng-template #loadingTemplate>
            <div class="loading-container">
              <mat-spinner></mat-spinner>
              <p>Cargando asociados retirados...</p>
            </div>
          </ng-template>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .retired-associates-container {
      padding: 20px;
    }

    .search-container {
      margin-bottom: 20px;
    }

    .search-field {
      width: 100%;
      max-width: 400px;
    }

    .stats-container {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
    }

    .stat-card {
      padding: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 8px;
      text-align: center;
      min-width: 120px;
    }

    .stat-card h3 {
      margin: 0 0 8px 0;
      font-size: 2em;
      font-weight: bold;
    }

    .stat-card p {
      margin: 0;
      opacity: 0.9;
    }

    .table-container {
      width: 100%;
      overflow-x: auto;
    }

    .retired-table {
      width: 100%;
    }

    .reason-text {
      display: inline-block;
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .no-data {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .no-data mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
    }

    .loading-container p {
      margin-top: 16px;
      color: #666;
    }

    mat-card-header mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule
  ]
})
export class RetiredAssociatesComponent implements OnInit {
  retiredAssociates: RetiredAssociate[] = [];
  filteredAssociates: RetiredAssociate[] = [];
  displayedColumns: string[] = ['nombre', 'cedula', 'zona', 'retired_date', 'retired_reason', 'acciones'];
  searchTerm: string = '';
  isLoading = true;
  stats: any = null;

  constructor(
    private retiredAssociatesService: RetiredAssociatesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadRetiredAssociates();
    this.loadStats();
  }

  loadRetiredAssociates() {
    this.isLoading = true;
    this.retiredAssociatesService.getRetiredAssociates().subscribe({
      next: (associates) => {
        this.retiredAssociates = associates;
        this.filteredAssociates = associates;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando asociados retirados:', error);
        this.snackBar.open('Error al cargar asociados retirados', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }

  loadStats() {
    this.retiredAssociatesService.getRetiredAssociatesStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (error) => {
        console.error('Error cargando estadísticas:', error);
      }
    });
  }

  applyFilter() {
    if (!this.searchTerm.trim()) {
      this.filteredAssociates = this.retiredAssociates;
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredAssociates = this.retiredAssociates.filter(associate =>
      associate.nombre.toLowerCase().includes(term) ||
      associate.apellido.toLowerCase().includes(term) ||
      associate.cedula.includes(term)
    );
  }

  viewHistory(associate: RetiredAssociate) {
    // TODO: Implementar diálogo para mostrar historial
    this.snackBar.open(`Ver historial de ${associate.nombre} ${associate.apellido}`, 'Cerrar', {
      duration: 3000
    });
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  truncateText(text: string, length: number): string {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  }
}
