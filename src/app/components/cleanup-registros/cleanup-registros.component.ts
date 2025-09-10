import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { getApiBaseUrl } from '../../config/api.config';

interface RegistroStats {
  totalRegistros: number;
  registrosPorAnio: { anio: number; cantidad: number }[];
  registrosPorMes: { anio: number; mes: number; cantidad: number; firmas: number }[];
  espacioFirmas: number;
}

interface ConfirmacionEliminacion {
  cantidad: number;
  firmas: string[];
}

@Component({
  selector: 'app-cleanup-registros',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatDividerModule,
    MatChipsModule
  ],
  template: `
    <div class="cleanup-container">
      <mat-card class="cleanup-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>delete_sweep</mat-icon>
            Limpieza Masiva de Registros
          </mat-card-title>
          <mat-card-subtitle>
            Sistema de eliminación de registros antiguos con protecciones de seguridad
          </mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <!-- Paso 1: Estadísticas -->
          <div *ngIf="currentStep === 'stats'" class="step-container">
            <h3>📊 Estadísticas del Sistema</h3>
            <div *ngIf="stats" class="stats-grid">
              <div class="stat-card">
                <h4>Total de Registros</h4>
                <span class="stat-number">{{ stats.totalRegistros | number }}</span>
              </div>
              <div class="stat-card">
                <h4>Espacio en Firmas</h4>
                <span class="stat-number">~{{ stats.espacioFirmas }} MB</span>
              </div>
            </div>

            <div *ngIf="stats" class="registros-por-anio">
              <h4>Registros por Año</h4>
              <div class="anio-chips">
                <mat-chip-set>
                  <mat-chip *ngFor="let anio of stats.registrosPorAnio" 
                           [class.chip-old]="isAnioEliminable(anio.anio)"
                           [class.chip-protected]="!isAnioEliminable(anio.anio)">
                    {{ anio.anio }}: {{ anio.cantidad | number }}
                    <mat-icon *ngIf="!isAnioEliminable(anio.anio)">shield</mat-icon>
                  </mat-chip>
                </mat-chip-set>
              </div>
            </div>

            <div class="form-section">
              <h4>Seleccionar Criterio de Eliminación</h4>
              <form [formGroup]="cleanupForm">
                <mat-form-field appearance="fill">
                  <mat-label>Tipo de Eliminación</mat-label>
                  <mat-select formControlName="tipoEliminacion" (selectionChange)="onTipoChange()">
                    <mat-option value="anio">Por Año Completo</mat-option>
                    <mat-option value="mes">Por Mes Específico</mat-option>
                    <mat-option value="rango">Por Rango de Fechas</mat-option>
                  </mat-select>
                </mat-form-field>

                <div *ngIf="cleanupForm.get('tipoEliminacion')?.value === 'anio'">
                  <mat-form-field appearance="fill">
                    <mat-label>Año</mat-label>
                    <mat-select formControlName="anio">
                      <mat-option *ngFor="let anio of aniosDisponibles" [value]="anio.anio">
                        {{ anio.anio }} ({{ anio.cantidad | number }} registros)
                      </mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>

                <div *ngIf="cleanupForm.get('tipoEliminacion')?.value === 'mes'">
                  <mat-form-field appearance="fill">
                    <mat-label>Año</mat-label>
                    <mat-select formControlName="anio">
                      <mat-option *ngFor="let anio of aniosDisponibles" [value]="anio.anio">
                        {{ anio.anio }}
                      </mat-option>
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="fill">
                    <mat-label>Mes</mat-label>
                    <mat-select formControlName="mes">
                      <mat-option value="1">Enero</mat-option>
                      <mat-option value="2">Febrero</mat-option>
                      <mat-option value="3">Marzo</mat-option>
                      <mat-option value="4">Abril</mat-option>
                      <mat-option value="5">Mayo</mat-option>
                      <mat-option value="6">Junio</mat-option>
                      <mat-option value="7">Julio</mat-option>
                      <mat-option value="8">Agosto</mat-option>
                      <mat-option value="9">Septiembre</mat-option>
                      <mat-option value="10">Octubre</mat-option>
                      <mat-option value="11">Noviembre</mat-option>
                      <mat-option value="12">Diciembre</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>

                <div *ngIf="cleanupForm.get('tipoEliminacion')?.value === 'rango'">
                  <mat-form-field appearance="fill">
                    <mat-label>Fecha Inicio</mat-label>
                    <input matInput [matDatepicker]="pickerInicio" formControlName="fechaInicio" [max]="fechaMaxima">
                    <mat-datepicker-toggle matSuffix [for]="pickerInicio"></mat-datepicker-toggle>
                    <mat-datepicker #pickerInicio></mat-datepicker>
                  </mat-form-field>
                  <mat-form-field appearance="fill">
                    <mat-label>Fecha Fin</mat-label>
                    <input matInput [matDatepicker]="pickerFin" formControlName="fechaFin" [max]="fechaMaxima">
                    <mat-datepicker-toggle matSuffix [for]="pickerFin"></mat-datepicker-toggle>
                    <mat-datepicker #pickerFin></mat-datepicker>
                  </mat-form-field>
                </div>
              </form>
            </div>
          </div>

          <!-- Paso 2: Previsualización -->
          <div *ngIf="currentStep === 'preview'" class="step-container">
            <h3>👁️ Previsualización de Eliminación</h3>
            <div *ngIf="previewData" class="preview-info">
              <div class="warning-box">
                <mat-icon>warning</mat-icon>
                <div>
                  <p><strong>¡ATENCIÓN!</strong> Esta acción eliminará permanentemente:</p>
                  <ul>
                    <li><strong>{{ previewData.cantidad | number }}</strong> registros de entregas</li>
                    <li><strong>{{ previewData.firmas.length | number }}</strong> archivos de firmas digitales</li>
                  </ul>
                  <p><strong>Esta acción NO se puede deshacer.</strong></p>
                </div>
              </div>
            </div>
          </div>

          <!-- Paso 3: Confirmación -->
          <div *ngIf="currentStep === 'confirm'" class="step-container">
            <h3>✋ Confirmación Requerida</h3>
            <div class="confirmation-section">
              <div class="danger-box">
                <mat-icon>dangerous</mat-icon>
                <p><strong>CONFIRMACIÓN FINAL:</strong></p>
                <p>Para proceder con la eliminación de <strong>{{ previewData?.cantidad | number }}</strong> registros, 
                   escriba exactamente la palabra <strong>"ELIMINAR"</strong> en el campo de abajo:</p>
              </div>
              
              <mat-form-field appearance="fill" class="confirmation-input">
                <mat-label>Escriba "ELIMINAR" para confirmar</mat-label>
                <input matInput [(ngModel)]="confirmacionTexto" (input)="validarConfirmacion()" 
                       placeholder="ELIMINAR" autocomplete="off">
              </mat-form-field>
              
              <div class="confirmation-status" [class.valid]="confirmacionValida" [class.invalid]="!confirmacionValida">
                <mat-icon>{{ confirmacionValida ? 'check_circle' : 'cancel' }}</mat-icon>
                <span>{{ confirmacionValida ? 'Confirmación válida' : 'Debe escribir exactamente "ELIMINAR"' }}</span>
              </div>
            </div>
          </div>

          <!-- Paso 4: Progreso -->
          <div *ngIf="currentStep === 'progress'" class="step-container">
            <h3>⏳ Eliminando Registros...</h3>
            <div class="progress-section">
              <mat-progress-bar mode="indeterminate" color="warn"></mat-progress-bar>
              <p>{{ progresoMensaje }}</p>
              <p class="warning-text">Por favor no cierre esta ventana hasta que termine el proceso.</p>
            </div>
          </div>

          <!-- Paso 5: Completado -->
          <div *ngIf="currentStep === 'completed'" class="step-container">
            <h3>✅ Eliminación Completada</h3>
            <div class="success-info">
              <mat-icon color="primary">check_circle</mat-icon>
              <p>Se han eliminado exitosamente <strong>{{ resultadoEliminacion?.eliminados | number }}</strong> registros.</p>
              <p>El proceso se completó sin errores.</p>
            </div>
          </div>

          <mat-divider *ngIf="currentStep !== 'completed'"></mat-divider>
        </mat-card-content>
        
        <mat-card-actions>
          <div class="actions-container">
            <button mat-raised-button (click)="cerrar()" [disabled]="procesando">
              <mat-icon>close</mat-icon>
              Cerrar
            </button>
            
            <div class="action-buttons">
              <button *ngIf="currentStep === 'stats'" 
                      mat-raised-button color="primary" 
                      (click)="previsualizarEliminacion()"
                      [disabled]="!cleanupForm.valid || procesando">
                <mat-icon>visibility</mat-icon>
                Previsualizar
              </button>
              
              <button *ngIf="currentStep === 'preview'" 
                      mat-raised-button color="accent" 
                      (click)="currentStep = 'confirm'">
                <mat-icon>arrow_forward</mat-icon>
                Continuar
              </button>
              
              <button *ngIf="currentStep === 'confirm'" 
                      mat-raised-button color="warn" 
                      (click)="ejecutarEliminacion()"
                      [disabled]="!confirmacionValida || procesando">
                <mat-icon>delete_forever</mat-icon>
                ELIMINAR PERMANENTEMENTE
              </button>
              
              <button *ngIf="currentStep === 'completed'" 
                      mat-raised-button color="primary" 
                      (click)="reiniciar()">
                <mat-icon>refresh</mat-icon>
                Nueva Limpieza
              </button>
            </div>
          </div>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .cleanup-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .cleanup-card {
      width: 100%;
      min-height: 500px;
    }
    
    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #d32f2f;
    }
    
    .step-container {
      min-height: 300px;
      padding: 20px 0;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin: 20px 0;
    }
    
    .stat-card {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      text-align: center;
    }
    
    .stat-card h4 {
      margin: 0 0 8px 0;
      color: #666;
    }
    
    .stat-number {
      font-size: 24px;
      font-weight: bold;
      color: #1976d2;
    }
    
    .anio-chips {
      margin: 16px 0;
    }
    
    .chip-old {
      background-color: #ffebee !important;
      color: #d32f2f !important;
    }
    
    .chip-protected {
      background-color: #e8f5e8 !important;
      color: #2e7d32 !important;
    }
    
    .form-section {
      margin: 24px 0;
    }
    
    .form-section mat-form-field {
      width: 100%;
      margin-bottom: 16px;
    }
    
    .warning-box {
      display: flex;
      gap: 12px;
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
    }
    
    .warning-box mat-icon {
      color: #ff9800;
    }
    
    .danger-box {
      background: #ffebee;
      border: 2px solid #f44336;
      border-radius: 8px;
      padding: 20px;
      margin: 16px 0;
      text-align: center;
    }
    
    .danger-box mat-icon {
      color: #f44336;
      font-size: 48px;
      width: 48px;
      height: 48px;
    }
    
    .confirmation-input {
      width: 100%;
      margin: 20px 0;
    }
    
    .confirmation-status {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      border-radius: 8px;
      margin: 16px 0;
    }
    
    .confirmation-status.valid {
      background: #e8f5e8;
      color: #2e7d32;
    }
    
    .confirmation-status.invalid {
      background: #ffebee;
      color: #d32f2f;
    }
    
    .progress-section {
      text-align: center;
      padding: 40px 20px;
    }
    
    .warning-text {
      color: #ff9800;
      font-weight: bold;
    }
    
    .success-info {
      text-align: center;
      padding: 40px 20px;
    }
    
    .success-info mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #4caf50;
    }
    
    .actions-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    
    .action-buttons {
      display: flex;
      gap: 12px;
    }
    
    .preview-info ul {
      margin: 8px 0;
      padding-left: 20px;
    }
    
    mat-divider {
      margin: 24px 0;
    }
  `]
})
export class CleanupRegistrosComponent implements OnInit {
  cleanupForm: FormGroup;
  stats: RegistroStats | null = null;
  previewData: ConfirmacionEliminacion | null = null;
  resultadoEliminacion: any = null;
  
