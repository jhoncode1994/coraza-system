import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getApiBaseUrl } from '../config/api.config';

export interface RetiredAssociate {
  id?: number;
  associate_id: number;
  nombre: string;
  apellido: string;
  cedula: string;
  zona: number;
  telefono?: string;
  email?: string;
  retired_date: Date;
  retired_reason?: string;
  retired_by: number;
  original_creation_date?: Date;
}

export interface RetiredSupplyHistory {
  id?: number;
  retired_associate_id: number;
  original_delivery_id?: number;
  elemento: string;
  cantidad: number;
  delivered_at: Date;
  signature_data?: string;
  observaciones?: string;
  retired_at: Date;
}

@Injectable({
  providedIn: 'root'
})
export class RetiredAssociatesService {
  private apiUrl = getApiBaseUrl();

  constructor(private http: HttpClient) {}

  // Retirar un asociado
  retireAssociate(associateId: number, retiredReason: string, retiredBy?: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/associates/${associateId}/retire`, {
      retiredReason: retiredReason || 'Retiro solicitado'
    });
  }

  // Obtener todos los asociados retirados
  getRetiredAssociates(): Observable<RetiredAssociate[]> {
    return this.http.get<RetiredAssociate[]>(`${this.apiUrl}/retired-associates`);
  }

  // Obtener historial de un asociado retirado
  getRetiredAssociateHistory(retiredAssociateId: number): Observable<RetiredSupplyHistory[]> {
    return this.http.get<RetiredSupplyHistory[]>(`${this.apiUrl}/retired-associates/${retiredAssociateId}/history`);
  }

  // Buscar asociado retirado por cédula
  findRetiredAssociateByCedula(cedula: string): Observable<RetiredAssociate> {
    return this.http.get<RetiredAssociate>(`${this.apiUrl}/retired-associates/search/${cedula}`);
  }

  // Obtener estadísticas
  getRetiredAssociatesStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/retired-associates/stats`);
  }
}
