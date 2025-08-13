import { Component, OnInit, OnDestroy } from '@angular/core';
import { 
  FormBuilder, 
  FormGroup, 
  Validators, 
  FormControl, 
  FormGroupDirective, 
  NgForm,
  ReactiveFormsModule
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_FORMATS, DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { NgIf, DatePipe, AsyncPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { UsersService } from './users.service';

export interface User {
  id: number;
  nombre: string;
  apellido: string;
  cedula: string;
  zona: number;
  fechaIngreso: Date | string;
}

/** Error when invalid control is dirty, touched, or submitted. */
export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    NgIf,
    DatePipe
  ],
  providers: [
    MatDatepickerModule,
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
    { 
      provide: MAT_DATE_FORMATS, 
      useValue: {
        parse: {
          dateInput: 'DD/MM/YYYY',
        },
        display: {
          dateInput: 'DD/MM/YYYY',
          monthYearLabel: 'MMM YYYY',
          dateA11yLabel: 'DD/MM/YYYY',
          monthYearA11yLabel: 'MMMM YYYY',
        }
      }
    }
  ],
  animations: [
    trigger('formAnimation', [
      state('void', style({
        opacity: 0,
        transform: 'translateY(-20px)'
      })),
      transition(':enter', [
        animate('300ms ease-out', style({
          opacity: 1,
          transform: 'translateY(0)'
        }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({
          opacity: 0,
          transform: 'translateY(-20px)'
        }))
      ])
    ])
  ]
})
export class UsersComponent implements OnInit {
  userForm: FormGroup;
  users: User[] = [];
  editIndex: number | null = null;
  displayedColumns: string[] = ['nombre', 'apellido', 'cedula', 'zona', 'fechaIngreso', 'actions'];
  
  // Variable para controlar la visibilidad del formulario
  showForm: boolean = false;
  
  // Suscripción a los cambios en los usuarios
  private userSubscription!: Subscription;
  
  // Fecha inicial para el datepicker (hoy)
  startDate = new Date();
  
  // Error state matcher para mostrar errores de forma instantánea
  matcher = new MyErrorStateMatcher();

  constructor(
    private fb: FormBuilder,
    private usersService: UsersService,
    private dateAdapter: DateAdapter<Date>
  ) {
    // Configurar el adaptador de fechas para usar el formato español
    this.dateAdapter.setLocale('es-ES');
    this.userForm = this.fb.group({
      nombre: ['', [Validators.required]],
      apellido: ['', [Validators.required]],
      cedula: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      zona: [null, [Validators.required, Validators.pattern('^[0-9]+$')]],
      fechaIngreso: ['', [Validators.required]]
    });
  }
  
  ngOnInit(): void {
    // Suscribirse a los cambios de usuarios desde el servicio
    this.userSubscription = this.usersService.users$.subscribe(users => {
      this.users = users;
    });
    
    // Cargar los usuarios iniciales
    this.loadUsers();
  }
  
  ngOnDestroy(): void {
    // Limpiar suscripciones al destruir el componente
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
  
  // Método para cargar usuarios del servicio
  loadUsers(): void {
    // El servicio ahora maneja la carga de usuarios automáticamente
    this.usersService.loadUsers();
  }

  // Método para mostrar el formulario
  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.cancelEdit();
    }
  }

  // Método para cancelar la edición y ocultar el formulario
  cancelEdit() {
    this.editIndex = null;
    this.userForm.reset();
  }

  addUser() {
    if (this.userForm.valid) {
      console.log('Formulario válido', this.userForm.value);
      
      // Asegurarse de que la fecha de ingreso sea un objeto Date
      const userData = {
        ...this.userForm.value,
        fechaIngreso: this.userForm.value.fechaIngreso instanceof Date 
          ? this.userForm.value.fechaIngreso 
          : new Date(this.userForm.value.fechaIngreso)
      };
      
      if (this.editIndex !== null && this.users[this.editIndex]) {
        const userId = this.users[this.editIndex].id;
        
        // Actualizar usuario existente usando el servicio (ahora retorna Observable)
        this.usersService.updateUser(userId, userData).subscribe({
          next: (updatedUser) => {
            console.log('Usuario actualizado:', updatedUser);
            this.editIndex = null;
            this.userForm.reset();
            this.showForm = false;
          },
          error: (error) => {
            console.error('Error al actualizar usuario:', error);
            // Aquí podrías mostrar un mensaje de error
          }
        });
      } else {
        // Agregar nuevo usuario usando el servicio (ahora retorna Observable)
        this.usersService.addUser(userData).subscribe({
          next: (newUser) => {
            console.log('Usuario agregado:', newUser);
            this.userForm.reset();
            this.showForm = false;
          },
          error: (error) => {
            console.error('Error al agregar usuario:', error);
            // Aquí podrías mostrar un mensaje de error
          }
        });
      }
    } else {
      console.log('Formulario inválido', this.userForm.errors);
      
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.userForm.controls).forEach(field => {
        const control = this.userForm.get(field);
        control?.markAsTouched();
        
        // Muestra los errores específicos para ayudar en la depuración
        if (control?.invalid) {
          console.log(`Campo ${field} inválido:`, control.errors);
        }
      });
    }
  }

  editUser(index: number) {
    this.editIndex = index;
    // Reset del formulario antes de cargarlo con datos nuevos para evitar conflictos
    this.userForm.reset();
    
    // Asegurarse de que la fecha es un objeto Date para el datepicker
    const user = this.users[index];
    const fechaIngreso = user.fechaIngreso instanceof Date 
      ? user.fechaIngreso 
      : new Date(user.fechaIngreso);
      
    // Cargar los datos del usuario a editar en el formulario
    this.userForm.patchValue({
      nombre: user.nombre,
      apellido: user.apellido,
      cedula: user.cedula,
      zona: user.zona,
      fechaIngreso: fechaIngreso
    });
    
    console.log('Editando usuario:', this.users[index]);
    this.showForm = true; // Mostrar el formulario al editar
  }

  deleteUser(index: number) {
    if (index >= 0 && this.users[index]) {
      const userId = this.users[index].id;
      
      // Eliminar usuario usando el servicio (ahora retorna Observable)
      this.usersService.deleteUser(userId).subscribe({
        next: (deletedUser) => {
          console.log('Usuario eliminado:', deletedUser);
          
          if (this.editIndex === index) {
            this.editIndex = null;
            this.userForm.reset();
            this.showForm = false;
          }
        },
        error: (error) => {
          console.error('Error al eliminar usuario:', error);
          // Aquí podrías mostrar un mensaje de error
        }
      });
    }
  }
}
