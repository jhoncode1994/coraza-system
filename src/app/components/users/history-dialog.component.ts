import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { AssociateSupplyHistoryComponent } from '../associate-supply-history/associate-supply-history.component';

@Component({
  selector: 'app-history-dialog',
  template: `
    <h2 mat-dialog-title>Historial de Dotación - {{data.user.nombre}} {{data.user.apellido}}</h2>
    <mat-dialog-content>
      <app-associate-supply-history [associateId]="data.user.id"></app-associate-supply-history>
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
    AssociateSupplyHistoryComponent
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
