import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { SignaturePadComponent } from '../signature-pad/signature-pad.component';
import { SupabaseSignatureService } from '../../services/supabase-signature.service';

@Component({
  selector: 'app-signature-test',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, SignaturePadComponent],
  template: `
    <div class="test-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Prueba de Firma con Supabase</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="status-section">
            <h3>Estado de Supabase:</h3>
            <button mat-raised-button color="primary" (click)="testConnection()">
              Probar Conexión
            </button>
            <p *ngIf="connectionStatus">{{ connectionStatus }}</p>
          </div>

          <div class="signature-section">
            <h3>Prueba de Firma:</h3>
            <app-signature-pad 
              [userId]="'test-user'"
              (signatureUploaded)="onSignatureUploaded($event)"
              (signatureChange)="onSignatureChange($event)">
            </app-signature-pad>
            
            <div *ngIf="signatureUrl" class="signature-result">
              <h4>Firma guardada en Supabase:</h4>
              <p>URL: {{ signatureUrl }}</p>
              <img [src]="signatureUrl" alt="Firma" style="max-width: 300px; border: 1px solid #ccc;">
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .test-container {
      max-width: 800px;
      margin: 20px auto;
      padding: 20px;
    }
    
    .status-section, .signature-section {
      margin: 20px 0;
    }
    
    .signature-result {
      margin-top: 20px;
      padding: 15px;
      background: #f0f8ff;
      border-radius: 8px;
    }
    
    .signature-result img {
      margin-top: 10px;
    }
  `]
})
export class SignatureTestComponent {
  connectionStatus: string | null = null;
  signatureUrl: string | null = null;

  constructor(private supabaseSignatureService: SupabaseSignatureService) {}

  async testConnection() {
    this.connectionStatus = 'Verificando conexión...';
    try {
      const isConnected = await this.supabaseSignatureService.checkBucketConnection();
      this.connectionStatus = isConnected 
        ? '✅ Conexión exitosa. Bucket "signatures" encontrado.'
        : '❌ No se pudo conectar o el bucket "signatures" no existe.';
    } catch (error) {
      this.connectionStatus = `❌ Error de conexión: ${error}`;
    }
  }

  onSignatureChange(signature: string | null) {
    console.log('Signature change:', signature);
  }

  onSignatureUploaded(url: string) {
    console.log('Signature uploaded to:', url);
    this.signatureUrl = url;
  }
}
