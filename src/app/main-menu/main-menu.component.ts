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
    console.log('Funcionalidad de limpieza estará disponible próximamente');
    // Temporalmente deshabilitado mientras se solucionan problemas de build
    /*
    const dialogRef = this.dialog.open(CleanupRegistrosComponent, {
      width: '800px',
      maxHeight: '90vh',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Limpieza completada:', result);
      }
    });
    */
  }
}
