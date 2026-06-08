import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class CapabilityService {
  private readonly auth = inject(AuthService);

  can(permission: string): boolean {
    const user = this.auth.currentUser();
    return user?.permissions?.includes(permission) ?? false;
  }

  hasRole(role: string): boolean {
    return this.auth.currentUser()?.role === role;
  }

  isAdmin(): boolean {
    const role = this.auth.currentUser()?.role;
    return role === 'ADMIN' || role === 'MANAGER';
  }

  isAgent(): boolean {
    return this.auth.currentUser()?.role === 'AGENT';
  }

  isGuide(): boolean {
    return this.auth.currentUser()?.role === 'GUIDE';
  }
}
