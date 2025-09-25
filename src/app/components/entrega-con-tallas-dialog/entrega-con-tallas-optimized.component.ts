import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { User } from '../../interfaces/user.interface';
import { SupplyItem } from '../../interfaces/supply-item.interface';
import { SupplyInventoryService } from '../../services/supply-inventory.service';
import { EntregaDotacionService } from '../../services/entrega-dotacion.service';
import { SignaturePadComponent } from '../signature-pad/signature-pad.component';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

interface ElementoConTallas {
  baseCode: string;
  name: string;
  category: string;
  tallas: TallaInfo[];
}

interface TallaInfo {
  talla: string;
  stock: number;
  code: string;
  isLowStock: boolean;
}

interface ElementoEntrega {
  elementoConTallas: ElementoConTallas;
  tallaSeleccionada?: TallaInfo;
  cantidad: number;
}

@Component({
  selector: 'app-entrega-con-tallas-optimized',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    SignaturePadComponent
  ],
  template: `
    <div class="entrega-dialog-container">
      <h2 mat-dialog-title>
        <mat-icon>assignment</mat-icon>
        Entrega de Dotación - {{ user.nombres }} {{ user.apellidos }}
      </h2>

      <mat-dialog-content>
        <form [formGroup]="entregaForm" class="entrega-form">
          
          <!-- Información del Usuario -->
          <mat-card class="user-info-card" appearance="outlined">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>person</mat-icon>
                Información del Asociado
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="user-details">
                <div class="user-grid">
                  <div><strong>Nombre:</strong> {{ user.nombres }} {{ user.apellidos }}</div>
                  <div><strong>Cédula:</strong> {{ user.cedula }}</div>
                  <div><strong>Área:</strong> {{ user.area }}</div>
                  <div><strong>Cargo:</strong> {{ user.cargo }}</div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Elementos Disponibles con Tallas -->
          <mat-card class="elementos-card" appearance="outlined">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>inventory_2</mat-icon>
                Elementos Disponibles
              </mat-card-title>
            </mat-card-header>

            <mat-card-content>
              <div class="loading-container" *ngIf="cargandoElementos">
                <mat-spinner diameter="40"></mat-spinner>
                <p>Cargando elementos disponibles...</p>
              </div>

              <div class="elementos-disponibles" *ngIf="!cargandoElementos">
                <div *ngFor="let elemento of elementosConTallas" 
                     class="elemento-card"
                     [class.selected]="isElementoSelected(elemento.baseCode)">
                  
                  <div class="elemento-header">
                    <div class="elemento-info">
                      <h4>{{ elemento.name }}</h4>
                      <p class="categoria">{{ elemento.category }}</p>
                      <p class="tipo-dotacion">Elemento de dotación laboral</p>
                    </div>
                    
                    <div class="elemento-actions">
                      <button mat-icon-button 
                              color="primary" 
                              (click)="agregarElemento(elemento)"
                              [disabled]="!hasStockDisponible(elemento)">
                        <mat-icon>add_shopping_cart</mat-icon>
                      </button>
                    </div>
                  </div>

                  <div class="tallas-disponibles">
                    <div class="tallas-grid">
                      <div *ngFor="let talla of elemento.tallas" 
                           class="talla-chip"
                           [class.sin-stock]="talla.stock === 0"
                           [class.stock-bajo]="talla.isLowStock && talla.stock > 0">
                        <span class="talla-numero">{{ talla.talla }}</span>
                        <span class="stock-cantidad">{{ talla.stock }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="no-elementos" *ngIf="elementosConTallas.length === 0">
                  <mat-icon>info</mat-icon>
                  <p>No hay elementos con stock disponible</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Elementos Seleccionados para Entrega -->
          <mat-card class="elementos-seleccionados-card" appearance="outlined" *ngIf="elementosSeleccionados.length > 0">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>shopping_cart</mat-icon>
                Elementos para Entregar ({{ elementosSeleccionados.length }})
              </mat-card-title>
            </mat-card-header>

            <mat-card-content>
              <div formArrayName="elementos" class="elementos-seleccionados">
                <div *ngFor="let elemento of elementosFormArray.controls; let i = index" 
                     [formGroupName]="i" 
                     class="elemento-seleccionado">
                  
                  <div class="elemento-seleccionado-header">
                    <div class="elemento-info">
                      <h4>{{ getElementoNombre(i) }}</h4>
                      <p class="tipo-dotacion">Dotación laboral</p>
                    </div>
                    
                    <button mat-icon-button color="warn" 
                            (click)="removerElemento(i)" 
                            type="button">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>

                  <div class="seleccion-talla-cantidad">
                    <!-- Selector de Talla -->
                    <mat-form-field appearance="outline" class="talla-field">
                      <mat-label>Talla</mat-label>
                      <mat-select formControlName="talla" (selectionChange)="onTallaChange(i)">
                        <mat-option *ngFor="let talla of getTallasDisponibles(i)" 
                                    [value]="talla.talla"
                                    [disabled]="talla.stock === 0">
                          <div class="talla-option">
                            <span>{{ talla.talla }}</span>
                            <span class="stock-info" [class.sin-stock]="talla.stock === 0">
                              ({{ talla.stock }} disponibles)
                            </span>
                          </div>
                        </mat-option>
                      </mat-select>
                    </mat-form-field>

                    <!-- Selector de Cantidad -->
                    <mat-form-field appearance="outline" class="cantidad-field">
                      <mat-label>Cantidad</mat-label>
                      <input matInput 
                             type="number" 
                             formControlName="cantidad" 
                             min="1" 
                             [max]="getMaxCantidad(i)"
                             (input)="onCantidadChange(i)">
                      <mat-hint>Máximo: {{ getMaxCantidad(i) }}</mat-hint>
                    </mat-form-field>
                  </div>

                  <!-- Alertas de Stock -->
                  <div class="stock-alerts">
                    <mat-chip color="warn" *ngIf="getStockInsuficiente(i)">
                      <mat-icon>warning</mat-icon>
                      Stock insuficiente
                    </mat-chip>
                    
                    <mat-chip color="accent" *ngIf="getStockBajo(i) && !getStockInsuficiente(i)">
                      <mat-icon>info</mat-icon>
                      Stock bajo
                    </mat-chip>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Resumen de la Entrega -->
          <mat-card class="resumen-card" appearance="outlined" *ngIf="elementosSeleccionados.length > 0">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>receipt</mat-icon>
                Resumen de Entrega
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="resumen-grid">
                <div>Total elementos: {{ elementosSeleccionados.length }}</div>
                <div>Total unidades: {{ getTotalUnidades() }}</div>
                <div>Tipo: Entrega de dotación laboral</div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Observaciones -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Observaciones</mat-label>
            <textarea matInput formControlName="observaciones" rows="3" 
                      placeholder="Observaciones adicionales (opcional)"></textarea>
          </mat-form-field>

          <!-- Firma -->
          <mat-card class="firma-card" appearance="outlined">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>draw</mat-icon>
                Firma del Asociado
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <app-signature-pad 
                (signatureChange)="onSignatureChange($event)">
              </app-signature-pad>
            </mat-card-content>
          </mat-card>

        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()" class="cancel-button">
          <mat-icon>cancel</mat-icon>
          Cancelar
        </button>
        
        <button mat-raised-button color="primary" 
                (click)="onSave()" 
                [disabled]="!isFormValid() || saving"
                class="save-button">
          <mat-icon>{{ saving ? 'hourglass_empty' : 'save' }}</mat-icon>
          {{ saving ? 'Procesando...' : 'Entregar Dotación' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .entrega-dialog-container {
      min-width: 900px;
      max-width: 1200px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .entrega-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .user-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .elementos-disponibles {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
    }

    .elemento-card {
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      padding: 16px;
      background: #fafafa;
      transition: all 0.3s ease;
    }

    .elemento-card:hover {
      border-color: #2196f3;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    .elemento-card.selected {
      border-color: #4caf50;
      background: #f1f8e9;
    }

    .elemento-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .elemento-info h4 {
      margin: 0 0 4px 0;
      color: #333;
    }

    .categoria {
      margin: 0 0 4px 0;
      color: #666;
      font-size: 0.9em;
      text-transform: capitalize;
    }

    .tipo-dotacion {
      margin: 0;
      font-weight: bold;
      color: #4caf50;
      font-size: 0.85em;
    }

    .tallas-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
      gap: 8px;
    }

    .talla-chip {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px 4px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: #fff;
      font-size: 0.85em;
    }

    .talla-chip.sin-stock {
      background: #ffebee;
      border-color: #f44336;
      color: #c62828;
    }

    .talla-chip.stock-bajo {
      background: #fff3e0;
      border-color: #ff9800;
      color: #e65100;
    }

    .talla-numero {
      font-weight: bold;
      font-size: 1.1em;
    }

    .stock-cantidad {
      font-size: 0.8em;
      margin-top: 2px;
    }

    .elementos-seleccionados {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .elemento-seleccionado {
      border: 2px solid #4caf50;
      border-radius: 12px;
      padding: 16px;
      background: #f1f8e9;
    }

    .elemento-seleccionado-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .seleccion-talla-cantidad {
      display: grid;
      grid-template-columns: 1fr 120px;
      gap: 16px;
      margin-bottom: 12px;
    }

    .talla-option {
      display: flex;
      justify-content: space-between;
      width: 100%;
    }

    .stock-info.sin-stock {
      color: #f44336;
    }

    .stock-alerts {
      display: flex;
      gap: 8px;
    }

    .resumen-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      font-weight: bold;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
    }

    .loading-container p {
      margin-top: 16px;
      color: #666;
    }

    .no-elementos {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
      color: #666;
    }

    .no-elementos mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }

    .full-width {
      width: 100%;
    }

    .mat-dialog-actions {
      padding: 20px 0;
      gap: 12px;
    }

    .cancel-button, .save-button {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    @media (max-width: 768px) {
      .entrega-dialog-container {
        min-width: 500px;
      }
      
      .elementos-disponibles {
        grid-template-columns: 1fr;
      }
      
      .user-grid {
        grid-template-columns: 1fr;
      }
      
      .seleccion-talla-cantidad {
        grid-template-columns: 1fr;
      }
      
      .resumen-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class EntregaConTallasOptimizedComponent implements OnInit, OnDestroy {
  entregaForm: FormGroup;
  elementosConTallas: ElementoConTallas[] = [];
  elementosSeleccionados: ElementoEntrega[] = [];
  cargandoElementos = true;
  saving = false;
  signature: string | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private supplyInventoryService: SupplyInventoryService,
    private entregaDotacionService: EntregaDotacionService,
    private dialogRef: MatDialogRef<EntregaConTallasOptimizedComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public user: User
  ) {
    this.entregaForm = this.fb.group({
      elementos: this.fb.array([]),
      observaciones: [''],
      firma: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadElementosConTallas();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get elementosFormArray() {
    return this.entregaForm.get('elementos') as FormArray;
  }

  async loadElementosConTallas() {
    try {
      this.cargandoElementos = true;
      
      // Obtener todos los elementos
      this.supplyInventoryService.getAllSupplies()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (supplies) => {
            this.processSuppliesIntoElementosConTallas(supplies);
            this.cargandoElementos = false;
          },
          error: (error) => {
            console.error('Error cargando elementos:', error);
            this.snackBar.open('Error cargando elementos disponibles', 'Cerrar', { duration: 5000 });
            this.cargandoElementos = false;
          }
        });
        
    } catch (error) {
      console.error('Error en loadElementosConTallas:', error);
      this.cargandoElementos = false;
    }
  }

  private processSuppliesIntoElementosConTallas(supplies: SupplyItem[]) {
    // Filtrar solo elementos con tallas y stock > 0
    const elementosConTalla = supplies.filter(item => 
      item.talla && item.quantity > 0
    );
    
    // Agrupar por elemento base
    const elementosMap = new Map<string, ElementoConTallas>();
    
    for (const item of elementosConTalla) {
      const baseCode = item.code.split('-')[0];
      const key = `${baseCode}-${item.category}`;
      
      if (!elementosMap.has(key)) {
        elementosMap.set(key, {
          baseCode,
          name: item.name,
          category: item.category,
          tallas: []
        });
      }
      
      const elemento = elementosMap.get(key)!;
      elemento.tallas.push({
        talla: item.talla!,
        stock: item.quantity,
        code: item.code,
        isLowStock: item.quantity <= (item.minimum_quantity || 10)
      });
    }
    
    // Convertir a array y ordenar tallas
    this.elementosConTallas = Array.from(elementosMap.values()).map(elemento => ({
      ...elemento,
      tallas: elemento.tallas.sort((a, b) => {
        // Ordenar numéricamente si son números, alfabéticamente si no
        if (!isNaN(Number(a.talla)) && !isNaN(Number(b.talla))) {
          return Number(a.talla) - Number(b.talla);
        }
        return a.talla.localeCompare(b.talla);
      })
    }));
    
    console.log('Elementos con tallas procesados:', this.elementosConTallas);
  }

  hasStockDisponible(elemento: ElementoConTallas): boolean {
    return elemento.tallas.some(talla => talla.stock > 0);
  }

  isElementoSelected(baseCode: string): boolean {
    return this.elementosSeleccionados.some(sel => sel.elementoConTallas.baseCode === baseCode);
  }

  agregarElemento(elemento: ElementoConTallas) {
    if (!this.hasStockDisponible(elemento) || this.isElementoSelected(elemento.baseCode)) {
      return;
    }
    
    const elementoEntrega: ElementoEntrega = {
      elementoConTallas: elemento,
      cantidad: 1
    };
    
    this.elementosSeleccionados.push(elementoEntrega);
    
    // Agregar al FormArray
    const elementoGroup = this.fb.group({
      baseCode: [elemento.baseCode, Validators.required],
      talla: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]]
    });
    
    this.elementosFormArray.push(elementoGroup);
    
    this.snackBar.open(`${elemento.name} agregado`, 'Cerrar', { duration: 2000 });
  }

  removerElemento(index: number) {
    if (index >= 0 && index < this.elementosSeleccionados.length) {
      const elemento = this.elementosSeleccionados[index];
      this.elementosSeleccionados.splice(index, 1);
      this.elementosFormArray.removeAt(index);
      
      this.snackBar.open(`${elemento.elementoConTallas.name} removido`, 'Cerrar', { duration: 2000 });
    }
  }

  getTallasDisponibles(index: number): TallaInfo[] {
    if (index < 0 || index >= this.elementosSeleccionados.length) {
      return [];
    }
    
    return this.elementosSeleccionados[index].elementoConTallas.tallas
      .filter(talla => talla.stock > 0)
      .sort((a, b) => b.stock - a.stock); // Ordenar por stock descendente
  }

  onTallaChange(index: number) {
    const elementoGroup = this.elementosFormArray.at(index);
    const tallaSeleccionada = elementoGroup.get('talla')?.value;
    const cantidadControl = elementoGroup.get('cantidad');
    
    if (tallaSeleccionada && this.elementosSeleccionados[index]) {
      const talla = this.elementosSeleccionados[index].elementoConTallas.tallas
        .find(t => t.talla === tallaSeleccionada);
      
      if (talla) {
        this.elementosSeleccionados[index].tallaSeleccionada = talla;
        
        // Ajustar cantidad máxima
        const cantidadActual = cantidadControl?.value || 1;
        if (cantidadActual > talla.stock) {
          cantidadControl?.setValue(talla.stock);
        }
        
        cantidadControl?.setValidators([
          Validators.required,
          Validators.min(1),
          Validators.max(talla.stock)
        ]);
        cantidadControl?.updateValueAndValidity();
      }
    }
  }

  onCantidadChange(index: number) {
    const elementoGroup = this.elementosFormArray.at(index);
    const cantidad = elementoGroup.get('cantidad')?.value;
    
    if (this.elementosSeleccionados[index]) {
      this.elementosSeleccionados[index].cantidad = cantidad;
    }
  }

  getMaxCantidad(index: number): number {
    if (index >= 0 && index < this.elementosSeleccionados.length) {
      const talla = this.elementosSeleccionados[index].tallaSeleccionada;
      return talla ? talla.stock : 0;
    }
    return 0;
  }

  getElementoNombre(index: number): string {
    if (index >= 0 && index < this.elementosSeleccionados.length) {
      return this.elementosSeleccionados[index].elementoConTallas.name;
    }
    return '';
  }

  getStockInsuficiente(index: number): boolean {
    if (index >= 0 && index < this.elementosSeleccionados.length) {
      const elemento = this.elementosSeleccionados[index];
      const elementoGroup = this.elementosFormArray.at(index);
      const cantidad = elementoGroup.get('cantidad')?.value || 0;
      
      return elemento.tallaSeleccionada ? cantidad > elemento.tallaSeleccionada.stock : false;
    }
    return false;
  }

  getStockBajo(index: number): boolean {
    if (index >= 0 && index < this.elementosSeleccionados.length) {
      const talla = this.elementosSeleccionados[index].tallaSeleccionada;
      return talla ? talla.isLowStock : false;
    }
    return false;
  }

  getTotalUnidades(): number {
    return this.elementosSeleccionados.reduce((total, elemento) => total + elemento.cantidad, 0);
  }

  getTotalDotaciones(): number {
    // Para sistema de dotación, contamos total de elementos entregados
    return this.elementosSeleccionados.reduce((total, elemento) => 
      total + elemento.cantidad, 0);
  }

  onSignatureChange(signatureUrl: string | null): void {
    this.signature = signatureUrl;
    this.entregaForm.get('firma')?.setValue(signatureUrl);
  }

  isFormValid(): boolean {
    const formValid = this.entregaForm.valid;
    const hasElements = this.elementosSeleccionados.length > 0;
    const hasSignature = !!this.signature;
    const noStockIssues = !this.elementosSeleccionados.some((_, index) => this.getStockInsuficiente(index));
    
    return formValid && hasElements && hasSignature && noStockIssues;
  }

  async onSave() {
    if (this.isFormValid()) {
      this.saving = true;
      
      try {
        const elementos = this.elementosSeleccionados.map(elemento => ({
          categoria: elemento.elementoConTallas.name,
          categoriaOriginal: elemento.elementoConTallas.category,
          talla: elemento.tallaSeleccionada?.talla || null,
          cantidad: elemento.cantidad
        }));
        
        const entregaData = {
          userId: this.user.id,
          elementos,
          observaciones: this.entregaForm.get('observaciones')?.value || '',
          firma_url: this.signature
        };
        
        console.log('Datos de entrega optimizados:', entregaData);
        
        this.dialogRef.close(entregaData);
        
      } catch (error) {
        console.error('Error procesando entrega:', error);
        this.snackBar.open('Error procesando la entrega. Intenta de nuevo.', 'Cerrar', { duration: 5000 });
        this.saving = false;
      }
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}