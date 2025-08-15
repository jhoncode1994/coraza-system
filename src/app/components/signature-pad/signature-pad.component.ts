import { Component, ElementRef, ViewChild, AfterViewInit, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import SignaturePad from 'signature_pad';

@Component({
  selector: 'app-signature-pad',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule],
  template: `
    <div class="signature-container">
      <mat-card class="signature-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>edit</mat-icon>
            Firma de Recepción
          </mat-card-title>
          <mat-card-subtitle>
            Por favor firme para confirmar la recepción de los elementos
          </mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <div class="canvas-container">
            <canvas 
              #signatureCanvas
              class="signature-canvas"
              [class.has-signature]="!isEmpty"
              [class.required-error]="showError && isEmpty">
            </canvas>
            
            <div class="signature-overlay" *ngIf="isEmpty && !isDrawing">
              <mat-icon>gesture</mat-icon>
              <span>Toque aquí para firmar</span>
            </div>
          </div>
          
          <div class="signature-actions">
            <button mat-stroked-button (click)="clear()" [disabled]="isEmpty" color="warn">
              <mat-icon>clear</mat-icon>
              Limpiar
            </button>
            
            <button mat-raised-button (click)="save()" [disabled]="isEmpty" color="primary">
              <mat-icon>check_circle</mat-icon>
              Confirmar Firma
            </button>
          </div>
          
          <div class="error-message" *ngIf="showError && isEmpty">
            <mat-icon>error</mat-icon>
            La firma es requerida para completar la entrega
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .signature-container {
      width: 100%;
      max-width: 500px;
      margin: 0 auto;
    }

    .signature-card {
      margin: 16px 0;
    }

    mat-card-header {
      margin-bottom: 16px;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #1976d2;
    }

    .canvas-container {
      position: relative;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      background: #fafafa;
      margin-bottom: 16px;
      overflow: hidden;
    }

    .signature-canvas {
      display: block;
      width: 100%;
      height: 200px;
      background: white;
      cursor: crosshair;
      transition: border-color 0.3s ease;
    }

    .signature-canvas.has-signature {
      border-color: #4caf50;
    }

    .signature-canvas.required-error {
      border-color: #f44336;
    }

    .signature-overlay {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      color: #666;
      pointer-events: none;
      opacity: 0.7;
    }

    .signature-overlay mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    .signature-actions {
      display: flex;
      gap: 12px;
      justify-content: space-between;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #f44336;
      margin-top: 12px;
      font-size: 14px;
    }

    .error-message mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* Estilos optimizados para tablet */
    @media (max-width: 768px) {
      .signature-canvas {
        height: 250px;
      }
      
      .signature-actions button {
        flex: 1;
        min-height: 48px;
      }
    }

    /* Mejoras para pantallas táctiles */
    @media (pointer: coarse) {
      .signature-canvas {
        touch-action: none;
        height: 280px;
      }
    }
  `]
})
export class SignaturePadComponent implements AfterViewInit, OnInit {
  @ViewChild('signatureCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Output() signatureChange = new EventEmitter<string | null>();
  @Input() showError = false;
  @Input() required = true;

  private signaturePad!: SignaturePad;
  isEmpty = true;
  isDrawing = false;

  ngOnInit() {
    // Configuración inicial
  }

  ngAfterViewInit() {
    this.initializeSignaturePad();
  }

  private initializeSignaturePad() {
    const canvas = this.canvasRef.nativeElement;
    
    // Configurar el tamaño del canvas
    this.resizeCanvas();
    
    // Inicializar SignaturePad con configuración optimizada para tablet
    this.signaturePad = new SignaturePad(canvas, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: 'rgb(0, 0, 0)',
      minWidth: 2,
      maxWidth: 4,
      throttle: 16, // Mejor rendimiento en tablets
      minDistance: 5,
    });

    // Eventos para detectar cuando se está dibujando
    this.signaturePad.addEventListener('beginStroke', () => {
      this.isDrawing = true;
    });

    this.signaturePad.addEventListener('endStroke', () => {
      this.isDrawing = false;
      this.isEmpty = this.signaturePad.isEmpty();
      this.emitSignature();
    });

    // Redimensionar cuando cambie el tamaño de la ventana
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  private resizeCanvas() {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement!;
    
    // Obtener el tamaño del contenedor
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Configurar el tamaño del canvas
    canvas.width = containerWidth;
    canvas.height = containerHeight || 200;
    
    // Restaurar la configuración del SignaturePad si ya existe
    if (this.signaturePad) {
      this.signaturePad.clear();
    }
  }

  clear() {
    this.signaturePad.clear();
    this.isEmpty = true;
    this.emitSignature();
  }

  save() {
    if (!this.isEmpty) {
      this.emitSignature();
    }
  }

  private emitSignature() {
    if (this.isEmpty) {
      this.signatureChange.emit(null);
    } else {
      // Emitir la firma como base64
      const dataURL = this.signaturePad.toDataURL('image/png');
      this.signatureChange.emit(dataURL);
    }
  }

  // Método público para validar si hay firma
  hasSignature(): boolean {
    return !this.isEmpty;
  }

  // Método público para obtener la firma
  getSignature(): string | null {
    if (this.isEmpty) {
      return null;
    }
    return this.signaturePad.toDataURL('image/png');
  }
}
