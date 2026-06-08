import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CapabilityService } from '../services/capability.service';
import { AuthService } from '../services/auth.service';

export const permissionGuard: CanActivateFn = (route) => {
  const capability = inject(CapabilityService);
  const auth = inject(AuthService);
  const router = inject(Router);

  const required = route.data['permissions'] as string[] | undefined;
  if (!required?.length) {
    return true;
  }

  if (required.some((permission) => capability.can(permission))) {
    return true;
  }

  return router.createUrlTree([auth.homeRoute()]);
};
