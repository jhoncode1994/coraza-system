import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { User } from './users.component';
import { SupplyInventoryService } from '../../services/supply-inventory.service';
import { SupplyItem } from '../../interfaces/supply-item.interface';

export interface EntregaDotacionItem {
  elemento: string;
  cantidad: number;
  stockDisponible: number;
}

export interface EntregaDotacion {
  elementos: EntregaDotacionItem[];
  fechaEntrega: Date;
  observaciones?: string;
}

@Component({
  selector: 'app-entrega-dotacion-dialog',
  template: `
    <h2 mat-dialog-title>Entregar Dotación Múltiple</h2>
    <mat-dialog-content>
      <div class="user-info">
        <h3>Usuario: {{data.user.nombre}} {{data.user.apellido}}</h3>
        <p>Cédula: {{data.user.cedula}} | Zona: {{data.user.zona}}</p>
      </div>

      <!-- Formulario para agregar elementos -->
      <div class="add-element-section">
        <h4>Agregar Elementos a la Entrega:</h4>
        <form [formGroup]="elementForm" class="element-form">
          <div class="form-row">
            <mat-form-field>
              <mat-label>Elemento de dotación</mat-label>
              <mat-select formControlName="elemento" (selectionChange)="onElementSelected($event.value)">
                <mat-option *ngFor="let item of getAvailableItems()" [value]="item.name">
                  {{item.name}} - Disponible: {{item.quantity}}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Cantidad</mat-label>
              <input matInput type="number" formControlName="cantidad" 
                     [min]="1" 
                     [max]="selectedItemStock">
              <mat-hint *ngIf="selectedItemStock > 0">Máximo: {{selectedItemStock}}</mat-hint>
            </mat-form-field>

            <button mat-raised-button color="primary" 
                    (click)="addElement()" 
                    [disabled]="!canAddElement()"
                    class="add-btn">
              <mat-icon>add</mat-icon>
              Agregar
            </button>
          </div>
        </form>
      </div>

      <mat-divider></mat-divider>

      <!-- Lista de elementos seleccionados -->
      <div class="selected-elements" *ngIf="selectedElements.length > 0">
        <h4>Elementos para entregar:</h4>
        <mat-list>
          <mat-list-item *ngFor="let elemento of selectedElements; let i = index">
            <div class="element-item">
              <div class="element-info">
                <span class="element-name">{{elemento.elemento}}</span>
                <span class="element-quantity">Cantidad: {{elemento.cantidad}}</span>
              </div>
              <button mat-icon-button color="warn" (click)="removeElement(i)" matTooltip="Eliminar">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </mat-list-item>
        </mat-list>
      </div>

      <!-- Formulario de fecha y observaciones -->
      <div class="delivery-info" *ngIf="selectedElements.length > 0">
        <mat-divider></mat-divider>
        <h4>Información de la entrega:</h4>
        <form [formGroup]="deliveryForm" class="delivery-form">
          <mat-form-field>
            <mat-label>Fecha de entrega</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="fechaEntrega" required>
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>

          <mat-form-field>
            <mat-label>Observaciones (opcional)</mat-label>
            <textarea matInput formControlName="observaciones" rows="3" 
                      placeholder="Notas adicionales sobre la entrega"></textarea>
          </mat-form-field>
        </form>
      </div>

      <!-- Mensaje cuando no hay elementos -->
      <div class="no-elements" *ngIf="selectedElements.length === 0">
        <p>No hay elementos agregados para la entrega.</p>
        <p>Selecciona elementos de dotación usando el formulario de arriba.</p>
      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" 
              (click)="onSubmit()" 
              [disabled]="!canSubmit()">
        <mat-icon>local_shipping</mat-icon>
        Entregar {{selectedElements.length}} elemento(s)
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
    
    .add-element-section {
      margin-bottom: 20px;
    }
    
    .add-element-section h4 {
      color: #1976d2;
      margin-bottom: 16px;
    }
    
    .form-row {
      display: flex;
      gap: 16px;
      align-items: flex-end;
    }
    
    .form-row mat-form-field {
      flex: 1;
    }
    
    .add-btn {
      margin-bottom: 1.34375em;
    }
    
    .selected-elements h4 {
      color: #1976d2;
      margin: 16px 0;
    }
    
    .element-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding: 8px 0;
    }
    
    .element-info {
      display: flex;
      flex-direction: column;
    }
    
    .element-name {
      font-weight: 500;
      font-size: 16px;
    }
    
    .element-quantity {
      color: #666;
      font-size: 14px;
    }
    
    .delivery-info {
      margin-top: 20px;
    }
    
    .delivery-info h4 {
      color: #1976d2;
      margin: 16px 0;
    }
    
    .delivery-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .no-elements {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }
    
    mat-dialog-content {
      max-height: 70vh;
      overflow-y: auto;
      min-width: 500px;
    }
    
    mat-divider {
      margin: 20px 0;
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
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatChipsModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class EntregaDotacionDialogComponent implements OnInit {
  elementForm: FormGroup;
  deliveryForm: FormGroup;
  availableItems: SupplyItem[] = [];
  selectedElements: EntregaDotacionItem[] = [];
  selectedItemStock: number = 0;
  
  elementosDotacion = [
    { name: 'camisa', code: 'CAM' },
    { name: 'corbata', code: 'COR' },
    { name: 'apellido', code: 'APE' },
    { name: 'pantalon', code: 'PAN' },
    { name: 'cinturon', code: 'CIN' },
    { name: 'kepis', code: 'KEP' },
    { name: 'botas', code: 'BOT' },
    { name: 'overol', code: 'OVE' },
    { name: 'reata', code: 'REA' },
    { name: 'goleana', code: 'GOL' },
    { name: 'moña', code: 'MOÑ' }
  ];

  constructor(
    private fb: FormBuilder,
    private supplyInventoryService: SupplyInventoryService,
    public dialogRef: MatDialogRef<EntregaDotacionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: User }
  ) {
    this.elementForm = this.fb.group({
      elemento: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]]
    });

    this.deliveryForm = this.fb.group({
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

  getAvailableItems(): SupplyItem[] {
    // Filtrar elementos que ya están seleccionados
    const selectedElementNames = this.selectedElements.map(el => el.elemento);
    return this.availableItems.filter(item => 
      !selectedElementNames.includes(item.name) && item.quantity > 0
    );
  }

  onElementSelected(elementName: string): void {
    const selectedItem = this.availableItems.find(item => item.name === elementName);
    if (selectedItem) {
      this.selectedItemStock = selectedItem.quantity;
      // Actualizar la validación de cantidad máxima
      const cantidadControl = this.elementForm.get('cantidad');
      if (cantidadControl) {
        cantidadControl.setValidators([
          Validators.required,
          Validators.min(1),
          Validators.max(this.selectedItemStock)
        ]);
        cantidadControl.updateValueAndValidity();
        
        // Resetear la cantidad a 1
        cantidadControl.setValue(1);
      }
    } else {
      this.selectedItemStock = 0;
    }
  }

  canAddElement(): boolean {
    return this.elementForm.valid && 
           this.selectedItemStock > 0 && 
           this.elementForm.get('cantidad')?.value <= this.selectedItemStock;
  }

  addElement(): void {
    if (this.canAddElement()) {
      const elemento = this.elementForm.get('elemento')?.value;
      const cantidad = this.elementForm.get('cantidad')?.value;
      const selectedItem = this.availableItems.find(item => item.name === elemento);
      
      if (selectedItem) {
        this.selectedElements.push({
          elemento: elemento,
          cantidad: cantidad,
          stockDisponible: selectedItem.quantity
        });

        // Resetear el formulario de elemento
        this.elementForm.reset();
        this.selectedItemStock = 0;
      }
    }
  }

  removeElement(index: number): void {
    this.selectedElements.splice(index, 1);
  }

  canSubmit(): boolean {
    return this.selectedElements.length > 0 && this.deliveryForm.valid;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.canSubmit()) {
      const entrega: EntregaDotacion = {
        elementos: this.selectedElements,
        fechaEntrega: this.deliveryForm.get('fechaEntrega')?.value,
        observaciones: this.deliveryForm.get('observaciones')?.value || ''
      };
      this.dialogRef.close(entrega);
    }
  }
}
