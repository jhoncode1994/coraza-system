import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.scss'],
  standalone: true,
  imports: [MatButtonModule, MatIconModule]
})
export class MainMenuComponent {
  constructor(
    private router: Router,
    private dialog: MatDialog
  ) {}

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  goToUsers() {
    this.router.navigate(['/users']);
  }

  goToInventory() {
    this.router.navigate(['/inventory']);
  }

  goToRetiredAssociates() {
    this.router.navigate(['/retired-associates']);
  }

  openCleanupDialog() {
    // Mostrar un dialog simple con confirmación de eliminación
    const confirmation = confirm(
      '🗑️ SISTEMA DE LIMPIEZA MASIVA\n\n' +
      'Esta funcionalidad permite eliminar registros antiguos de entregas.\n\n' +
      '⚠️ CARACTERÍSTICAS:\n' +
      '• Protección automática - no elimina registros del último año\n' +
      '• Requiere escribir "ELIMINAR" para confirmar\n' +
      '• Elimina también las firmas digitales asociadas\n' +
      '• Proceso irreversible\n\n' +
      'Backend implementado ✅\n' +
      'Frontend en desarrollo 🚧\n\n' +
      '¿Desea continuar con el desarrollo de esta funcionalidad?'
    );
    
    if (confirmation) {
      alert('✅ Funcionalidad confirmada!\n\nEl sistema incluye:\n• Estadísticas por año/mes\n• Previsualización de eliminación\n• Confirmación con texto "ELIMINAR"\n• Eliminación masiva segura\n\n🔧 Próximamente disponible en el menú');
    }
  }
}
