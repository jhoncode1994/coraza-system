import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RetiredAssociatesService, RetiredAssociate, RetiredSupplyHistory } from '../../services/retired-associates.service';

@Component({
  selector: 'app-retired-associate-history-dialog',
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>
        <mat-icon>history</mat-icon>
        Historial de Dotaciones - {{data.associate.nombre}} {{data.associate.apellido}}
      </h2>

      <mat-dialog-content>
        <div class="associate-info">
          <p><strong>Cédula:</strong> {{data.associate.cedula}}</p>
          <p><strong>Zona:</strong> {{data.associate.zona}}</p>
          <p><strong>Fecha de retiro:</strong> {{formatDate(data.associate.retired_date)}}</p>
        </div>

        <div *ngIf="isLoading; else contentTemplate" class="loading-container">
          <mat-spinner></mat-spinner>
          <p>Cargando historial...</p>
        </div>

        <ng-template #contentTemplate>
          <div *ngIf="history.length > 0; else noDataTemplate">
            <table mat-table [dataSource]="history" class="history-table">
              
              <!-- Columna Elemento -->
              <ng-container matColumnDef="elemento">
                <th mat-header-cell *matHeaderCellDef>Elemento</th>
                <td mat-cell *matCellDef="let item">{{item.elemento}}</td>
              </ng-container>

              <!-- Columna Cantidad -->
              <ng-container matColumnDef="cantidad">
                <th mat-header-cell *matHeaderCellDef>Cantidad</th>
                <td mat-cell *matCellDef="let item">{{item.cantidad}}</td>
              </ng-container>

              <!-- Columna Fecha de Entrega -->
              <ng-container matColumnDef="delivered_at">
                <th mat-header-cell *matHeaderCellDef>Fecha de Entrega</th>
                <td mat-cell *matCellDef="let item">{{formatDate(item.delivered_at)}}</td>
              </ng-container>

              <!-- Columna Observaciones -->
              <ng-container matColumnDef="observaciones">
                <th mat-header-cell *matHeaderCellDef>Observaciones</th>
                <td mat-cell *matCellDef="let item">
                  <span [matTooltip]="item.observaciones || 'Sin observaciones'">
                    {{truncateText(item.observaciones || 'Sin observaciones', 30)}}
                  </span>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>

          <ng-template #noDataTemplate>
            <div class="no-data">
              <mat-icon>inbox</mat-icon>
              <p>No hay historial de dotaciones para este asociado</p>
            </div>
          </ng-template>
        </ng-template>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Cerrar</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      width: 100%;
      max-width: 800px;
    }

    .associate-info {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .associate-info p {
      margin: 8px 0;
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

    .history-table {
      width: 100%;
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

    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
    }

    mat-dialog-content {
      max-height: 500px;
      overflow-y: auto;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ]
})
export class RetiredAssociateHistoryDialogComponent implements OnInit {
  history: RetiredSupplyHistory[] = [];
  displayedColumns: string[] = ['elemento', 'cantidad', 'delivered_at', 'observaciones'];
  isLoading = true;

  constructor(
    public dialogRef: MatDialogRef<RetiredAssociateHistoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { associate: RetiredAssociate },
    private retiredAssociatesService: RetiredAssociatesService
  ) {}

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    if (!this.data.associate.id) {
      console.error('No se encontró ID del asociado retirado');
      this.isLoading = false;
      return;
    }

    this.retiredAssociatesService.getRetiredAssociateHistory(this.data.associate.id).subscribe({
      next: (history) => {
        this.history = history;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando historial:', error);
        this.isLoading = false;
      }
    });
  }

  formatDate(date: Date | string): string {
    if (!date) return 'Sin fecha';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
}
