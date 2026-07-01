import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { WorkStatuses } from './work.service';

export interface GuideAssignment {
  assignmentId: number;
  assignmentStatus: string;
  durationMinutes: number;
  orderCount: number;
  resellerName: string;
  serviceName: string;
  totalAdultCount: number;
  totalChildCount: number;
  totalFeeAmount: number;
  tourDate: string;
  tourEndTime: string;
  tourStartTime: string;
  workId: number;
  workStatus: string;
}

export interface GuideFilter {
  requestedDate?: string,
  status?: string;
  isNewOffered?: boolean;
}

@Injectable({ providedIn: 'root' })
export class GuidePortalService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private getHttpOptions() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    };
  }

  getAssignments(filters: GuideFilter): Observable<GuideAssignment[]> {
    if (filters.isNewOffered) {
      filters.status = 'offered';
      // delete filters.isNewOffered;
    }
    let params = new HttpParams({
      fromObject: {},
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
    return this.http.get<GuideAssignment[]>(`${this.apiUrl}/guide/assignments`, {
      ...this.getHttpOptions(),
      params,
    });
  }

  acceptAssignment(id: number): Observable<GuideAssignment> {
    return this.http.post<GuideAssignment>(`${this.apiUrl}/guide/assignments/${id}/accept`, {
      ...this.getHttpOptions(),
    });
  }

  rejectAssignment(id: number, reason?: string): Observable<GuideAssignment> {
    return this.http.post<GuideAssignment>(
      `${this.apiUrl}/guide/assignments/${id}/reject`,
      { reason },
      { ...this.getHttpOptions() },
    );
  }

  startWork(id: number): Observable<GuideAssignment> {
    return this.http.post<GuideAssignment>(
      `${this.apiUrl}/guide/assignments/${id}/start-work`,
      {},
      { ...this.getHttpOptions() },
    );
  }

  endWork(id: number): Observable<GuideAssignment> {
    return this.http.post<GuideAssignment>(
      `${this.apiUrl}/guide/assignments/${id}/end-work`,
      {},
      { ...this.getHttpOptions() },
    );
  }
}
