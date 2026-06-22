import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { MOCK_ORDERS } from './mock-orders.data';

export interface OrderGuest {
  id?: number;
  firstName?: string;
  lastName?: string;
  guestType?: string;
  isVip?: boolean;
  age?: number;
  gender?: string;
  nationality?: string;
  phoneNumber?: string;
  allergies?: string;
  specialOccasion?: string;
}

export interface Order {
  id?: number;
  orderNumber: string;
  status?: OrderStatus;
  orderChannel?: string;
  isTentative?: boolean;
  isPrivate?: boolean;
  createdByUser?: User;
  createdByName?: string;
  reseller?: Reseller;
  picContact?: ResellerContact;
  picEmail?: string;
  copyEmail?: string;
  originalAgent?: Agent;
  ref1?: string;
  ref2?: string;
  voucherNumber?: string;
  guestEmail?: string;
  leaderPhone?: string;
  guestGroupNotes?: string;
  adultCount?: number;
  childCount?: number;
  dietaryRestrictions?: string;
  currencyCode?: string;
  totalFeeAmount?: number;
  requestedAt?: string;
  submittedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  orderServices?: OrderService[];
  additionalServices?: OrderAdditionalService[];
  specialRequests?: SpecialRequestType[];
  financialLines?: OrderFinancialLine[];
  guests?: OrderGuest[];
  guide?: string;
}

export interface OrderStatus {
  id: number;
  code: string;
  label: string;
}

export interface User {
  id: number;
  role: Role;
  fullName: string;
  email: string;
  isActive: boolean;
}

export interface Role {
  id: number;
  code: string;
  name: string;
}

export interface Reseller {
  id: number;
  name: string;
  status: string;
}

export interface ResellerContact {
  id: number;
  reseller: Reseller;
  name: string;
  email: string;
  phoneNumber?: string;
  isPrimary: boolean;
}

export interface Agent {
  id: number;
  reseller: Reseller;
  name: string;
  email: string;
}

export interface OrderService {
  id?: number;
  service: Service;
  serviceNameSnapshot: string;
  area: Area;
  serviceType: ServiceType;
  targetDate?: string;
  startTime?: string;
  timeSlotCode?: string;
  timezone?: string;
  isAdminModified?: boolean;
  originalServiceId?: number;
  originalServiceNameSnapshot?: string;
}

export interface OrderAdditionalService {
  id?: number;
  kind: string;
  isEnabled: boolean;
  location?: string;
  handoffText?: string;
  vehicleType?: string;
  serviceType?: ServiceType;
  distanceBand?: DistanceBand;
  suggestedTime?: string;
  feeAmount?: number;
  currencyCode?: string;
}

export interface SpecialRequestType {
  id: number;
  code: string;
  label: string;
}

export interface OrderFinancialLine {
  id: number;
  lineType: string;
  description?: string;
  amount?: number;
  taxAmount?: number;
  currencyCode?: string;
  isTaxIncluded: boolean;
}

export interface Service {
  id: number;
  area: Area;
  serviceType: ServiceType;
  name: string;
  isPrivateAvailable: boolean;
  isActive: boolean;
  durationMinutes: number;
}

export interface Allotment {
  id: number;
  serviceId: number;
  serviceDate: string;
  startTime: string;
  capacityTotal: number;
  reservedTotal: number;
  availableTotal: number;
  status: string;
}

export interface Area {
  id: number;
  code: string;
  name: string;
}

export interface ServiceType {
  id: number;
  code: string;
  name: string;
}

export interface DistanceBand {
  id: number;
  label: string;
  sortOrder: number;
  feeAmount: number;
}

export interface OrderCreateRequest {
  orderNumber: string;
  orderChannel?: string;
  isTentative?: boolean;
  isPrivate?: boolean;
  createdByName?: string;
  picEmail?: string;
  copyEmail?: string;
  ref1?: string;
  ref2?: string;
  voucherNumber?: string;
  guestEmail?: string;
  adultCount?: number;
  childCount?: number;
  dietaryRestrictions?: string;
  currencyCode?: string;
  totalFeeAmount?: number;
  requestedAt?: string;
  orderServices?: OrderServiceRequest[];
  additionalServices?: OrderAdditionalServiceRequest[];
  specialRequestTypeIds?: number[];
}

export interface OrderServiceRequest {
  serviceId: number;
  serviceNameSnapshot?: string;
  areaId: number;
  serviceTypeId: number;
  targetDate?: string;
  startTime?: string;
  timeSlotCode?: string;
  timezone?: string;
}

export interface OrderAdditionalServiceRequest {
  kind: string;
  isEnabled?: boolean;
  location?: string;
  handoffText?: string;
  vehicleType?: string;
  serviceTypeId?: number;
  distanceBandId?: number;
  suggestedTime?: string;
  feeAmount?: number;
  currencyCode?: string;
}

