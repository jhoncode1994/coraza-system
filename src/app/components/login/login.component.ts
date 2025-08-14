import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService, LoginCredentials } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule
  ]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  hidePassword = true;
  systemInfo = this.authService.getSystemInfo();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    // Si ya está autenticado, redirigir al dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const credentials: LoginCredentials = this.loginForm.value;

      this.authService.login(credentials).subscribe({
        next: (result) => {
          this.isLoading = false;
          
          if (result.success && result.user) {
            this.snackBar.open(`¡Bienvenido ${result.user.username}!`, 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.router.navigate(['/dashboard']);
          } else {
            this.snackBar.open(result.error || 'Error de autenticación', 'Cerrar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.snackBar.open('Error interno del sistema', 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          console.error('Login error:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  onForgotPassword() {
    this.snackBar.open(
      'Contacte al administrador del sistema para recuperar su contraseña', 
      'Cerrar', 
      {
        duration: 8000,
        panelClass: ['info-snackbar']
      }
    );
  }

  loadDemoCredentials() {
    this.loginForm.patchValue({
      username: 'admin',
      password: 'coraza2025'
    });
    
    this.snackBar.open('Credenciales de demo cargadas', 'Cerrar', {
      duration: 3000,
      panelClass: ['info-snackbar']
    });
  }

  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  // Getters para facilitar el acceso a los errores
  get usernameError() {
    const control = this.loginForm.get('username');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'El usuario es obligatorio';
    }
    return null;
  }

  get passwordError() {
    const control = this.loginForm.get('password');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'La contraseña es obligatoria';
    }
    return null;
  }
}
