import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

export interface RetireDialogData {
  associate: {
    id: number;
    nombre: string;
    apellido: string;
    cedula: string;
  };
}

export interface RetireDialogResult {
  confirmed: boolean;
  reason?: string;
}

@Component({
  selector: 'app-retire-associate-dialog',
  template: `
    <h2 mat-dialog-title>
      <mat-icon color="warn">person_remove</mat-icon>
      Retirar Asociado
    </h2>
    
    <mat-dialog-content>
      <div class="associate-info">
        <h3>¿Está seguro que desea retirar al asociado?</h3>
        <p><strong>Nombre:</strong> {{data.associate.nombre}} {{data.associate.apellido}}</p>
        <p><strong>Cédula:</strong> {{data.associate.cedula}}</p>
      </div>
      
      <div class="warning-message">
        <mat-icon color="warn">warning</mat-icon>
        <p>El asociado será movido a la sección de "Asociados Retirados" pero se mantendrá todo su historial de dotaciones para consultas futuras.</p>
      </div>

      <form [formGroup]="retireForm" class="retire-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Motivo del retiro</mat-label>
          <mat-select formControlName="reason" required>
            <mat-option value="renuncia_voluntaria">Renuncia Voluntaria</mat-option>
            <mat-option value="retiro_cooperativa">Retiro de la Cooperativa</mat-option>
            <mat-option value="traslado">Traslado</mat-option>
            <mat-option value="jubilacion">Jubilación</mat-option>
            <mat-option value="fallecimiento">Fallecimiento</mat-option>
            <mat-option value="suspension">Suspensión</mat-option>
            <mat-option value="otros">Otros</mat-option>
          </mat-select>
          <mat-error *ngIf="retireForm.get('reason')?.hasError('required')">
            El motivo del retiro es requerido
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width" *ngIf="retireForm.get('reason')?.value === 'otros'">
          <mat-label>Especifique el motivo</mat-label>
          <textarea matInput formControlName="customReason" rows="3" placeholder="Describa el motivo del retiro..."></textarea>
          <mat-error *ngIf="retireForm.get('customReason')?.hasError('required')">
            Debe especificar el motivo
          </mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="warn" [disabled]="!retireForm.valid" (click)="onConfirm()">
        <mat-icon>person_remove</mat-icon>
        Retirar Asociado
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .associate-info {
      margin-bottom: 20px;
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 8px;
    }
    
    .associate-info h3 {
      margin-top: 0;
      color: #333;
    }
    
    .warning-message {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 20px;
      padding: 16px;
      background-color: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 8px;
    }
    
    .warning-message mat-icon {
      margin-top: 2px;
    }
    
    .warning-message p {
      margin: 0;
      color: #856404;
    }
    
    .retire-form {
      margin-top: 20px;
    }
    
    .full-width {
      width: 100%;
    }
    
    mat-dialog-content {
      min-width: 500px;
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
    MatIconModule,
    MatSelectModule
  ]
})
export class RetireAssociateDialogComponent {
  retireForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<RetireAssociateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RetireDialogData
  ) {
    this.retireForm = this.fb.group({
      reason: ['', Validators.required],
      customReason: ['']
    });

    // Agregar validación condicional para motivo personalizado
    this.retireForm.get('reason')?.valueChanges.subscribe(value => {
      const customReasonControl = this.retireForm.get('customReason');
      if (value === 'otros') {
        customReasonControl?.setValidators([Validators.required]);
      } else {
        customReasonControl?.clearValidators();
      }
      customReasonControl?.updateValueAndValidity();
    });
  }

  onCancel(): void {
    this.dialogRef.close({ confirmed: false });
  }

  onConfirm(): void {
    if (this.retireForm.valid) {
      const reason = this.retireForm.get('reason')?.value;
      const customReason = this.retireForm.get('customReason')?.value;
      
      const finalReason = reason === 'otros' ? customReason : this.getReasonText(reason);
      
      this.dialogRef.close({ 
        confirmed: true, 
        reason: finalReason 
      });
    }
  }

  private getReasonText(reason: string): string {
    const reasons = {
      'renuncia_voluntaria': 'Renuncia Voluntaria',
      'retiro_cooperativa': 'Retiro de la Cooperativa',
      'traslado': 'Traslado',
      'jubilacion': 'Jubilación',
      'fallecimiento': 'Fallecimiento',
      'suspension': 'Suspensión'
    };
    return reasons[reason as keyof typeof reasons] || reason;
  }
}