  currentStep: 'stats' | 'preview' | 'confirm' | 'progress' | 'completed' = 'stats';
  procesando = false;
  progresoMensaje = '';
  
  confirmacionTexto = '';
  confirmacionValida = false;
  
  fechaMaxima: Date;
  aniosDisponibles: { anio: number; cantidad: number }[] = [];

  private apiUrl = getApiBaseUrl();

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private dialogRef: MatDialogRef<CleanupRegistrosComponent>,
    private snackBar: MatSnackBar
  ) {
    // Fecha máxima: hace un año desde hoy
    this.fechaMaxima = new Date();
    this.fechaMaxima.setFullYear(this.fechaMaxima.getFullYear() - 1);

    this.cleanupForm = this.fb.group({
      tipoEliminacion: ['', Validators.required],
      anio: [''],
      mes: [''],
      fechaInicio: [''],
      fechaFin: ['']
    });
  }

  ngOnInit() {
    this.cargarEstadisticas();
  }

  async cargarEstadisticas() {
    try {
      this.procesando = true;
      const response = await this.http.get<RegistroStats>(`${this.apiUrl}/api/delivery/stats`).toPromise();
      
      if (response) {
        this.stats = response;
        this.aniosDisponibles = response.registrosPorAnio.filter(a => this.isAnioEliminable(a.anio));
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      this.snackBar.open('Error cargando estadísticas', 'Cerrar', { duration: 5000 });
    } finally {
      this.procesando = false;
    }
  }

  isAnioEliminable(anio: number): boolean {
    const anioActual = new Date().getFullYear();
    return anio < (anioActual - 1);
  }

  onTipoChange() {
    const tipo = this.cleanupForm.get('tipoEliminacion')?.value;
    
    // Reset form fields
    this.cleanupForm.patchValue({
      anio: '',
      mes: '',
      fechaInicio: '',
      fechaFin: ''
    });

    // Update validators
    const anioControl = this.cleanupForm.get('anio');
    const mesControl = this.cleanupForm.get('mes');
    const fechaInicioControl = this.cleanupForm.get('fechaInicio');
    const fechaFinControl = this.cleanupForm.get('fechaFin');

    // Clear all validators first
    anioControl?.clearValidators();
    mesControl?.clearValidators();
    fechaInicioControl?.clearValidators();
    fechaFinControl?.clearValidators();

    if (tipo === 'anio') {
      anioControl?.setValidators([Validators.required]);
    } else if (tipo === 'mes') {
      anioControl?.setValidators([Validators.required]);
      mesControl?.setValidators([Validators.required]);
    } else if (tipo === 'rango') {
      fechaInicioControl?.setValidators([Validators.required]);
      fechaFinControl?.setValidators([Validators.required]);
    }

    // Update validity
    anioControl?.updateValueAndValidity();
    mesControl?.updateValueAndValidity();
    fechaInicioControl?.updateValueAndValidity();
    fechaFinControl?.updateValueAndValidity();
  }

  async previsualizarEliminacion() {
    if (!this.cleanupForm.valid) return;

    try {
      this.procesando = true;
      const formData = this.cleanupForm.value;
      let params: any = {};

      if (formData.tipoEliminacion === 'anio') {
        params.anio = formData.anio;
      } else if (formData.tipoEliminacion === 'mes') {
        params.anio = formData.anio;
        params.mes = formData.mes;
      } else if (formData.tipoEliminacion === 'rango') {
        params.fechaInicio = formData.fechaInicio.toISOString().split('T')[0];
        params.fechaFin = formData.fechaFin.toISOString().split('T')[0];
      }

      const response = await this.http.get<ConfirmacionEliminacion>(`${this.apiUrl}/api/delivery/preview-delete`, { params }).toPromise();
      
      if (response) {
        this.previewData = response;
        this.currentStep = 'preview';
      }
    } catch (error) {
      console.error('Error en previsualización:', error);
      this.snackBar.open('Error en previsualización', 'Cerrar', { duration: 5000 });
    } finally {
      this.procesando = false;
    }
  }

  validarConfirmacion() {
    this.confirmacionValida = this.confirmacionTexto.trim() === 'ELIMINAR';
  }

  async ejecutarEliminacion() {
    if (!this.confirmacionValida || !this.previewData) return;

    try {
      this.procesando = true;
      this.currentStep = 'progress';
      this.progresoMensaje = 'Preparando eliminación...';

      const formData = this.cleanupForm.value;
      let params: any = {};

      if (formData.tipoEliminacion === 'anio') {
        params.anio = formData.anio;
      } else if (formData.tipoEliminacion === 'mes') {
        params.anio = formData.anio;
        params.mes = formData.mes;
      } else if (formData.tipoEliminacion === 'rango') {
        params.fechaInicio = formData.fechaInicio.toISOString().split('T')[0];
        params.fechaFin = formData.fechaFin.toISOString().split('T')[0];
      }

      // Primero obtener las firmas a eliminar
      this.progresoMensaje = 'Obteniendo lista de firmas...';
      const firmasResponse = await this.http.get<{firmas: string[]}>(`${this.apiUrl}/api/delivery/get-firmas-to-delete`, { params }).toPromise();

      // Eliminar las firmas del storage
      if (firmasResponse && firmasResponse.firmas.length > 0) {
        this.progresoMensaje = `Eliminando ${firmasResponse.firmas.length} archivos de firmas...`;
        // Aquí implementar la eliminación de firmas del storage
        // Por ahora solo simulamos
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Eliminar los registros de la base de datos
      this.progresoMensaje = 'Eliminando registros de la base de datos...';
      const deleteResponse = await this.http.delete<any>(`${this.apiUrl}/api/delivery/bulk-delete`, { params }).toPromise();

      if (deleteResponse) {
        this.resultadoEliminacion = deleteResponse;
        this.currentStep = 'completed';
        this.snackBar.open(`Eliminación completada: ${deleteResponse.eliminados} registros`, 'Cerrar', { duration: 5000 });
      }
    } catch (error: any) {
      console.error('Error en eliminación:', error);
      this.currentStep = 'stats';
      const mensaje = error.error?.error || 'Error en eliminación masiva';
      this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
    } finally {
      this.procesando = false;
    }
  }

  reiniciar() {
    this.currentStep = 'stats';
    this.previewData = null;
    this.resultadoEliminacion = null;
    this.confirmacionTexto = '';
    this.confirmacionValida = false;
    this.cleanupForm.reset();
    this.cargarEstadisticas();
  }

  cerrar() {
    this.dialogRef.close(this.resultadoEliminacion);
  }
}
