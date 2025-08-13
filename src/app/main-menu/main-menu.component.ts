import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.scss'],
  standalone: true,
  imports: [MatButtonModule]
})
export class MainMenuComponent {
  constructor(private router: Router) {}

  goToUsers() {
    this.router.navigate(['/users']);
  }
}
