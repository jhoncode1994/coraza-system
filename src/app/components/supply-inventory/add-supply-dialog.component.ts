import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { SupplyItem } from '../../interfaces/supply-item.interface';

@Component({
  selector: 'app-add-supply',
  template: `
    <h2 mat-dialog-title>Agregar Elementos al Inventario</h2>
    <mat-dialog-content>
      <div class="add-supply-form">
        <mat-form-field>
          <mat-label>Elemento</mat-label>
          <mat-select [(ngModel)]="selectedItem">
            <mat-option *ngFor="let item of supplyItems" [value]="item">
              {{item.name}}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Cantidad a agregar</mat-label>
          <input matInput type="number" [(ngModel)]="quantity" min="1">
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" 
              (click)="onAdd()" 
              [disabled]="!selectedItem || !quantity || quantity < 1">
        Agregar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .add-supply-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 300px;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    FormsModule,
    MatDialogModule
  ]
})
export class AddSupplyDialogComponent {
  supplyItems = [
    { name: 'camisa', code: 'CAM', category: 'uniforme' },
    { name: 'corbata', code: 'COR', category: 'uniforme' },
    { name: 'apellido', code: 'APE', category: 'accesorios' },
    { name: 'pantalon', code: 'PAN', category: 'uniforme' },
    { name: 'cinturon', code: 'CIN', category: 'accesorios' },
    { name: 'kepis', code: 'KEP', category: 'uniforme' },
    { name: 'botas', code: 'BOT', category: 'uniforme' },
    { name: 'overol', code: 'OVE', category: 'uniforme' },
    { name: 'reata', code: 'REA', category: 'accesorios' },
    { name: 'goleana', code: 'GOL', category: 'accesorios' }
  ];

  selectedItem: any;
  quantity: number = 1;

  constructor(private dialogRef: MatDialogRef<AddSupplyDialogComponent>) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onAdd(): void {
    if (this.selectedItem && this.quantity > 0) {
      this.dialogRef.close({
        ...this.selectedItem,
        quantity: this.quantity,
        lastUpdate: new Date()
      });
    }
  }
}
