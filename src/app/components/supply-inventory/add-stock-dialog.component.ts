import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { SupplyItem } from '../../interfaces/supply-item.interface';
import { requiereTalla, getTallasDisponibles } from '../../config/tallas.config';

export interface AddStockDialogData {
  supply: SupplyItem;
}

export interface AddStockResult {
  quantity: number;
  reason: string;
  notes?: string;
  talla?: string;
  genero?: 'M' | 'F';
}

@Component({
  selector: 'app-add-stock-dialog',
  template: `
    <h2 mat-dialog-title>
      <mat-icon>add_box</mat-icon>
      Agregar Stock
    </h2>
    
    <mat-dialog-content class="dialog-content">
      <div class="supply-info">
        <h3>{{data.supply.name | uppercase}}</h3>
        <p><strong>Código:</strong> {{data.supply.code}}</p>
        <p><strong>Stock actual:</strong> 
          <span class="current-stock">{{data.supply.quantity}} unidades</span>
        </p>
        <p><strong>Stock mínimo:</strong> {{data.supply.minimum_quantity}} unidades</p>
      </div>

      <form [formGroup]="addStockForm" class="add-stock-form">
        <mat-form-field appearance="outline">
          <mat-label>Cantidad a agregar</mat-label>
          <input matInput 
                 type="number" 
                 formControlName="quantity"
                 min="1"
                 placeholder="Ingrese cantidad">
          <mat-icon matSuffix>add</mat-icon>
          <mat-error *ngIf="addStockForm.get('quantity')?.hasError('required')">
            La cantidad es requerida
          </mat-error>
          <mat-error *ngIf="addStockForm.get('quantity')?.hasError('min')">
            La cantidad debe ser mayor a 0
          </mat-error>
        </mat-form-field>

        <!-- Campo de talla (solo se muestra para elementos que requieren talla) -->
        <mat-form-field appearance="outline" *ngIf="requiereSeleccionTalla()">
          <mat-label>Talla</mat-label>
          <mat-select formControlName="talla">
            <mat-option *ngFor="let talla of getTallasDisponiblesParaElemento()" [value]="talla">
              {{talla}}
            </mat-option>
          </mat-select>
          <mat-icon matSuffix>straighten</mat-icon>
          <mat-error *ngIf="addStockForm.get('talla')?.hasError('required')">
            La talla es requerida para este elemento
          </mat-error>
        </mat-form-field>

        <!-- Campo de género (solo para botas) -->
        <mat-form-field appearance="outline" *ngIf="requiereGenero()">
          <mat-label>Género</mat-label>
          <mat-select formControlName="genero">
            <mat-option value="F">👩 Mujer</mat-option>
            <mat-option value="M">👨 Hombre</mat-option>
          </mat-select>
          <mat-icon matSuffix>wc</mat-icon>
          <mat-error *ngIf="addStockForm.get('genero')?.hasError('required')">
            El género es requerido
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Motivo de entrada</mat-label>
          <mat-select formControlName="reason">
            <mat-option value="compra">Compra</mat-option>
            <mat-option value="donacion">Donación</mat-option>
            <mat-option value="devolucion">Devolución</mat-option>
            <mat-option value="ajuste_inventario">Ajuste de inventario</mat-option>
            <mat-option value="transferencia">Transferencia</mat-option>
            <mat-option value="otro">Otro</mat-option>
          </mat-select>
          <mat-error *ngIf="addStockForm.get('reason')?.hasError('required')">
            El motivo es requerido
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Observaciones (opcional)</mat-label>
          <textarea matInput 
                    formControlName="notes"
                    rows="3"
                    placeholder="Detalles adicionales, número de factura, proveedor, etc.">
          </textarea>
        </mat-form-field>

        <div class="summary-card" *ngIf="addStockForm.valid">
          <h4>Resumen del movimiento:</h4>
          <p><strong>Stock actual:</strong> {{data.supply.quantity}} unidades</p>
          <p><strong>Cantidad a agregar:</strong> +{{addStockForm.get('quantity')?.value}} unidades</p>
          <p *ngIf="requiereSeleccionTalla()"><strong>Talla:</strong> {{addStockForm.get('talla')?.value}}</p>
          <p *ngIf="requiereGenero()"><strong>Género:</strong> {{addStockForm.get('genero')?.value === 'F' ? 'Mujer' : 'Hombre'}}</p>
          <p><strong>Stock resultante:</strong> 
            <span class="new-stock">{{data.supply.quantity + addStockForm.get('quantity')?.value}} unidades</span>
          </p>
          <p><strong>Motivo:</strong> {{getReasonText(addStockForm.get('reason')?.value)}}</p>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button 
              color="primary" 
              (click)="onConfirm()" 
              [disabled]="!addStockForm.valid">
        <mat-icon>check</mat-icon>
        Confirmar Entrada
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content {
      min-width: 400px;
      max-width: 500px;
    }

    .supply-info {
      background-color: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .supply-info h3 {
      margin: 0 0 12px 0;
      color: #1976d2;
    }

    .supply-info p {
      margin: 4px 0;
      font-size: 14px;
    }

    .current-stock {
      color: #2e7d32;
      font-weight: 500;
    }

    .add-stock-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .summary-card {
      background-color: #e3f2fd;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #1976d2;
    }

    .summary-card h4 {
      margin: 0 0 12px 0;
      color: #1976d2;
    }

    .summary-card p {
      margin: 6px 0;
      font-size: 14px;
    }

    .new-stock {
      color: #2e7d32;
      font-weight: 600;
      font-size: 16px;
    }

    mat-dialog-actions button {
      margin-left: 8px;
    }

    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 0;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule
  ]
})
export class AddStockDialogComponent {
  addStockForm: FormGroup;
  
  // Cache para evitar recalcular en cada ciclo de detección de cambios
  readonly requiereTalla: boolean;
  readonly requiereGeneroSeleccion: boolean;
  readonly tallasDisponibles: string[];

  private reasonTexts: Record<string, string> = {
    'compra': 'Compra',
    'donacion': 'Donación',
    'devolucion': 'Devolución',
    'ajuste_inventario': 'Ajuste de inventario',
    'transferencia': 'Transferencia',
    'otro': 'Otro'
  };

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddStockDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddStockDialogData
  ) {
    // Calcular SOLO UNA VEZ en el constructor
    this.requiereTalla = this.calcularRequiereTalla();
    this.requiereGeneroSeleccion = this.calcularRequiereGenero();
    this.tallasDisponibles = this.calcularTallasDisponibles();
    
    console.log('AddStockDialog - Datos del elemento:', {
      name: this.data.supply.name,
      category: this.data.supply.category,
      requiereTalla: this.requiereTalla,
      tallasDisponibles: this.tallasDisponibles
    });

    this.addStockForm = this.fb.group({
      quantity: [1, [Validators.required, Validators.min(1)]],
      reason: ['', Validators.required],
      notes: [''],
      talla: [''],
      genero: ['']
    });

    // Si el elemento requiere talla, hacer el campo obligatorio
    if (this.requiereTalla) {
      console.log('Elemento requiere talla, haciendo campo obligatorio');
      this.addStockForm.get('talla')?.setValidators([Validators.required]);
      this.addStockForm.get('talla')?.updateValueAndValidity();
    }

    // Si es calzado, hacer el género obligatorio
    if (this.requiereGeneroSeleccion) {
      console.log('Elemento requiere género, haciendo campo obligatorio');
      this.addStockForm.get('genero')?.setValidators([Validators.required]);
      this.addStockForm.get('genero')?.updateValueAndValidity();
    }
  }

  private calcularRequiereTalla(): boolean {
    const porCategoria = requiereTalla(this.data.supply.category);
    const porNombre = requiereTalla(this.data.supply.name);
    return porCategoria || porNombre;
  }

  private calcularRequiereGenero(): boolean {
    const nombreLower = this.data.supply.name.toLowerCase();
    return nombreLower.includes('pantalón') || 
           nombreLower.includes('pantalon') ||
           nombreLower.includes('camisa') ||
           this.esCalzado();
  }

  private calcularTallasDisponibles(): string[] {
    const detectarTipoTalla = (nombre: string) => {
      const nombreLower = nombre.toLowerCase();
      if (nombreLower.includes('pantalon') || nombreLower.includes('pantalón')) return 'pantalon';
      if (nombreLower.includes('camisa')) return 'camisa';
      if (nombreLower.includes('chaqueta')) return 'chaqueta';
      if (nombreLower.includes('overol')) return 'overol';
      if (nombreLower.includes('bota') || nombreLower.includes('zapato') || nombreLower.includes('calzado')) return 'botas';
      return null;
    };

    const tipo = detectarTipoTalla(this.data.supply.name);
    if (tipo) {
      const tallas = getTallasDisponibles(tipo);
      console.log(`Tallas para "${this.data.supply.name}" (Cat: "${this.data.supply.category}"):`, tallas);
      return tallas;
    }
    
    return [];
  }

  esCalzado(): boolean {
    const nombreLower = this.data.supply.name.toLowerCase();
    const categoria = this.data.supply.category.toLowerCase();
    return categoria === 'calzado' || 
           nombreLower.includes('bota') || 
           nombreLower.includes('zapato');
  }

  // Métodos deprecados - ahora usamos las propiedades readonly calculadas una sola vez
  // Mantenidos para compatibilidad con código existente
  requiereGenero(): boolean {
    return this.requiereGeneroSeleccion;
  }

  requiereSeleccionTalla(): boolean {
    return this.requiereTalla;
  }

  getTallasDisponiblesParaElemento(): string[] {
    return this.tallasDisponibles;
  }

  getReasonText(reason: string): string {
    return this.reasonTexts[reason] || reason;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (this.addStockForm.valid) {
      const result: AddStockResult = this.addStockForm.value;
      this.dialogRef.close(result);
    }
  }
}
