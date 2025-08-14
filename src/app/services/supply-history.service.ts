import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SupplyHistoryService {
  private apiUrl = 'https://renderdesboard.onrender.com/api/employees';

  constructor(private http: HttpClient) {}

  getHistory(employeeId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${employeeId}/supply-history`);
  }
}
