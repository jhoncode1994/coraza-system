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
import { NgIf, DatePipe, AsyncPipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, firstValueFrom } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { UsersService } from './users.service';
import { HistoryDialogComponent } from './history-dialog.component';
import { EntregaConTallasDialogComponent } from '../entrega-con-tallas-dialog/entrega-con-tallas-dialog.component';
import { User as UserInterface } from '../../interfaces/user.interface';
import { EntregaDotacionService } from '../../services/entrega-dotacion.service';
import { HttpClient } from '@angular/common/http';
import { SupplyInventoryService } from '../../services/supply-inventory.service';
import { RetiredAssociatesService } from '../../services/retired-associates.service';
import { RetireAssociateDialogComponent } from '../retire-associate-dialog/retire-associate-dialog.component';
import { AuthService } from '../../services/auth.service';

export interface User {
  id: number;
  nombre: string;
  apellido: string;
  cedula: string;
  zona: number;
  fechaIngreso: Date | string;
  cargo?: string;
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
    FormsModule,
    CommonModule,
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
  
  // Propiedades para verificar permisos
  get canEditAssociates(): boolean {
    return this.authService.canEditAssociates();
  }
  
  get canViewAssociates(): boolean {
    return this.authService.hasPermission('canViewAssociates');
  }
  
