import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { User } from './users.component';
import { SupplyInventoryService } from '../../services/supply-inventory.service';
import { SupplyItem } from '../../interfaces/supply-item.interface';

export interface EntregaDotacion {
  elemento: string;
  cantidad: number;
  fechaEntrega: Date;
  observaciones?: string;
}

@Component({
  selector: 'app-entrega-dotacion-dialog',
  template: `
    <h2 mat-dialog-title>Entregar Dotación</h2>
    <mat-dialog-content>
      <div class="user-info">
        <h3>Usuario: {{data.user.nombre}} {{data.user.apellido}}</h3>
        <p>Cédula: {{data.user.cedula}} | Zona: {{data.user.zona}}</p>
      </div>

      <form [formGroup]="entregaForm" class="entrega-form">
        <mat-form-field>
          <mat-label>Elemento de dotación</mat-label>
          <mat-select formControlName="elemento" required (selectionChange)="onElementSelected($event.value)">
            <mat-option *ngFor="let item of availableItems" [value]="item.name">
              {{item.name}} ({{item.code}}) - Disponible: {{item.quantity}}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Cantidad</mat-label>
          <input matInput type="number" formControlName="cantidad" 
                 [min]="1" 
                 [max]="selectedItemStock" 
                 required>
          <mat-hint *ngIf="selectedItemStock > 0">Máximo disponible: {{selectedItemStock}}</mat-hint>
          <mat-hint *ngIf="selectedItemStock === 0" style="color: red;">Sin stock disponible</mat-hint>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Fecha de entrega</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="fechaEntrega" required>
          <mat-hint>DD/MM/YYYY</mat-hint>
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Observaciones (opcional)</mat-label>
          <textarea matInput formControlName="observaciones" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" 
              (click)="onSubmit()" 
              [disabled]="!entregaForm.valid">
        Entregar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .user-info {
      background-color: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .user-info h3 {
      margin: 0 0 8px 0;
      color: #3f51b5;
    }
    .user-info p {
      margin: 0;
      color: #666;
    }
    .entrega-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 400px;
    }
    mat-dialog-content {
      max-height: 60vh;
      overflow-y: auto;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class EntregaDotacionDialogComponent implements OnInit {
  entregaForm: FormGroup;
  availableItems: SupplyItem[] = [];
  selectedItemStock: number = 0;
  
  elementosDotacion = [
    { name: 'camisa', code: 'CAM' },
    { name: 'corbata', code: 'COR' },
    { name: 'apellido', code: 'APE' },
    { name: 'pantalon', code: 'PAN' },
    { name: 'cinturon', code: 'CIN' },
    { name: 'kepis', code: 'KEP' },
    { name: 'moña', code: 'MOÑ' },
    { name: 'botas', code: 'BOT' },
    { name: 'reata', code: 'REA' },
    { name: 'goleana', code: 'GOL' }
  ];

  constructor(
    private fb: FormBuilder,
    private supplyInventoryService: SupplyInventoryService,
    public dialogRef: MatDialogRef<EntregaDotacionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: User }
  ) {
    this.entregaForm = this.fb.group({
      elemento: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      fechaEntrega: [new Date(), Validators.required],
      observaciones: ['']
    });
  }

  ngOnInit(): void {
    this.loadAvailableItems();
  }

  loadAvailableItems(): void {
    this.supplyInventoryService.getAllSupplies().subscribe(supplies => {
      this.availableItems = supplies;
    });
  }

  onElementSelected(elementName: string): void {
    const selectedItem = this.availableItems.find(item => item.name === elementName);
    if (selectedItem) {
      this.selectedItemStock = selectedItem.quantity;
      // Actualizar la validación de cantidad máxima
      const cantidadControl = this.entregaForm.get('cantidad');
      if (cantidadControl) {
        cantidadControl.setValidators([
          Validators.required,
          Validators.min(1),
          Validators.max(this.selectedItemStock)
        ]);
        cantidadControl.updateValueAndValidity();
        
        // Si la cantidad actual es mayor al stock disponible, ajustarla
        if (cantidadControl.value > this.selectedItemStock) {
          cantidadControl.setValue(this.selectedItemStock > 0 ? this.selectedItemStock : 0);
        }
      }
    } else {
      this.selectedItemStock = 0;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.entregaForm.valid && this.selectedItemStock > 0) {
      const entrega: EntregaDotacion = this.entregaForm.value;
      this.dialogRef.close(entrega);
    }
  }
}
