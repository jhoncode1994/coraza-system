import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

export interface AssociateSelectionData {
  associates: any[];
  title: string;
}

@Component({
  selector: 'app-associate-selection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
    MatOptionModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>person_search</mat-icon>
      {{ data.title }}
    </h2>
    
    <mat-dialog-content>
      <div class="selection-container">
        <p class="instruction">
          Busque y seleccione el asociado por nombre, apellido o número de cédula:
        </p>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Buscar asociado</mat-label>
          <input 
            matInput 
            [formControl]="associateControl"
            [matAutocomplete]="auto"
            placeholder="Escriba el nombre, apellido o cédula">
          <mat-icon matSuffix>search</mat-icon>
          
          <mat-autocomplete #auto="matAutocomplete" [displayWith]="displayFn">
            <mat-option *ngFor="let associate of filteredAssociates | async" [value]="associate">
              <div class="associate-option">
                <div class="associate-main">
                  <strong>{{ associate.nombre }} {{ associate.apellido }}</strong>
                </div>
                <div class="associate-details">
                  <span class="cedula">Cédula: {{ associate.cedula }}</span>
                  <span class="zona" *ngIf="associate.zona">Zona: {{ associate.zona }}</span>
                </div>
              </div>
            </mat-option>
          </mat-autocomplete>
        </mat-form-field>
        
        <div class="selected-info" *ngIf="selectedAssociate">
          <mat-icon color="primary">check_circle</mat-icon>
          <div class="info-content">
            <strong>Asociado seleccionado:</strong>
            <p>{{ selectedAssociate.nombre }} {{ selectedAssociate.apellido }}</p>
            <p class="cedula-info">Cédula: {{ selectedAssociate.cedula }}</p>
            <p class="zona-info" *ngIf="selectedAssociate.zona">Zona: {{ selectedAssociate.zona }}</p>
          </div>
        </div>
      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">
        <mat-icon>close</mat-icon>
        Cancelar
      </button>
      <button mat-raised-button color="primary" (click)="onConfirm()" [disabled]="!selectedAssociate">
        <mat-icon>download</mat-icon>
        Generar Reporte
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .selection-container {
      min-width: 450px;
      max-width: 600px;
      padding: 16px 0;
    }
    
    .instruction {
      margin-bottom: 20px;
      color: #666;
      font-size: 14px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .associate-option {
      padding: 8px 0;
    }
    
    .associate-main {
      font-size: 16px;
      margin-bottom: 4px;
    }
    
    .associate-details {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: #666;
    }
    
    .selected-info {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-top: 20px;
      padding: 16px;
      background-color: #f0f8ff;
      border: 1px solid #e3f2fd;
      border-radius: 8px;
    }
    
    .info-content {
      flex: 1;
    }
    
    .info-content strong {
      color: #1976d2;
    }
    
    .info-content p {
      margin: 4px 0;
    }
    
    .cedula-info, .zona-info {
      font-size: 14px;
      color: #666;
    }
    
    mat-dialog-content {
      overflow: visible;
    }
    
    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #1976d2;
    }
  `]
})
export class AssociateSelectionDialogComponent implements OnInit {
  associateControl = new FormControl();
  filteredAssociates: Observable<any[]>;
  selectedAssociate: any = null;

  constructor(
    public dialogRef: MatDialogRef<AssociateSelectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssociateSelectionData
  ) {
    this.filteredAssociates = this.associateControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || ''))
    );
  }

  ngOnInit() {
    // Escuchar cambios en la selección
    this.associateControl.valueChanges.subscribe(value => {
      if (value && typeof value === 'object') {
        this.selectedAssociate = value;
      } else {
        this.selectedAssociate = null;
      }
    });
  }

  private _filter(value: string | any): any[] {
    if (typeof value === 'object') {
      return this.data.associates;
    }

    const filterValue = value.toString().toLowerCase();
    
    return this.data.associates.filter(associate => {
      const fullName = `${associate.nombre} ${associate.apellido}`.toLowerCase();
      const cedula = associate.cedula.toString().toLowerCase();
      
      return fullName.includes(filterValue) || 
             cedula.includes(filterValue) ||
             associate.nombre.toLowerCase().includes(filterValue) ||
             associate.apellido.toLowerCase().includes(filterValue);
    });
  }

  displayFn(associate: any): string {
    return associate ? `${associate.nombre} ${associate.apellido} (${associate.cedula})` : '';
  }

  onConfirm(): void {
    if (this.selectedAssociate) {
      this.dialogRef.close(this.selectedAssociate);
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
