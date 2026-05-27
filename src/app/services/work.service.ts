import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Work {
  id: number;
  workNumber: string;
  status: string;
  tourDate: string;
  orderId: number;
  orderNumber: string;
  adultCount: number;
  childCount: number;
  resellerId: number;
  resellerName: string;
  picContactId: number;
  picName: string;
  isPrivate: boolean;
  serviceId: number;
  serviceName: string;
  areaId: number;
  areaName: string;
  ref1: string;
  guide: string;
}

export interface WorkListResponse {
  content: Work[];
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  number: number;
  size: number;
  numberOfElements: number;
  empty: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class WorkService {
  private readonly apiUrl = environment.apiUrl || '/api';

  constructor(private http: HttpClient) {}

  private getHttpOptions() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    };
  }

  getWorks(page: number, size: number): Observable<WorkListResponse> {
    return this.http.get<WorkListResponse>(
      `${this.apiUrl}/works?page=${page}&size=${size}`,
      this.getHttpOptions(),
    );
  }

  getGuestSummary(): Observable<{
    totalAdults: number;
    totalChildren: number;
  }> {
    return this.http.get<{
      totalAdults: number;
      totalChildren: number;
    }>(`${this.apiUrl}/works/guests`);
  }
}
