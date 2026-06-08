import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthUser, LoginRequest, LoginResponse } from '../models/auth.model';

const TOKEN_KEY = 'gb_auth_token';
const USER_KEY = 'gb_auth_user';
const VIEW_MODE_KEY = 'gb_view_mode';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = environment.apiUrl;

  readonly currentUser = signal<AuthUser | null>(this.loadUser());
  readonly tourGuideViewMode = signal<boolean>(this.loadViewMode());

  login(request: LoginRequest): Observable<LoginResponse> {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    this.currentUser.set(null);

    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, request).pipe(
      tap((response) => {
        sessionStorage.setItem(TOKEN_KEY, response.token);
        sessionStorage.setItem(USER_KEY, JSON.stringify(response.user));
        this.currentUser.set(response.user);
      }),
    );
  }

  logout(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(VIEW_MODE_KEY);
    this.currentUser.set(null);
    this.tourGuideViewMode.set(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) {
      return true;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as { exp?: number };
      if (!payload.exp) {
        return true;
      }
      return payload.exp * 1000 <= Date.now();
    } catch {
      return true;
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.currentUser() && !this.isTokenExpired();
  }

  handleSessionExpired(): void {
    sessionStorage.setItem('gb_session_expired', '1');
    this.logout();
  }

  me(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.apiUrl}/auth/me`).pipe(
      tap((user) => {
        sessionStorage.setItem(USER_KEY, JSON.stringify(user));
        this.currentUser.set(user);
      }),
    );
  }

  homeRoute(): string {
    const user = this.currentUser();
    if (!user) {
      return '/login';
    }
    if (user.role === 'GUIDE') {
      return '/guide';
    }
    if (this.tourGuideViewMode() && user.role === 'ADMIN') {
      return '/guide';
    }
    return '/orders';
  }

  navigateHome(): void {
    this.router.navigate([this.homeRoute()]);
  }

  setTourGuideViewMode(enabled: boolean): void {
    this.tourGuideViewMode.set(enabled);
    if (enabled) {
      sessionStorage.setItem(VIEW_MODE_KEY, 'GUIDE');
    } else {
      sessionStorage.removeItem(VIEW_MODE_KEY);
    }
  }

  canSwitchTourGuideView(): boolean {
    const user = this.currentUser();
    return user?.role === 'ADMIN' || user?.role === 'MANAGER';
  }

  private loadUser(): AuthUser | null {
    const raw = sessionStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  private loadViewMode(): boolean {
    return sessionStorage.getItem(VIEW_MODE_KEY) === 'GUIDE';
  }
}
