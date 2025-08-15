import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { EntregaDotacionService, EntregaHistorial } from '../../services/entrega-dotacion.service';
import { SignatureViewerComponent } from '../signature-viewer/signature-viewer.component';

@Component({
  selector: 'app-employee-supply-history',
  templateUrl: './employee-supply-history.component.html',
  styleUrls: ['./employee-supply-history.component.scss'],
  standalone: true,
  imports: [CommonModule, MatTableModule, MatProgressSpinnerModule, MatCardModule, MatButtonModule, MatIconModule, MatDialogModule]
})
export class EmployeeSupplyHistoryComponent implements OnInit {
  @Input() employeeId!: number;
  history: EntregaHistorial[] = [];
  isLoading = false;
  error: string | null = null;
  displayedColumns: string[] = ['elemento', 'cantidad', 'fechaEntrega', 'observaciones', 'firma'];

  constructor(
    private entregaDotacionService: EntregaDotacionService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    if (this.employeeId) {
      this.isLoading = true;
      this.entregaDotacionService.getEntregasByUser(this.employeeId).subscribe({
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
  }

  viewSignature(signature: string) {
    this.dialog.open(SignatureViewerComponent, {
      data: { signature },
      width: '500px',
      maxWidth: '90vw'
    });
  }
}
