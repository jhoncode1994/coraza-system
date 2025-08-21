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
import { EntregaDotacionDialogComponent, EntregaDotacion } from './entrega-dotacion-dialog.component';
import { EntregaDotacionService } from '../../services/entrega-dotacion.service';
import { PdfReportService } from '../../services/pdf-report.service';
import { HttpClient } from '@angular/common/http';
import { SupplyInventoryService } from '../../services/supply-inventory.service';
import { RetiredAssociatesService } from '../../services/retired-associates.service';
import { RetireAssociateDialogComponent } from '../retire-associate-dialog/retire-associate-dialog.component';

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
  filteredUsers: User[] = [];
  searchTerm: string = '';
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
    private supplyInventoryService: SupplyInventoryService,
    private retiredAssociatesService: RetiredAssociatesService,
    private pdfReportService: PdfReportService,
    private http: HttpClient
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
      
      // Procesar la fecha para asegurar el formato correcto
      let fechaIngreso;
      if (this.userForm.value.fechaIngreso instanceof Date) {
        // Formatear fecha como YYYY-MM-DD para PostgreSQL
        fechaIngreso = this.userForm.value.fechaIngreso.toISOString().split('T')[0];
      } else if (this.userForm.value.fechaIngreso) {
        // Si es string, convertir a Date y luego formatear
        const date = new Date(this.userForm.value.fechaIngreso);
        fechaIngreso = date.toISOString().split('T')[0];
      } else {
        fechaIngreso = new Date().toISOString().split('T')[0]; // Fecha actual como fallback
      }
      
      const userData = {
        nombre: this.userForm.value.nombre,
        apellido: this.userForm.value.apellido,
        cedula: this.userForm.value.cedula,
        zona: parseInt(this.userForm.value.zona), // Asegurar que zona sea número
        fechaIngreso: fechaIngreso
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

  retireUser(index: number) {
    const user = this.users[index];
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
              if (this.editIndex === index) {
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

  private async procesarEntregaDotacion(user: User, entrega: EntregaDotacion) {
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
              `Stock insuficiente para ${elemento.elemento}. Disponible: ${validation.availableQuantity}, Solicitado: ${elemento.cantidad}`,
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
            `Error al validar stock para ${elemento.elemento}`,
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
              `Error al actualizar stock para ${elemento.elemento}`,
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
            cantidad: elemento.cantidad,
            fechaEntrega: entrega.fechaEntrega,
            observaciones: entrega.observaciones || '',
            tipo: 'entrega' as const,
            firma: entrega.firma // Incluir la firma digital
          };

          // Guardar cada entrega usando el servicio (ahora con Observable)
          try {
            await firstValueFrom(this.entregaDotacionService.addEntrega(registroEntrega));
            console.log(`Entrega guardada exitosamente: ${elemento.elemento}`);
          } catch (entregaError) {
            console.error(`Error al guardar entrega para ${elemento.elemento}:`, entregaError);
            this.snackBar.open(
              `Error al guardar entrega para ${elemento.elemento}`,
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
            `Error al procesar descuento para ${elemento.elemento}`,
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
      const elementosTexto = entrega.elementos.map(el => `${el.cantidad} ${el.elemento}(s)`).join(', ');
      
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

  /**
   * Descarga el historial de entregas de un asociado específico en PDF
   */
  async downloadAssociatePDF(user: User): Promise<void> {
    try {
      // Mostrar mensaje de carga
      this.snackBar.open('Generando PDF...', '', { duration: 2000 });

      // Obtener datos del backend
      const response = await firstValueFrom(
        this.http.get<any>(`/api/delivery/associate/${user.id}/pdf-data`)
      );

      // Generar PDF
      await this.pdfReportService.generateAssociateDeliveryReport(
        response.associate.nombre,
        response.associate.cedula,
        response.deliveries
      );

      this.snackBar.open('PDF generado exitosamente', '', { duration: 3000 });
    } catch (error) {
      console.error('Error generando PDF del asociado:', error);
      this.snackBar.open('Error al generar el PDF', '', { duration: 3000 });
    }
  }

  /**
   * Descarga el reporte general de todos los elementos
   */
  async downloadGeneralElementsReport(): Promise<void> {
    try {
      // Mostrar mensaje de carga
      this.snackBar.open('Generando reporte general...', '', { duration: 2000 });

      // Obtener datos del backend
      const elementsSummary = await firstValueFrom(
        this.http.get<any[]>('/api/delivery/elements-summary/pdf-data')
      );

      // Generar PDF
      await this.pdfReportService.generateElementSummaryReport(elementsSummary);

      this.snackBar.open('Reporte general generado exitosamente', '', { duration: 3000 });
    } catch (error) {
      console.error('Error generando reporte general:', error);
      this.snackBar.open('Error al generar el reporte general', '', { duration: 3000 });
    }
  }
}
