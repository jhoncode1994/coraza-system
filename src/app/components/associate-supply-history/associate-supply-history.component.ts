import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EntregaDotacionService, EntregaHistorial } from '../../services/entrega-dotacion.service';
import { SignatureViewerComponent } from '../signature-viewer/signature-viewer.component';
import { RevertDeliveryDialogComponent } from '../revert-delivery-dialog/revert-delivery-dialog.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-associate-supply-history',
  templateUrl: './associate-supply-history.component.html',
  styleUrls: ['./associate-supply-history.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    MatTableModule, 
    MatProgressSpinnerModule, 
    MatCardModule, 
    MatButtonModule, 
    MatIconModule, 
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  providers: []
})
export class AssociateSupplyHistoryComponent implements OnInit {
  @Input() associateId!: number;
  history: EntregaHistorial[] = [];
  isLoading = false;
  error: string | null = null;
  displayedColumns: string[] = ['elemento', 'cantidad', 'fechaEntrega', 'observaciones', 'firma', 'acciones'];
  isAdmin: boolean = false;

  constructor(
    private entregaDotacionService: EntregaDotacionService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {
    this.isAdmin = this.authService.isAdmin();
  }

  ngOnInit() {
    if (this.associateId) {
      this.loadHistory();
    }
  }

  loadHistory() {
    this.isLoading = true;
    this.entregaDotacionService.getEntregasByUser(this.associateId).subscribe({
      next: (data: EntregaHistorial[]) => {
        this.history = data;
        this.isLoading = false;
      },
      error: (err: any) => {
        this.error = 'Error al cargar el historial de dotación';
        this.isLoading = false;
        console.error('Error loading history:', err);
      }
    });
  }

  viewSignature(signature: string) {
    this.dialog.open(SignatureViewerComponent, {
      data: { signature },
      width: '500px',
      maxWidth: '90vw'
    });
  }

  revertEntrega(entrega: EntregaHistorial) {
    const dialogRef = this.dialog.open(RevertDeliveryDialogComponent, {
      data: { entrega },
      width: '550px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(motivo => {
      if (motivo) {
        const currentUser = this.authService.getCurrentUser();
        const revertidoPor = currentUser?.email || 'admin';
        
        this.entregaDotacionService.revertEntrega(entrega.id, motivo, revertidoPor).subscribe({
          next: (response) => {
            this.snackBar.open('✅ Entrega revertida correctamente. Stock devuelto al inventario.', 'Cerrar', {
              duration: 5000,
              panelClass: ['success-snackbar']
            });
            this.loadHistory(); // Recargar el historial
          },
          error: (error) => {
            const errorMessage = error.error?.error || 'Error al revertir la entrega';
            this.snackBar.open(`❌ ${errorMessage}`, 'Cerrar', {
              duration: 4000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  isRevertida(entrega: EntregaHistorial): boolean {
    return entrega.estado === 'revertida';
  }
}
