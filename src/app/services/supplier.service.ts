import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export const SupplierTypes = {
  STANDARD: 'STANDARD',
  OTHER: 'OTHER',
  ADDITIONAL: 'ADDITIONAL'
}

export interface SupplierSelectOption {
  id: number;
  name: string;
  supplierType: string;
}

@Injectable({
  providedIn: 'root',
})
export class SupplierService {
  private readonly apiUrl = environment.apiUrl || '/api';

  constructor(private http: HttpClient) {}

  private getHttpOptions() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    };
  }

  getSuppliersForService(serviceId: number, workId: number, type: string): Observable<SupplierSelectOption[]> {
    return this.http.get<SupplierSelectOption[]>(
      `${this.apiUrl}/services/${serviceId}/suppliers?workId=${workId}&supplierType=${type}`,
      this.getHttpOptions(),
    );
  }
}
