import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const isLoginRequest = req.url.includes('/auth/login');

  if (!isLoginRequest && auth.isTokenExpired()) {
    auth.handleSessionExpired();
    return throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Session expired' }));
  }

  const token = auth.getToken();
  if (token && !isLoginRequest) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (!isLoginRequest && error.status === 401) {
        auth.handleSessionExpired();
      }
      return throwError(() => error);
    }),
  );
};
