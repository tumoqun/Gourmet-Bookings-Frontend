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

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  last: boolean;
  size: number;
  number: number;
  sort: Sort;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

export interface Sort {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

export interface Service {
  serviceId: number;
  serviceName: string;
  areaId: number;
  areaName: string;
}

export interface Guide {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  avatar: string;
  isActive: boolean;
  role: string;
}

export interface WorkOrder {
  id: number;
  workNumber: string;
  status: string;
  tourDate: string;
  orders: Order[];
  guides: Guide[];
}

export interface Order {
  id: number;
  orderNumber: string;
  adultCount: number;
  childCount: number;
  ref1: string;
  resellerId: number;
  resellerName: string;
  picContactId: number;
  picName: string;
  isPrivate: boolean;
  services: Service[];
}

export interface WorkDetailType {
  id: number;
  workNumber: string;
  status: string;
  tourDate: string;
  tourStartTime: string;
  tourEndTime: string;
  duration: number;
  locationAddress: string;
  locationName: string;
  orderId: number;
  adultCount: number;
  childCount: number;
  isPrivate: boolean;
  serviceId: number;
  serviceName: string;
  areaId: number;
  areaName: string;
}

export interface WorkOrder {
  orderId: number;
  reseller: string;
  originalAgent: string;
  ref1: string;
  totalFeeAmount: string;
  childCount: number;
  adultCount: number;
  special?: string;
  specialIcon?: string;
  specialNote?: string;
  specialLink?: string;
  status: string;
}

export interface WorkGuide {
  name: string;
  phone: string;
  role: string;
  isCalendarInvitation: boolean;
  rejectionReason?: string;
  status: string;
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

  getWorks(page: number, size: number): Observable<PageResponse<WorkOrder>> {
    return this.http.get<PageResponse<WorkOrder>>(
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

  getWorkDetail(workId: number): Observable<WorkDetailType> {
    return this.http.get<WorkDetailType>(`${this.apiUrl}/works/${workId}`);
  }

  getWorkOrders(workId: number): Observable<WorkOrder[]> {
    return this.http.get<WorkOrder[]>(`${this.apiUrl}/works/${workId}/orders`);
  }

  getWorkGuides(workId: number): Observable<WorkGuide[]> {
    return this.http.get<WorkGuide[]>(`${this.apiUrl}/works/${workId}/guides`);
  }
}
