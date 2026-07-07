import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

export const WorkStatuses: { label: string, value: string }[] = [
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'Offered', value: 'OFFERED' },
  { label: 'In Prep', value: 'IN_PREP' },
  { label: 'Accepted', value: 'ACCEPTED' },
  { label: 'Reminder', value: 'REMINDER' },
  { label: 'Ready', value: 'READY' },
  { label: 'Started', value: 'STARTED' },
  { label: 'Ended', value: 'ENDED' },
  { label: 'Closed', value: 'CLOSED' },
  { label: 'Paid Date', value: 'PAID_DATE' },
];

export const GuideWorkStatuses: { label: string, value: string }[] = [
  { label: 'Offered', value: 'OFFERED' },
  { label: 'Accepted', value: 'ACCEPTED' },
  { label: 'Started', value: 'STARTED' },
  { label: 'Ended', value: 'ENDED' },
];

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
  page: number;
  size: number;
  totalAdultCount: number;
  totalChildCount: number;
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

export interface WorkDetailForGuideType {
  workId: number,
  status: string,
  tourDate: string,
  tourStartTime: string,
  tourEndTime: string,
  durationMinutes: number,
  locationAddress: string,
  agentName: string,
  resellerName: string,
  ref1: string,
  ref2: string,
  serviceName: string
}

export interface SpecialRequest {
  id: number;
  code: string;
  label: string;
}

export interface WorkOrder {
  orderId: number;
  reseller: string;
  originalAgent: string;
  ref1: string;
  totalFeeAmount: number;
  childCount: number;
  adultCount: number;
  status: string;
  specialRequests: SpecialRequest[];
}

export interface WorkOrderForGuide {
  orderId: number,
  contactName: string,
  ref1: string,
  ref2: string,
  isPrivate: true,
  adultCount: number,
  childCount: number,
  totalFeeAmount: number,
  status: string,
  notes: string,
  tourDate: string,
  tourStartTime: string,
  tourEndTime: string,
  serviceName: string,
}

export interface OrderGuest {
  id: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  age: number;
  gender: string;
  allergies: string | null;
  specialOccasion: string | null;
  dietaryRestrictions: string | null;
}

export interface OrderGuestGroup {
  orderId: number;
  adultCount: number;
  childCount: number;
  guestGroupNotes: string;
  leaderPhone: string;
  averageAge: number;
  guests: OrderGuest[];
}

export interface WorkGuide {
  id: number;
  guideId: number;
  name: string;
  phone: string;
  role: string;
  isCalendarInvitation: boolean;
  note?: string;
  status: string;
  isEditNote?: boolean;
}

export interface WorkFilter {
  resellerId?: number;
  ref?: string;
  personInChargeId?: number;
  areaId?: number;
  serviceName?: string;
  guideName?: string;
  status?: string;
  tourDate?: string;
  fromDate?: string;
  toDate?: string;
  isPrivate?: boolean;
  isShared?: boolean;
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

  getWorks(page: number, size: number, filters: WorkFilter): Observable<PageResponse<WorkOrder>> {
    let params = new HttpParams({
      fromObject: {
        page: page.toString(),
        size: size.toString(),
      },
    });

    Object.entries(filters).forEach(([key, value]) => {
      const stringValue = String(value).trim();
      if (
        value == null ||
        stringValue === '0' ||
        stringValue === '' ||
        stringValue === 'undefined' ||
        stringValue === 'null'
      ) {
        return;
      }

      params = params.set(key, stringValue);
    });

    return this.http.get<PageResponse<WorkOrder>>(
      `${this.apiUrl}/works`,
      {
        ...this.getHttpOptions(),
        params,
      }
    );
  }

  getWorkDetail(workId: number): Observable<WorkDetailType> {
    return this.http.get<WorkDetailType>(`${this.apiUrl}/works/${workId}`);
  }

  getWorkDetailForGuide(workId: number): Observable<WorkDetailForGuideType> {
    return this.http.get<WorkDetailForGuideType>(`${this.apiUrl}/guide/work/${workId}`);
  }

  getWorkOrders(workId: number, status: string): Observable<WorkOrder[]> {
    return this.http.get<WorkOrder[]>(`${this.apiUrl}/works/${workId}/orders?status=${status}`);
  }

  getWorkOrdersForGuide(workId: number): Observable<WorkOrderForGuide[]> {
    return this.http.get<WorkOrderForGuide[]>(`${this.apiUrl}/guide/work/${workId}/orders`);
  }

  getWorkGuides(workId: number): Observable<WorkGuide[]> {
    return this.http.get<WorkGuide[]>(`${this.apiUrl}/works/${workId}/guides`);
  }

  updateWorkStatus(workId: number, status: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/works/${workId}/status`, { status });
  }

  getOrderGuests(workId: number): Observable<OrderGuestGroup[]> {
    return this.http.get<OrderGuestGroup[]>(`${this.apiUrl}/guide/work/${workId}/guests`);
  }
}
