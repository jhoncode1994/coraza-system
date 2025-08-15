import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-signature-viewer',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>edit</mat-icon>
      Firma de Recepción
    </h2>
    
    <mat-dialog-content>
      <div class="signature-viewer">
        <img [src]="data.signature" alt="Firma digital" class="signature-image">
        <p class="signature-info">
          Firma capturada digitalmente como confirmación de recepción
        </p>
      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .signature-viewer {
      text-align: center;
      padding: 16px;
    }

    .signature-image {
      max-width: 100%;
      max-height: 300px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .signature-info {
      margin-top: 16px;
      color: #666;
      font-style: italic;
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #1976d2;
    }
  `]
})
export class SignatureViewerComponent {
  constructor(
    public dialogRef: MatDialogRef<SignatureViewerComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { signature: string }
  ) {}

  close() {
    this.dialogRef.close();
  }
}
