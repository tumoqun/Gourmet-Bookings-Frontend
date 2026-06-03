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
}
