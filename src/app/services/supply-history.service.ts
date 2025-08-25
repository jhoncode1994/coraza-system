import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getApiBaseUrl } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class SupplyHistoryService {
  private apiUrl = `${getApiBaseUrl()}/associates`;

  constructor(private http: HttpClient) {}

  getHistory(associateId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${associateId}/supply-history`);
  }
}