  get canMakeDeliveries(): boolean {
    return this.authService.canMakeDeliveries();
  }
  
  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }
  filteredUsers: User[] = [];
  searchTerm: string = '';
  editIndex: number | null = null;
  displayedColumns: string[] = ['nombre', 'apellido', 'cedula', 'zona', 'cargo', 'fechaIngreso', 'actions'];
  
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
    private supplyInventoryService: SupplyInventoryService,
    private retiredAssociatesService: RetiredAssociatesService,
    private http: HttpClient,
    public authService: AuthService
  ) {
    // Configurar el adaptador de fechas para usar el formato español
    this.dateAdapter.setLocale('es-ES');
    this.userForm = this.fb.group({
      nombre: ['', [Validators.required]],
      apellido: ['', [Validators.required]],
      cedula: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      zona: [null, [Validators.required, Validators.pattern('^[0-9]+$')]],
      fechaIngreso: ['', [Validators.required]],
      cargo: ['', [Validators.required]]
    });
  }
  
  ngOnInit(): void {
    // Suscribirse a los cambios de usuarios desde el servicio
    this.userSubscription = this.usersService.users$.subscribe(users => {
      this.users = users;
      this.filteredUsers = users; // Inicializar la lista filtrada
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
    this.filteredUsers = this.users; // Actualizar la lista filtrada
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
      
      // Procesar la fecha SIN conversión a UTC (evitar problema de zona horaria)
      let fechaIngreso;
      const valorFecha = this.userForm.value.fechaIngreso;
      
      console.log('🔍 DEBUG FECHA INICIAL:', {
        valor: valorFecha,
        tipo: typeof valorFecha,
        esDate: valorFecha instanceof Date
      });
      
      if (valorFecha instanceof Date) {
        // Es un objeto Date del datepicker
        const year = valorFecha.getFullYear();
        const month = String(valorFecha.getMonth() + 1).padStart(2, '0');
        const day = String(valorFecha.getDate()).padStart(2, '0');
        fechaIngreso = `${year}-${month}-${day}`;
        
        console.log('📅 Procesado como Date:', {
          year, month, day,
          resultado: fechaIngreso
        });
      } else if (typeof valorFecha === 'string') {
        // Es string - puede ser YYYY-MM-DD o formato ISO
        if (valorFecha.includes('T')) {
          // Formato ISO, extraer solo fecha
          fechaIngreso = valorFecha.split('T')[0];
          console.log('📅 String ISO detectado:', fechaIngreso);
        } else if (valorFecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Ya está en formato YYYY-MM-DD
          fechaIngreso = valorFecha;
          console.log('📅 String YYYY-MM-DD directo:', fechaIngreso);
        } else {
          // Intentar parsear - AGREGAR HORARIO MEDIO DÍA para evitar problema zona horaria
          const parts = valorFecha.split('-');
          if (parts.length === 3) {
            fechaIngreso = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
          } else {
            // Crear Date con hora 12:00 para evitar problema de zona
            const date = new Date(valorFecha + 'T12:00:00');
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            fechaIngreso = `${year}-${month}-${day}`;
          }
          console.log('📅 String parseado con mediodía:', fechaIngreso);
        }
      } else {
        // Fecha actual como fallback
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        fechaIngreso = `${year}-${month}-${day}`;
        console.log('📅 Usando fecha actual:', fechaIngreso);
      }
      
      console.log('✅ FECHA FINAL A ENVIAR:', fechaIngreso);
      
      const userData = {
        nombre: this.userForm.value.nombre,
        apellido: this.userForm.value.apellido,
        cedula: this.userForm.value.cedula,
        zona: parseInt(this.userForm.value.zona), // Asegurar que zona sea número
        fechaIngreso: fechaIngreso,
        cargo: this.userForm.value.cargo
      };
      
      console.log('Datos procesados para enviar:', userData);
      
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
              let errorMessage = 'Error al actualizar usuario';
              
              // Extraer mensaje específico del error
              if (error?.error?.error) {
                errorMessage = error.error.error;
              } else if (error?.message) {
                errorMessage = error.message;
              }
              
              this.snackBar.open(errorMessage, 'Cerrar', {
                duration: 5000,
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
            let errorMessage = 'Error al agregar usuario';
            
            // Extraer mensaje específico del error
            if (error?.error?.error) {
              errorMessage = error.error.error;
            } else if (error?.message) {
              errorMessage = error.message;
            }
            
            this.snackBar.open(errorMessage, 'Cerrar', {
              duration: 5000,
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

  editUser(user: User) {
    // Buscar el índice real del usuario en el array completo por ID
    const realIndex = this.users.findIndex(u => u.id === user.id);
    
    if (realIndex === -1) {
      console.error('Usuario no encontrado:', user);
      this.snackBar.open('Error: Usuario no encontrado', 'Cerrar', { duration: 3000 });
      return;
    }
    
    this.editIndex = realIndex;
    // Reset del formulario antes de cargarlo con datos nuevos para evitar conflictos
    this.userForm.reset();
    
    // Asegurarse de que la fecha es un objeto Date para el datepicker
    const fechaIngreso = user.fechaIngreso instanceof Date 
      ? user.fechaIngreso 
      : new Date(user.fechaIngreso);
      
    // Cargar los datos del usuario a editar en el formulario
    this.userForm.patchValue({
      nombre: user.nombre,
      apellido: user.apellido,
      cedula: user.cedula,
      zona: user.zona,
      fechaIngreso: fechaIngreso,
      cargo: user.cargo
    });
    
    console.log('✏️ Editando usuario:', user);
    console.log('  - ID:', user.id);
    console.log('  - Índice real en array:', realIndex);
    this.showForm = true; // Mostrar el formulario al editar
  }

  retireUser(user: User) {
    if (user && user.id) {
      // Abrir diálogo de confirmación para retirar asociado
      const dialogRef = this.dialog.open(RetireAssociateDialogComponent, {
        width: '600px',
        data: {
          associate: {
            id: user.id,
            nombre: user.nombre,
            apellido: user.apellido,
            cedula: user.cedula
          }
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result && result.confirmed) {
          // Procesar retiro del asociado
          this.retiredAssociatesService.retireAssociate(
            user.id!, 
            result.reason || 'Retiro solicitado'
          ).subscribe({
            next: () => {
              console.log('Asociado retirado exitosamente');
              this.snackBar.open('Asociado retirado exitosamente', 'Cerrar', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              
              // Recargar la lista de usuarios
              this.usersService.loadUsers();
              
              // Si estábamos editando este usuario, limpiar el formulario
              const userIndex = this.users.findIndex(u => u.id === user.id);
              if (this.editIndex === userIndex) {
                this.editIndex = null;
                this.userForm.reset();
                this.showForm = false;
              }
            },
            error: (error) => {
              console.error('Error al retirar asociado:', error);
              this.snackBar.open('Error al retirar asociado', 'Cerrar', {
                duration: 3000,
                panelClass: ['error-snackbar']
              });
            }
          });
        }
      });
    } else {
      console.error('Asociado no encontrado o sin ID');
      this.snackBar.open('Error: Asociado no encontrado', 'Cerrar', {
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
    // Convertir el User local al formato esperado por el dialog
    const userData: UserInterface = {
      id: user.id,
      nombres: user.nombre,
      apellidos: user.apellido,
      cedula: user.cedula,
      email: user.cedula + '@empresa.com', // Valor temporal
      cargo: user.cargo,
      area: user.zona?.toString(),
      fechaIngreso: typeof user.fechaIngreso === 'string' ? user.fechaIngreso : user.fechaIngreso.toISOString(),
      activo: true
    };

    const dialogRef = this.dialog.open(EntregaConTallasDialogComponent, {
      width: '1000px',
      maxWidth: '95vw',
      minHeight: '600px',
      maxHeight: '90vh',
      data: userData
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        // Procesar la entrega con tallas
        this.procesarEntregaConTallas(user, result);
      }
    });
  }

  private async procesarEntregaDotacion(user: User, entrega: any) {
    try {
      // Primero validar que hay stock suficiente para todos los elementos
      console.log('Iniciando validación de stock para:', entrega.elementos);
      
      for (const elemento of entrega.elementos) {
        try {
          const validation = await firstValueFrom(
            this.supplyInventoryService.validateStock(elemento.elemento, elemento.cantidad)
          );
          
          if (!validation.valid) {
            this.snackBar.open(
              `Stock insuficiente para ${elemento.elemento.toUpperCase()}. Disponible: ${validation.availableQuantity}, Solicitado: ${elemento.cantidad}`,
              'Cerrar',
              {
                duration: 5000,
                panelClass: ['error-snackbar']
              }
            );
            return; // Cancelar toda la operación si falla alguna validación
          }
        } catch (error) {
          console.error(`Error validando stock para ${elemento.elemento}:`, error);
          this.snackBar.open(
            `Error al validar stock para ${elemento.elemento.toUpperCase()}`,
            'Cerrar',
            {
              duration: 5000,
              panelClass: ['error-snackbar']
            }
          );
          return;
        }
      }

      // Si todas las validaciones pasaron, proceder con los descuentos
      console.log('Todas las validaciones pasaron, procediendo con descuentos...');
      
      for (const elemento of entrega.elementos) {
        try {
          const success = await firstValueFrom(
            this.supplyInventoryService.decreaseStock(elemento.elemento, elemento.cantidad)
          );
          
          if (!success) {
            this.snackBar.open(
              `Error al actualizar stock para ${elemento.elemento.toUpperCase()}`,
              'Cerrar',
              {
                duration: 5000,
                panelClass: ['error-snackbar']
              }
            );
            return;
          }
          
          // Crear el registro de entrega para el historial
          const registroEntrega = {
            userId: user.id,
            elemento: elemento.elemento,
            talla: elemento.talla,
            genero: elemento.genero,
            cantidad: elemento.cantidad,
            fechaEntrega: entrega.fechaEntrega,
            observaciones: entrega.observaciones || '',
            tipo: 'entrega' as const,
            firma_url: entrega.firma_url // Incluir la URL de la firma digital
          };

          // Guardar cada entrega usando el servicio (ahora con Observable)
          try {
            await firstValueFrom(this.entregaDotacionService.addEntrega(registroEntrega));
            console.log(`Entrega guardada exitosamente: ${elemento.elemento}`);
          } catch (entregaError) {
            console.error(`Error al guardar entrega para ${elemento.elemento}:`, entregaError);
            this.snackBar.open(
              `Error al guardar entrega para ${elemento.elemento.toUpperCase()}`,
              'Cerrar',
              {
                duration: 5000,
                panelClass: ['error-snackbar']
              }
            );
            return;
          }
          
        } catch (error) {
          console.error(`Error al procesar descuento para ${elemento.elemento}:`, error);
          this.snackBar.open(
            `Error al procesar descuento para ${elemento.elemento.toUpperCase()}`,
            'Cerrar',
            {
              duration: 5000,
              panelClass: ['error-snackbar']
            }
          );
          return;
        }
      }
      
      console.log('Entrega múltiple procesada exitosamente:', entrega);
      
      // Crear mensaje de resumen
      const elementosTexto = entrega.elementos.map((el: any) => `${el.cantidad} ${el.elemento}(s)`).join(', ');
      
      // Mostrar mensaje de éxito
      this.snackBar.open(
        `✅ Entrega exitosa para ${user.nombre} ${user.apellido}: ${elementosTexto}. Stock actualizado.`,
        'Cerrar',
        {
          duration: 6000,
          panelClass: ['success-snackbar']
        }
      );
      
    } catch (error) {
      console.error('Error general al procesar entrega:', error);
      this.snackBar.open(
        'Error inesperado al procesar la entrega',
        'Cerrar',
        {
          duration: 5000,
          panelClass: ['error-snackbar']
        }
      );
    }
  }

  private async procesarEntregaConTallas(user: User, entregaData: any) {
    try {
      console.log('Procesando entrega con tallas:', entregaData);
      
      // Iterar sobre cada elemento de la entrega
      for (const elemento of entregaData.elementos) {
        const registroEntrega = {
          userId: user.id,
          elemento: elemento.categoria,
          talla: elemento.talla || null,
          genero: elemento.genero || null,
          cantidad: elemento.cantidad,
          fechaEntrega: new Date(),
          observaciones: entregaData.observaciones || '',
          tipo: 'entrega' as const,
          firma_url: entregaData.firma_url
        };

        try {
          // Registrar la entrega en el servicio
          await firstValueFrom(this.entregaDotacionService.addEntrega(registroEntrega));
          
          // Actualizar el inventario (reducir stock)
          // El backend debería manejar esto automáticamente
          console.log('Entrega registrada exitosamente:', registroEntrega);
          
        } catch (error) {
          console.error('Error registrando elemento:', error);
          throw error;
        }
      }

      // Mostrar mensaje de éxito
      const elementosTexto = entregaData.elementos
        .map((el: any) => `${el.cantidad} ${el.categoria}${el.talla ? ` (${el.talla})` : ''}`)
        .join(', ');
      
      this.snackBar.open(
        `✅ Entrega exitosa para ${user.nombre} ${user.apellido}: ${elementosTexto}. Stock actualizado.`,
        'Cerrar',
        { duration: 5000 }
      );

    } catch (error) {
      console.error('Error procesando entrega:', error);
      this.snackBar.open(
        '❌ Error al procesar la entrega. Intente nuevamente.',
        'Cerrar',
        { duration: 5000 }
      );
    }
  }

  // Métodos para la funcionalidad de búsqueda
  filterUsers(): void {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.filteredUsers = this.users;
      return;
    }

    const searchValue = this.searchTerm.trim().toLowerCase();
    this.filteredUsers = this.users.filter(user => 
      user.cedula.toLowerCase().includes(searchValue)
    );
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredUsers = this.users;
  }

}
