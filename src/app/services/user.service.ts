import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Role {
  id: number;
  code: string;
  name: string;
}

export interface User {
  id?: number;
  fullName: string;
  email: string;
  role?: Role;
  isActive?: boolean;
  guideId?: number;
  salaryScaleKey?: string;
  resellerId?: number;
}

export interface UserRequest {
  fullName: string;
  email: string;
  role: string;
  salaryScaleKey?: string;
  resellerId?: number;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/users`;

  getUsers(page: number, size: number, search?: string): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<any>(this.apiUrl, { params });
  }

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  createUser(request: UserRequest): Observable<User> {
    return this.http.post<User>(this.apiUrl, request);
  }

  updateUser(id: number, request: UserRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, request);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  confirmPassword(payload: { token: string; password: string }): Observable<string> {
    console.log({ token: payload.token, password: payload.password });
    return this.http.post(`${this.apiUrl}/confirm-password`, payload, { responseType: 'text' });
  }

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}/roles`);
  }

  getSalaryScales(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/salary-scales`);
  }
}
