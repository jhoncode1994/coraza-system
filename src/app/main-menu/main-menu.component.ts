import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule, 
    MatIconModule,
    MatMenuModule,
    MatToolbarModule
  ]
})
export class MainMenuComponent {
  currentUser$ = this.authService.currentUser$;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  goToUsers() {
    this.router.navigate(['/users']);
  }

  goToInventory() {
    this.router.navigate(['/supply-inventory']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
