import { Component, ElementRef, ViewChild, AfterViewInit, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { SignatureStorageService } from '../../services/signature-storage.service';


// Implementación nativa de firma digital sin dependencias externas
class SimpleSignaturePad {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private isDrawing = false;
  private lastX = 0;
  private lastY = 0;
  private isEmpty = true;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.setupCanvas();
    this.bindEvents();
  }

  private setupCanvas() {
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.clear();
  }

  private bindEvents() {
    // Mouse events
    this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
    this.canvas.addEventListener('mousemove', this.draw.bind(this));
    this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
    this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));

    // Touch events for tablets
    this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
    this.canvas.addEventListener('touchmove', this.handleTouch.bind(this));
    this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
  }

  private startDrawing(e: MouseEvent) {
    this.isDrawing = true;
    const rect = this.canvas.getBoundingClientRect();
    this.lastX = e.clientX - rect.left;
    this.lastY = e.clientY - rect.top;
    this.isEmpty = false;
  }

  private draw(e: MouseEvent) {
    if (!this.isDrawing) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(currentX, currentY);
    this.ctx.stroke();

    this.lastX = currentX;
    this.lastY = currentY;
  }

  private stopDrawing() {
    this.isDrawing = false;
  }

  private handleTouch(e: TouchEvent) {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    if (e.type === 'touchstart') {
      this.isDrawing = true;
      this.lastX = x;
      this.lastY = y;
      this.isEmpty = false;
    } else if (e.type === 'touchmove' && this.isDrawing) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.lastX, this.lastY);
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
      this.lastX = x;
      this.lastY = y;
    }
  }

  clear() {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.isEmpty = true;
  }

  toDataURL(type = 'image/png'): string {
    return this.canvas.toDataURL(type);
  }

  addEventListener(event: string, handler: () => void) {
    if (event === 'endStroke') {
      this.canvas.addEventListener('mouseup', handler);
      this.canvas.addEventListener('touchend', handler);
    }
  }

  get empty(): boolean {
    return this.isEmpty;
  }
}

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
            <button mat-stroked-button (click)="clear()" [disabled]="isEmpty || isUploading" color="warn">
              <mat-icon>clear</mat-icon>
              Limpiar
            </button>
            
            <button mat-raised-button (click)="save()" [disabled]="isEmpty || isUploading" color="primary">
              <mat-icon *ngIf="!isUploading">check_circle</mat-icon>
              <mat-icon *ngIf="isUploading" class="spinning">sync</mat-icon>
              {{isUploading ? 'Subiendo...' : 'Confirmar Firma'}}
            </button>
          </div>
          
          <div class="error-message" *ngIf="showError && isEmpty">
            <mat-icon>error</mat-icon>
            La firma es requerida para completar la entrega
          </div>
          
          <div class="error-message" *ngIf="uploadError">
            <mat-icon>cloud_off</mat-icon>
            {{ uploadError }}
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

    /* Animación de carga para el ícono */
    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class SignaturePadComponent implements AfterViewInit, OnInit {
  @ViewChild('signatureCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Output() signatureChange = new EventEmitter<string | null>(); // Ahora emite la URL de Supabase
  @Output() signatureUploaded = new EventEmitter<string>(); // Nueva salida para URL confirmada
  @Input() showError = false;
  @Input() required = true;
  @Input() userId: string | number = ''; // ID del usuario para nombrar el archivo

  private signaturePad!: SimpleSignaturePad;
  isEmpty = true;
  isDrawing = false;
  isUploading = false;
  uploadError: string | null = null;

  constructor(private signatureStorageService: SignatureStorageService) {}

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
    this.signaturePad = new SimpleSignaturePad(canvas);

    // Eventos para detectar cuando se está dibujando
    this.signaturePad.addEventListener('endStroke', () => {
      this.isDrawing = false;
      this.isEmpty = this.signaturePad.empty;
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

  private async emitSignature() {
    if (this.isEmpty) {
      this.signatureChange.emit(null);
      return;
    }

    try {
      this.isUploading = true;
      this.uploadError = null;
      
      // Obtener la firma en base64
      const signatureBase64 = this.signaturePad.toDataURL('image/png');
      
      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const fileName = `signature_${this.userId || 'user'}_${timestamp}.png`;
      
      // Subir a Supabase Storage
      const publicUrl = await this.signatureStorageService.uploadSignature(signatureBase64, fileName);
      
      // Emitir la URL pública de Supabase
      this.signatureChange.emit(publicUrl);
      this.signatureUploaded.emit(publicUrl);
      
      console.log('Firma subida exitosamente a:', publicUrl);
      
    } catch (error) {
      console.error('Error subiendo firma a Supabase:', error);
      this.uploadError = 'Error subiendo la firma. Intente nuevamente.';
      
      // Fallback: emitir base64 si Supabase falla
      const dataURL = this.signaturePad.toDataURL('image/png');
      this.signatureChange.emit(dataURL);
      
    } finally {
      this.isUploading = false;
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
