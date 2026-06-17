import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ItineraryStatus } from '../views/works/add-stop/add-stop';

export interface ItineraryStopItem {
  id: number;
  description: string;
  status: string;
  estimatedDurationMinutes: number;
  specialNotes: string;
  stopSequence: number;
  supplierId: number;
  itineraryId: number;
  stopType: string;
  scheduledTime: string;
  supplierName: string;
  supplierPhone: string;
  addedBy: string;
  createdAt: string;
}

export interface CreateItineraryStopRequest {
  workId: number;
  supplierId: number | null;
  serviceId: number;
  stopType: string;
  scheduledTime: string;
  specialNotes: string;
  status: string;
  addedBy: string;
  otherName?: string;
}

export interface CreateItineraryStopResponse {
  id: number;
  itineraryId: number;
  supplierId: number;
  stopType: string;
  status: string;
}

@Injectable({
  providedIn: 'root',
})
export class ItineraryService {
  private readonly apiUrl = environment.apiUrl || '/api';

  constructor(private http: HttpClient) {}

  private getHttpOptions() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    };
  }

  getItineraryStopsByWorkId(workId: number): Observable<ItineraryStopItem[]> {
    return this.http.get<ItineraryStopItem[]>(
      `${this.apiUrl}/itineraries/stops/by-work?workId=${workId}`,
      this.getHttpOptions(),
    );
  }

  createItineraryStop(data: CreateItineraryStopRequest): Observable<CreateItineraryStopResponse> {
    return this.http.post<CreateItineraryStopResponse>(
      `${this.apiUrl}/itineraries/stops`,
      data,
      this.getHttpOptions(),
    );
  }

  updateItineraryStopStatus(id: number, status: ItineraryStatus) {
    return this.http.patch<any>(
      `${this.apiUrl}/itineraries/stops/${id}/status`,
      { status },
      this.getHttpOptions(),
    );
  };
}
