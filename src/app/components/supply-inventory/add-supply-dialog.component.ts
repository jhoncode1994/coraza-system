import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { SupplyItem } from '../../interfaces/supply-item.interface';
import { SupplyInventoryService } from '../../services/supply-inventory.service';

@Component({
  selector: 'app-add-supply',
  template: `
    <h2 mat-dialog-title>Agregar Cantidad al Inventario</h2>
    <mat-dialog-content>
      <div class="add-supply-form">
        <mat-form-field>
          <mat-label>Elemento</mat-label>
          <mat-select [(ngModel)]="selectedItem">
            <mat-option *ngFor="let item of supplyItems" [value]="item">
              {{item.name | uppercase}} ({{item.code}}) - Stock actual: {{item.quantity}}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Cantidad a agregar</mat-label>
          <input matInput type="number" [(ngModel)]="quantity" min="1">
        </mat-form-field>

        <div *ngIf="selectedItem" class="item-info">
          <p><strong>Elemento seleccionado:</strong> {{selectedItem.name | uppercase}}</p>
          <p><strong>Stock actual:</strong> {{selectedItem.quantity}}</p>
          <p><strong>Stock después:</strong> {{selectedItem.quantity + (quantity || 0)}}</p>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" 
              (click)="onAdd()" 
              [disabled]="!selectedItem || !quantity || quantity < 1">
        Agregar Cantidad
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .add-supply-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 400px;
    }
    .item-info {
      background-color: #f5f5f5;
      padding: 16px;
      border-radius: 4px;
      border-left: 4px solid #2196f3;
    }
    .item-info p {
      margin: 4px 0;
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
export class AddSupplyDialogComponent implements OnInit {
  supplyItems: SupplyItem[] = [];
  selectedItem: SupplyItem | null = null;
  quantity: number = 1;

  constructor(
    private dialogRef: MatDialogRef<AddSupplyDialogComponent>,
    private supplyService: SupplyInventoryService
  ) {}

  ngOnInit(): void {
    // Load real supply items from the database
    this.supplyService.getAllSupplies().subscribe({
      next: (items) => {
        this.supplyItems = items;
      },
      error: (error) => {
        console.error('Error loading supply items:', error);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onAdd(): void {
    if (this.selectedItem && this.quantity > 0) {
      this.dialogRef.close({
        elementId: this.selectedItem.id,
        quantityToAdd: this.quantity,
        selectedItem: this.selectedItem
      });
    }
  }
}
