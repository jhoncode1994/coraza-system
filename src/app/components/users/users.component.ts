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
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_FORMATS, DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgIf, DatePipe, AsyncPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { UsersService } from './users.service';
import { HistoryDialogComponent } from './history-dialog.component';
import { EntregaDotacionDialogComponent, EntregaDotacion } from './entrega-dotacion-dialog.component';
import { EntregaDotacionService } from '../../services/entrega-dotacion.service';
import { SupplyInventoryService } from '../../services/supply-inventory.service';

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
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
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
    private dateAdapter: DateAdapter<Date>,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private entregaDotacionService: EntregaDotacionService,
    private supplyInventoryService: SupplyInventoryService
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
    this.users = this.usersService.getUsers();
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
      
      if (this.editIndex !== null) {
        // Actualizar usuario existente usando el servicio
        const userId = this.users[this.editIndex]?.id;
        if (userId) {
          this.usersService.updateUser(userId, userData).subscribe({
            next: (updatedUser) => {
              console.log('Usuario actualizado:', updatedUser);
              this.snackBar.open('Usuario actualizado exitosamente', 'Cerrar', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.editIndex = null;
              this.userForm.reset();
              this.showForm = false;
            },
            error: (error) => {
              console.error('Error al actualizar usuario:', error);
              this.snackBar.open('Error al actualizar usuario', 'Cerrar', {
                duration: 3000,
                panelClass: ['error-snackbar']
              });
            }
          });
        } else {
          console.error('ID de usuario no encontrado');
          this.snackBar.open('Error: ID de usuario no encontrado', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      } else {
        // Agregar nuevo usuario usando el servicio
        this.usersService.addUser(userData).subscribe({
          next: (newUser) => {
            console.log('Usuario agregado:', newUser);
            this.snackBar.open('Usuario agregado exitosamente', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.userForm.reset();
            this.showForm = false;
          },
          error: (error) => {
            console.error('Error al agregar usuario:', error);
            this.snackBar.open('Error al agregar usuario', 'Cerrar', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    } else {
      console.log('Formulario inválido');
      this.snackBar.open('Por favor complete todos los campos requeridos', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
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
    const user = this.users[index];
    if (user && user.id) {
      // Eliminar usuario usando el servicio con el ID del usuario
      this.usersService.deleteUser(user.id).subscribe({
        next: (deletedUser) => {
          console.log('Usuario eliminado:', deletedUser);
          this.snackBar.open('Usuario eliminado exitosamente', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          
          // Si estábamos editando este usuario, limpiar el formulario
          if (this.editIndex === index) {
            this.editIndex = null;
            this.userForm.reset();
            this.showForm = false;
          }
        },
        error: (error) => {
          console.error('Error al eliminar usuario:', error);
          this.snackBar.open('Error al eliminar usuario', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      console.error('Usuario no encontrado o sin ID');
      this.snackBar.open('Error: Usuario no encontrado', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  verHistorial(user: User) {
    this.dialog.open(HistoryDialogComponent, {
      width: '600px',
      data: { user }
    });
  }

  entregarDotacion(user: User) {
    const dialogRef = this.dialog.open(EntregaDotacionDialogComponent, {
      width: '500px',
      data: { user }
    });

    dialogRef.afterClosed().subscribe((result: EntregaDotacion) => {
      if (result) {
        // Aquí procesaremos la entrega de dotación
        this.procesarEntregaDotacion(user, result);
      }
    });
  }

  private procesarEntregaDotacion(user: User, entrega: EntregaDotacion) {
    // Primero validar que hay stock suficiente
    this.supplyInventoryService.validateStock(entrega.elemento, entrega.cantidad).subscribe({
      next: (validation) => {
        if (!validation.valid) {
          this.snackBar.open(
            `Stock insuficiente. Disponible: ${validation.availableQuantity}, Solicitado: ${entrega.cantidad}`,
            'Cerrar',
            {
              duration: 5000,
              panelClass: ['error-snackbar']
            }
          );
          return;
        }

        // Si hay stock suficiente, proceder con el descuento
        this.supplyInventoryService.decreaseStock(entrega.elemento, entrega.cantidad).subscribe({
          next: (success) => {
            if (success) {
              // Crear el registro de entrega para el historial
              const registroEntrega = {
                userId: user.id,
                elemento: entrega.elemento,
                cantidad: entrega.cantidad,
                fechaEntrega: entrega.fechaEntrega,
                observaciones: entrega.observaciones,
                tipo: 'entrega' as const
              };

              // Guardar la entrega usando el servicio
              this.entregaDotacionService.addEntrega(registroEntrega);
              
              console.log('Entrega procesada y stock descontado:', registroEntrega);
              
              // Mostrar mensaje de éxito
              this.snackBar.open(
                `✅ Entrega exitosa: ${entrega.cantidad} ${entrega.elemento}(s) para ${user.nombre} ${user.apellido}. Stock actualizado.`,
                'Cerrar',
                {
                  duration: 6000,
                  panelClass: ['success-snackbar']
                }
              );
            } else {
              this.snackBar.open(
                'Error al actualizar el inventario',
                'Cerrar',
                {
                  duration: 3000,
                  panelClass: ['error-snackbar']
                }
              );
            }
          },
          error: (error) => {
            console.error('Error al descontar stock:', error);
            this.snackBar.open(
              'Error al procesar la entrega',
              'Cerrar',
              {
                duration: 3000,
                panelClass: ['error-snackbar']
              }
            );
          }
        });
      },
      error: (error) => {
        console.error('Error al validar stock:', error);
        this.snackBar.open(
          'Error al validar el inventario',
          'Cerrar',
          {
            duration: 3000,
            panelClass: ['error-snackbar']
          }
        );
      }
    });
  }
}
