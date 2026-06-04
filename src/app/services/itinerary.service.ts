import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  scheduledTime: number;
  supplierName: string;
  supplierPhone: string;
  addedBy: string;
  addedAt: string;
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
}