export interface OfferCreateRequest {
  serviceId?: number;
  targetDate?: string;
  startTime?: string;
  netPrice?: number;
  discountPercent?: number;
  discountAmount?: number;
  puDoFee?: number;
  commissionPercent?: number;
  commissionAmount?: number;
  subtotal?: number;
  estimatedTax?: number;
  totalAmount?: number;
  pricingNotes?: string;
  hostConfirmationRequired?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly apiUrl = environment.apiUrl || '/api';
  private readonly useMockData = environment.useMockData ?? false;

  constructor(private http: HttpClient) {}

  private getHttpOptions() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
  }

  // Order endpoints
  getOrders(): Observable<Order[]> {
    // if (this.useMockData) {
    //   console.warn('Using mock data for orders. Set useMockData to false in environment.ts when backend is ready.');
    //   return of(MOCK_ORDERS);
    // }
    return this.http.get<Order[]>(`${this.apiUrl}/orders`);
  }

  getSpecialRequestTypes(): Observable<SpecialRequestType[]> {
    return this.http.get<SpecialRequestType[]>(`${this.apiUrl}/special-requests`);
  }

  getOrder(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/orders/${id}`);
  }

  getOrderByNumber(orderNumber: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/orders/number/${orderNumber}`);
  }

  getOrdersByStatus(statusId: number): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders/status/${statusId}`);
  }

  getOrdersByReseller(resellerId: number): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders/reseller/${resellerId}`);
  }

  createOrder(order: OrderCreateRequest): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/orders`, order, this.getHttpOptions());
  }

  updateOrder(id: number, order: Partial<Order>): Observable<Order> {
    return this.http.put<Order>(`${this.apiUrl}/orders/${id}`, order, this.getHttpOptions());
  }

  updateOrderGuests(id: number, guests: OrderGuest[]): Observable<OrderGuest[]> {
    return this.http.put<OrderGuest[]>(`${this.apiUrl}/orders/${id}/guests`, guests, this.getHttpOptions());
  }

  deleteOrder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/orders/${id}`);
  }

  submitOrder(id: number): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/orders/${id}/submit`, {}, this.getHttpOptions());
  }

  cancelOrder(id: number, note?: string): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/orders/${id}/cancel`, note || '', this.getHttpOptions());
  }

  sendOffer(id: number, request: OfferCreateRequest): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/orders/${id}/offer`, request, this.getHttpOptions());
  }

  confirmOrder(id: number): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/orders/${id}/confirm`, {}, this.getHttpOptions());
  }

  // Service endpoints
  getServices(): Observable<Service[]> {
    return this.http.get<Service[]>(`${this.apiUrl}/services`);
  }

  getAreas(): Observable<Area[]> {
    return this.http.get<Area[]>(`${this.apiUrl}/services/areas`);
  }

  getServiceTypes(): Observable<ServiceType[]> {
    return this.http.get<ServiceType[]>(`${this.apiUrl}/services/service-types`);
  }

  getDistanceBands(): Observable<DistanceBand[]> {
    return this.http.get<DistanceBand[]>(`${this.apiUrl}/services/distance-bands`);
  }

  getService(id: number): Observable<Service> {
    return this.http.get<Service>(`${this.apiUrl}/services/${id}`);
  }

  getServicesByArea(areaId: number): Observable<Service[]> {
    return this.http.get<Service[]>(`${this.apiUrl}/services/area/${areaId}`);
  }

  getServicesByType(serviceTypeId: number): Observable<Service[]> {
    return this.http.get<Service[]>(`${this.apiUrl}/services/type/${serviceTypeId}`);
  }

  getServicesByAreaAndType(areaId: number, serviceTypeId: number): Observable<Service[]> {
    return this.http.get<Service[]>(`${this.apiUrl}/services/area/${areaId}/type/${serviceTypeId}`);
  }

  getPrivateServices(): Observable<Service[]> {
    return this.http.get<Service[]>(`${this.apiUrl}/services/private`);
  }

  getAllotmentsByServiceAndDate(serviceId: number, serviceDate: string): Observable<Allotment[]> {
    return this.http.get<Allotment[]>(`${this.apiUrl}/allotments/service/${serviceId}/date/${serviceDate}`);
  }

  getAllotmentsByDate(serviceDate: string): Observable<Allotment[]> {
    return this.http.get<Allotment[]>(`${this.apiUrl}/allotments/date/${serviceDate}`);
  }

  createService(service: Partial<Service>): Observable<Service> {
    return this.http.post<Service>(`${this.apiUrl}/services`, service, this.getHttpOptions());
  }

  updateService(id: number, service: Partial<Service>): Observable<Service> {
    return this.http.put<Service>(`${this.apiUrl}/services/${id}`, service, this.getHttpOptions());
  }

  // Reseller and Agent endpoints
  getResellers(): Observable<Reseller[]> {
    return this.http.get<Reseller[]>(`${this.apiUrl}/resellers`);
  }

  getResellerContacts(): Observable<ResellerContact[]> {
    return this.http.get<ResellerContact[]>(`${this.apiUrl}/resellers/contacts`);
  }

  getAgents(): Observable<Agent[]> {
    return this.http.get<Agent[]>(`${this.apiUrl}/resellers/agents`);
  }
}
