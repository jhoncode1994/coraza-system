import { Component, Inject, OnInit } from '@angular/core';
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
import { User } from '../../interfaces/user.interface';
import { SupplyItem } from '../../interfaces/supply-item.interface';
import { SupplyInventoryService } from '../../services/supply-inventory.service';
import { EntregaDotacionService } from '../../services/entrega-dotacion.service';
import { requiereTalla, getTallasDisponibles, getDisplayName } from '../../config/tallas.config';
import { SignaturePadComponent } from '../signature-pad/signature-pad.component';

interface ElementoEntrega {
  categoria: string;
  talla?: string;
  cantidad: number;
  stockDisponible?: number;
  elementoCompleto?: SupplyItem;
}

@Component({
  selector: 'app-entrega-con-tallas-dialog',
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
                <p><strong>Nombre:</strong> {{ user.nombres }} {{ user.apellidos }}</p>
                <p><strong>Cédula:</strong> {{ user.cedula }}</p>
                <p><strong>Área:</strong> {{ user.area }} | <strong>Cargo:</strong> {{ user.cargo }}</p>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Elementos a Entregar -->
          <mat-card class="elementos-card" appearance="outlined">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>inventory_2</mat-icon>
                Elementos a Entregar
                <button mat-icon-button color="primary" (click)="agregarElemento()" type="button">
                  <mat-icon>add_circle</mat-icon>
                </button>
              </mat-card-title>
            </mat-card-header>

            <mat-card-content>
              <div formArrayName="elementos" class="elementos-list">
                <div *ngFor="let elemento of elementosFormArray.controls; let i = index" 
                     [formGroupName]="i" 
                     class="elemento-item">
                  
                  <div class="elemento-row">
                    <!-- Categoria -->
                    <mat-form-field appearance="outline" class="categoria-field">
                      <mat-label>Elemento</mat-label>
                      <mat-select formControlName="categoria" (selectionChange)="onCategoriaChange(i)">
                        <mat-option *ngFor="let item of availableItems" [value]="item.name + '|' + item.category">
                          {{ item.name }} (Stock: {{ item.quantity }})
                        </mat-option>
                      </mat-select>
                    </mat-form-field>

                    <!-- Talla (solo si es necesario) -->
                    <mat-form-field appearance="outline" 
                                    class="talla-field" 
                                    *ngIf="requiereTalla(elemento.get('categoria')?.value)">
                      <mat-label>Talla y Género</mat-label>
                      <mat-select formControlName="talla" (selectionChange)="onTallaChange(i)">
                        <mat-option *ngFor="let item of getItemsConTalla(elemento.get('categoria')?.value)" 
                                    [value]="item.talla + '|' + (item.genero || 'N/A')">
                          Talla {{ item.talla }}
                          <span *ngIf="item.genero" [style.color]="item.genero === 'F' ? '#e91e63' : '#2196f3'">
                            {{ item.genero === 'F' ? ' ♀ Mujer' : ' ♂ Hombre' }}
                          </span>
                          (Stock: {{ item.quantity }})
                        </mat-option>
                      </mat-select>
                    </mat-form-field>

                    <!-- Cantidad -->
                    <mat-form-field appearance="outline" class="cantidad-field">
                      <mat-label>Cantidad</mat-label>
                      <input matInput type="number" formControlName="cantidad" min="1" max="10">
                    </mat-form-field>

                    <!-- Stock Disponible -->
                    <div class="stock-info" *ngIf="getStockDisponible(i) !== null">
                      <mat-chip-listbox>
                        <mat-chip [color]="getStockColor(i)" selected>
                          Stock: {{ getStockDisponible(i) }}
                        </mat-chip>
                      </mat-chip-listbox>
                    </div>

                    <!-- Botón Eliminar -->
                    <button mat-icon-button color="warn" 
                            (click)="eliminarElemento(i)" 
                            type="button"
                            class="delete-button">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>

                  <!-- Alertas de Stock -->
                  <div class="stock-alerts">
                    <mat-chip-listbox *ngIf="getStockDisponible(i) === 0">
                      <mat-chip color="warn" selected>
                        <mat-icon>warning</mat-icon>
                        Sin stock disponible
                      </mat-chip>
                    </mat-chip-listbox>

                    <mat-chip-listbox *ngIf="getStockDisponible(i) !== null && 
                                           getStockDisponible(i)! < elemento.get('cantidad')?.value">
                      <mat-chip color="accent" selected>
                        <mat-icon>info</mat-icon>
                        Stock insuficiente (Disponible: {{ getStockDisponible(i) }})
                      </mat-chip>
                    </mat-chip-listbox>
                  </div>
                </div>
              </div>

              <!-- Botón para agregar primer elemento -->
              <div class="add-first-section" *ngIf="elementosFormArray.length === 0">
                <button mat-stroked-button color="primary" (click)="agregarElemento()" type="button">
                  <mat-icon>add</mat-icon>
                  Agregar Primer Elemento
                </button>
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
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
    }
    
    ::ng-deep .mat-mdc-dialog-content {
      padding: 12px 16px !important;
    }

    .entrega-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .user-info-card, .elementos-card, .firma-card {
      margin-bottom: 16px;
    }

    .user-details p {
      margin: 8px 0;
      color: #666;
    }

    .elementos-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .elemento-item {
      padding: 20px;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      background: #fafafa;
    }

    .elemento-row {
      display: grid;
      grid-template-columns: 2fr 2fr 100px auto auto;
      gap: 15px;
      align-items: center;
      margin-bottom: 10px;
    }

    .talla-field {
      min-width: 250px;
    }

    .talla-field .mat-mdc-select-value {
      font-size: 14px;
    }

    .stock-info {
      display: flex;
      justify-content: center;
    }

    .stock-alerts {
      margin-top: 10px;
      display: flex;
      gap: 10px;
    }

    .add-first-section {
      text-align: center;
      padding: 40px;
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
      
      .elemento-row {
        grid-template-columns: 1fr;
        gap: 10px;
      }
    }
  `]
})
export class EntregaConTallasDialogComponent implements OnInit {
  entregaForm: FormGroup;
  availableItems: SupplyItem[] = [];
  allItems: SupplyItem[] = []; // Todos los items sin agrupar (para tallas con género)
  saving = false;
  signature: string | null = null;
  stockCache = new Map<string, number>();
  tallasCache = new Map<string, string[]>(); // Cache para tallas disponibles
  itemsConTallaCache = new Map<string, SupplyItem[]>(); // Cache para items con talla

  constructor(
    private fb: FormBuilder,
    private supplyInventoryService: SupplyInventoryService,
    private entregaDotacionService: EntregaDotacionService,
    private dialogRef: MatDialogRef<EntregaConTallasDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public user: User
  ) {
    this.entregaForm = this.fb.group({
      elementos: this.fb.array([]),
      observaciones: [''],
      firma: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadAvailableItems();
    this.agregarElemento();
  }

  get elementosFormArray() {
    return this.entregaForm.get('elementos') as FormArray;
  }

  loadAvailableItems() {
    this.supplyInventoryService.getAllSupplies().subscribe({
      next: (items) => {
        // Guardar TODOS los items sin filtrar (para tallas con género)
        this.allItems = items.filter(item => item.quantity > 0);
        
        // Filtrar solo elementos con stock disponible
        const itemsConStock = items.filter(item => item.quantity > 0);
        
        // Agrupar elementos similares (mismo nombre base) para evitar duplicados
        const elementosAgrupados = new Map<string, SupplyItem>();
        
        for (const item of itemsConStock) {
          const nombreBase = this.getNombreBase(item.name);
          const key = `${nombreBase}-${item.category}`;
          
          if (!elementosAgrupados.has(key)) {
            // Si es el primer elemento de este tipo, agregarlo como representante
            elementosAgrupados.set(key, {
              ...item,
              name: nombreBase, // Usar nombre base para evitar confusión
              quantity: this.getTotalStockPorTipo(itemsConStock, nombreBase, item.category)
            });
          }
        }
        
        this.availableItems = Array.from(elementosAgrupados.values());
        console.log('Elementos disponibles agrupados:', this.availableItems);
        console.log('Todos los items (sin agrupar):', this.allItems);
        
        // Precargar tallas para elementos que las requieren
        this.precargarTallas();
      },
      error: (error) => {
        console.error('Error cargando elementos:', error);
      }
    });
  }

  private precargarTallas() {
    this.availableItems.forEach(item => {
      if (requiereTalla(item.category)) {
        const cacheKey = `${item.name}-${item.category}`;
        
        this.supplyInventoryService.getTallasDisponiblesPorElemento(item.name, item.category).subscribe({
          next: (tallas) => {
            this.tallasCache.set(cacheKey, tallas);
            console.log(`Tallas cargadas para ${item.name}: [${tallas.join(', ')}]`);
          },
          error: (error) => {
            console.error(`Error cargando tallas para ${item.name}:`, error);
            this.tallasCache.set(cacheKey, []);
          }
        });
      }
    });
  }

  private getNombreBase(nombre: string): string {
    // Los nombres en la BD ya son nombre base (pantalón, camiseta, etc.)
    // No necesitamos extraer nada, solo retornar el nombre completo
    return nombre;
  }

  private getTotalStockPorTipo(items: SupplyItem[], nombreBase: string, categoria: string): number {
    return items
      .filter(item => 
        item.name === nombreBase && 
        item.category === categoria
      )
      .reduce((total, item) => total + item.quantity, 0);
  }

  // Métodos para manejar el formato combinado "nombre|categoria"
  private parseElementoValue(value: string): { nombre: string, categoria: string } {
    if (!value || !value.includes('|')) {
      return { nombre: '', categoria: value || '' };
    }
    const [nombre, categoria] = value.split('|');
    return { nombre, categoria };
  }

  private getElementoNombre(categoriaValue: string): string {
    const { nombre } = this.parseElementoValue(categoriaValue);
    return nombre;
  }

  private getElementoCategoria(categoriaValue: string): string {
    const { categoria } = this.parseElementoValue(categoriaValue);
    return categoria;
  }

  agregarElemento() {
    const elementoGroup = this.fb.group({
      categoria: ['', Validators.required],
      talla: [''],
      cantidad: [1, [Validators.required, Validators.min(1)]]
    });
    
    this.elementosFormArray.push(elementoGroup);
  }

  eliminarElemento(index: number) {
    this.elementosFormArray.removeAt(index);
    this.clearStockCache(index);
  }

  onCategoriaChange(index: number) {
    const elementoGroup = this.elementosFormArray.at(index);
    const categoria = elementoGroup.get('categoria')?.value;
    
    // Limpiar talla
    elementoGroup.get('talla')?.setValue('');
    
    // Configurar validación de talla
    const tallaControl = elementoGroup.get('talla');
    if (this.requiereTalla(categoria)) {
      tallaControl?.setValidators([Validators.required]);
    } else {
      tallaControl?.clearValidators();
    }
    tallaControl?.updateValueAndValidity();
    
    // Actualizar stock
    this.updateStock(index);
  }

  onTallaChange(index: number) {
    this.updateStock(index);
  }

  async updateStock(index: number) {
    const elementoGroup = this.elementosFormArray.at(index);
    const categoriaValue = elementoGroup.get('categoria')?.value;
    const tallaValue = elementoGroup.get('talla')?.value; // Ahora es "talla|genero"
    
    if (categoriaValue) {
      const key = `${categoriaValue}-${tallaValue || 'null'}`;
      
      const { nombre, categoria } = this.parseElementoValue(categoriaValue);
      
      if (tallaValue) {
        // Separar talla y género
        const tallaParts = tallaValue.split('|');
        const talla = tallaParts[0];
        const genero = tallaParts[1] !== 'N/A' ? tallaParts[1] : null;
        
        // Buscar item por nombre de categoria, talla y género
        const selectedItem = this.allItems.find(item => 
          item.name === nombre && 
          item.category === categoria && 
          item.talla === talla &&
          item.genero === genero
        );
        if (selectedItem) {
          this.stockCache.set(key, selectedItem.quantity);
        } else {
          this.stockCache.set(key, 0);
        }
      } else {
        // Si no hay talla específica, obtener el stock total del elemento agrupado
        const selectedItem = this.availableItems.find(item => 
          item.name === nombre && item.category === categoria
        );
        this.stockCache.set(key, selectedItem ? selectedItem.quantity : 0);
      }
    }
  }

  getStockDisponible(index: number): number | null {
    const elementoGroup = this.elementosFormArray.at(index);
    const categoria = elementoGroup.get('categoria')?.value;
    const talla = elementoGroup.get('talla')?.value;
    
    if (!categoria) return null;
    
    const key = `${categoria}-${talla || 'null'}`;
    return this.stockCache.get(key) ?? null;
  }

  getStockColor(index: number): 'primary' | 'accent' | 'warn' {
    const stock = this.getStockDisponible(index);
    if (stock === null || stock === 0) return 'warn';
    if (stock <= 5) return 'accent';
    return 'primary';
  }

  clearStockCache(index: number) {
    // Limpia el cache para elementos eliminados
    const keys = Array.from(this.stockCache.keys());
    keys.forEach(key => {
      if (key.includes(`-${index}-`)) {
        this.stockCache.delete(key);
      }
    });
  }

  requiereTalla(categoriaValue: string): boolean {
    const categoria = this.getElementoCategoria(categoriaValue);
    return requiereTalla(categoria);
  }

  getTallasDisponibles(categoriaValue: string): string[] {
    if (!categoriaValue) return [];
    
    const { nombre, categoria } = this.parseElementoValue(categoriaValue);
    const cacheKey = `${nombre}-${categoria}`;
    
    // Verificar si ya tenemos las tallas en cache
    if (this.tallasCache.has(cacheKey)) {
      return this.tallasCache.get(cacheKey)!;
    }
    
    // Si no está en cache, cargar desde el servidor
    this.supplyInventoryService.getTallasDisponiblesPorElemento(nombre, categoria).subscribe({
      next: (tallas) => {
        this.tallasCache.set(cacheKey, tallas);
      },
      error: (error) => {
        console.error('Error cargando tallas:', error);
        this.tallasCache.set(cacheKey, []);
      }
    });
    
    // Retornar lo que tengamos en cache (puede ser array vacío)
    return this.tallasCache.get(cacheKey) || [];
  }

  getItemsConTalla(categoriaValue: string): SupplyItem[] {
    if (!categoriaValue) return [];
    
    // Revisar cache primero
    if (this.itemsConTallaCache.has(categoriaValue)) {
      return this.itemsConTallaCache.get(categoriaValue)!;
    }
    
    const { nombre, categoria } = this.parseElementoValue(categoriaValue);
    
    // Filtrar elementos de TODOS los items (no agrupados) que coincidan con nombre y categoría
    const items = this.allItems.filter(item => 
      item.name === nombre && 
      item.category === categoria && 
      item.quantity > 0 &&
      item.talla !== null &&
      item.talla !== undefined
    );
    
    // Ordenar por género (F primero) y luego por talla
    const sortedItems = items.sort((a, b) => {
      // Ordenar por género (F primero)
      if (a.genero !== b.genero) {
        if (a.genero === 'F') return -1;
        if (b.genero === 'M') return 1;
      }
      // Luego por talla numérica
      return parseInt(a.talla || '0') - parseInt(b.talla || '0');
    });
    
    // Guardar en cache
    this.itemsConTallaCache.set(categoriaValue, sortedItems);
    
    return sortedItems;
  }

  onSignatureChange(signatureUrl: string | null): void {
    this.signature = signatureUrl;
    this.entregaForm.get('firma')?.setValue(signatureUrl);
    console.log('Signature updated:', signatureUrl ? 'Signature captured' : 'Signature cleared');
  }

  isFormValid(): boolean {
    const formValid = this.entregaForm.valid;
    const hasElements = this.elementosFormArray.length > 0;
    const hasSignature = !!this.signature;
    
    // Verificar stock suficiente
    let stockSuficiente = true;
    for (let i = 0; i < this.elementosFormArray.length; i++) {
      const elementoGroup = this.elementosFormArray.at(i);
      const cantidad = elementoGroup.get('cantidad')?.value || 0;
      const stockDisponible = this.getStockDisponible(i) || 0;
      
      if (cantidad > stockDisponible) {
        stockSuficiente = false;
        break;
      }
    }
    
    return formValid && hasElements && hasSignature && stockSuficiente;
  }

  async onSave() {
    if (this.isFormValid()) {
      this.saving = true;
      
      try {
        console.log('=== DEBUG ENTREGA ===');
        console.log('elementosFormArray.value:', this.elementosFormArray.value);
        
        const elementos = this.elementosFormArray.value.map((elemento: any, index: number) => {
          console.log(`Elemento ${index}:`, elemento);
          const { nombre, categoria } = this.parseElementoValue(elemento.categoria);
          console.log(`  parseElementoValue("${elemento.categoria}") ->`, { nombre, categoria });
          
          // Separar talla y género si vienen en formato "talla|genero"
          let talla = null;
          let genero = null;
          
          if (elemento.talla) {
            const tallaParts = elemento.talla.split('|');
            talla = tallaParts[0];
            genero = tallaParts[1] !== 'N/A' ? tallaParts[1] : null;
          }
          
          const result = {
            categoria: nombre, // Guardar el nombre específico del elemento (ej: "pantalón")
            categoriaOriginal: categoria, // Mantener la categoría original por si es necesaria
            talla: talla,
            genero: genero,
            cantidad: elemento.cantidad
          };
          console.log(`  resultado final:`, result);
          return result;
        });
        
        const entregaData = {
          userId: this.user.id,
          elementos,
          observaciones: this.entregaForm.get('observaciones')?.value || '',
          firma_url: this.signature
        };
        
        console.log('Datos de entrega completos:', entregaData);
        console.log('=== FIN DEBUG ENTREGA ===');
        
        this.saving = false;
        this.dialogRef.close(entregaData);
        
      } catch (error) {
        console.error('Error procesando entrega:', error);
        alert('Error procesando la entrega. Intenta de nuevo.');
        this.saving = false;
      }
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}