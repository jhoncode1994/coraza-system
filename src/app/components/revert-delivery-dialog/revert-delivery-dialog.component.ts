import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EntregaHistorial } from '../../services/entrega-dotacion.service';

@Component({
  selector: 'app-revert-delivery-dialog',
  templateUrl: './revert-delivery-dialog.component.html',
  styleUrls: ['./revert-delivery-dialog.component.scss'],
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
export class RevertDeliveryDialogComponent {
  revertForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<RevertDeliveryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { entrega: EntregaHistorial }
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
}
