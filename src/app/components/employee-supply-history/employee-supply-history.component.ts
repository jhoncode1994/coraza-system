import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { EntregaDotacionService, EntregaHistorial } from '../../services/entrega-dotacion.service';

@Component({
  selector: 'app-employee-supply-history',
  templateUrl: './employee-supply-history.component.html',
  styleUrls: ['./employee-supply-history.component.scss'],
  standalone: true,
  imports: [CommonModule, MatTableModule, MatProgressSpinnerModule, MatCardModule]
})
export class EmployeeSupplyHistoryComponent implements OnInit {
  @Input() employeeId!: number;
  history: EntregaHistorial[] = [];
  isLoading = false;
  error: string | null = null;
  displayedColumns: string[] = ['elemento', 'cantidad', 'fechaEntrega', 'observaciones'];

  constructor(private entregaDotacionService: EntregaDotacionService) {}

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
}
