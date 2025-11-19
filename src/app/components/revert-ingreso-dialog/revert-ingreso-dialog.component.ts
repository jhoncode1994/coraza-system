import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { InventoryMovement } from '../../services/inventory-movements.service';

@Component({
  selector: 'app-revert-ingreso-dialog',
  templateUrl: './revert-ingreso-dialog.component.html',
  styleUrls: ['./revert-ingreso-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class RevertIngresoDialogComponent {
  revertForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<RevertIngresoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { movement: InventoryMovement }
  ) {
    this.revertForm = this.fb.group({
      motivo: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (this.revertForm.valid) {
      this.dialogRef.close(this.revertForm.value.motivo);
    }
  }

  formatDate(date: any): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
