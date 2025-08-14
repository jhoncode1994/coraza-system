import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.scss'],
  standalone: true,
  imports: [MatButtonModule, MatIconModule]
})
export class MainMenuComponent {
  constructor(private router: Router) {}

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  goToUsers() {
    this.router.navigate(['/users']);
  }

  goToInventory() {
    this.router.navigate(['/inventory']);
  }

  goToReports() {
    this.router.navigate(['/reports']);
  }
}
