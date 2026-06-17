import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";


export interface Guide {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  isActive: boolean;
  avatar?: string;
  role: string;
}

export interface AssignGuideRequest {
  workId: number;
  guideId: number;
  role: string;
  isCalendarInvitation: boolean;
  note?: string;
  status: string;
}

export interface UpdateAssignmentRequest {
  id: number;
  status?: string;
  note?: string;
  rejectionReason?: string;
}

@Injectable({
  providedIn: 'root',
})
export class GuideService {
  private readonly apiUrl = environment.apiUrl || '/api';

  constructor(private http: HttpClient) {}

  private getHttpOptions() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    };
  }

  getAvailableGuides(searchKeyword: string): Observable<Guide[]> {
    return this.http.get<Guide[]>(
      `${this.apiUrl}/guides/available?searchText=${searchKeyword}`,
      this.getHttpOptions(),
    );
  }

  getUnavailableGuides(searchKeyword: string): Observable<Guide[]> {
    return this.http.get<Guide[]>(
      `${this.apiUrl}/guides/unavailable?searchText=${searchKeyword}`,
      this.getHttpOptions(),
    );
  }

  assignGuideToWork(data: AssignGuideRequest): Observable<void> {
    const payload = {
      workId: data.workId,
      guideId: data.guideId,
      isCalendarInvitation: data.isCalendarInvitation,
      role: data.role,
      note: data.note || '',
      status: data.status,
    };
    return this.http.post<void>(`${this.apiUrl}/assignments`, payload, this.getHttpOptions());
  }

  updateAssignment(data: UpdateAssignmentRequest): Observable<void> {
    console.log('data', data);
    return this.http.put<void>(
      `${this.apiUrl}/assignments/${data.id}`,
      data,
      this.getHttpOptions(),
    );
  }
}
