import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { EmployeeSupplyHistoryComponent } from '../employee-supply-history/employee-supply-history.component';

@Component({
  selector: 'app-history-dialog',
  template: `
    <h2 mat-dialog-title>Historial de Dotación - {{data.user.nombre}} {{data.user.apellido}}</h2>
    <mat-dialog-content>
      <app-employee-supply-history [employeeId]="data.user.id"></app-employee-supply-history>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button (click)="close()">Cerrar</button>
    </mat-dialog-actions>
  `,
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    EmployeeSupplyHistoryComponent
  ],
})
export class HistoryDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<HistoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: any }
  ) {}

  close(): void {
    this.dialogRef.close();
  }
}
