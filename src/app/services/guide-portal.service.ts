import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface GuideAssignment {
  id: number;
  workId: number;
  workNumber?: string;
  guideId: number;
  guideName?: string;
  status: string;
  acceptedAt?: string;
  tourStartedAt?: string;
  tourEndedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class GuidePortalService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getAssignments(): Observable<GuideAssignment[]> {
    return this.http.get<GuideAssignment[]>(`${this.apiUrl}/guide/assignments`);
  }

  acceptAssignment(id: number): Observable<GuideAssignment> {
    return this.http.post<GuideAssignment>(`${this.apiUrl}/guide/assignments/${id}/accept`, {});
  }

  rejectAssignment(id: number, reason?: string): Observable<GuideAssignment> {
    return this.http.post<GuideAssignment>(`${this.apiUrl}/guide/assignments/${id}/reject`, { reason });
  }

  startWork(id: number): Observable<GuideAssignment> {
    return this.http.post<GuideAssignment>(`${this.apiUrl}/guide/assignments/${id}/start-work`, {});
  }

  endWork(id: number): Observable<GuideAssignment> {
    return this.http.post<GuideAssignment>(`${this.apiUrl}/guide/assignments/${id}/end-work`, {});
  }
}
