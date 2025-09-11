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

export interface ElementSelectionData {
  elements: { value: string, viewValue: string }[];
  title: string;
}

@Component({
  selector: 'app-element-selection-dialog',
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
      <mat-icon>inventory_2</mat-icon>
      {{ data.title }}
    </h2>
    
    <mat-dialog-content>
      <div class="selection-container">
        <p class="instruction">
          Busque y seleccione el elemento para generar el reporte:
        </p>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Buscar elemento</mat-label>
          <input 
            matInput 
            [formControl]="elementControl"
            [matAutocomplete]="auto"
            placeholder="Escriba el nombre del elemento">
          <mat-icon matSuffix>search</mat-icon>
          
          <mat-autocomplete #auto="matAutocomplete" [displayWith]="displayFn">
            <mat-option *ngFor="let element of filteredElements | async" [value]="element">
              <div class="element-option">
                <mat-icon>inventory_2</mat-icon>
                <span>{{ element.viewValue }}</span>
              </div>
            </mat-option>
          </mat-autocomplete>
        </mat-form-field>
        
        <div class="selected-info" *ngIf="selectedElement">
          <mat-icon color="primary">check_circle</mat-icon>
          <div class="info-content">
            <strong>Elemento seleccionado:</strong>
            <p>{{ selectedElement.viewValue }}</p>
          </div>
        </div>
      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">
        <mat-icon>close</mat-icon>
        Cancelar
      </button>
      <button mat-raised-button color="primary" (click)="onConfirm()" [disabled]="!selectedElement">
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
    
    .element-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
    }
    
    .element-option mat-icon {
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
export class ElementSelectionDialogComponent implements OnInit {
  elementControl = new FormControl();
  filteredElements: Observable<any[]>;
  selectedElement: any = null;

  constructor(
    public dialogRef: MatDialogRef<ElementSelectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ElementSelectionData
  ) {
    this.filteredElements = this.elementControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || ''))
    );
  }

  ngOnInit() {
    // Escuchar cambios en la selección
    this.elementControl.valueChanges.subscribe(value => {
      if (value && typeof value === 'object') {
        this.selectedElement = value;
      } else {
        this.selectedElement = null;
      }
    });
  }

  private _filter(value: string | any): any[] {
    if (typeof value === 'object') {
      return this.data.elements;
    }

    const filterValue = value.toString().toLowerCase();
    
    return this.data.elements.filter(element => 
      element.viewValue.toLowerCase().includes(filterValue) ||
      element.value.toLowerCase().includes(filterValue)
    );
  }

  displayFn(element: any): string {
    return element ? element.viewValue : '';
  }

  onConfirm(): void {
    if (this.selectedElement) {
      this.dialogRef.close(this.selectedElement.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
