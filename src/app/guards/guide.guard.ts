import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CapabilityService } from '../services/capability.service';
import { AuthService } from '../services/auth.service';

export const guideGuard: CanActivateFn = () => {
  const capability = inject(CapabilityService);
  const auth = inject(AuthService);
  const router = inject(Router);

  if (capability.isGuide()) {
    return true;
  }

  return router.createUrlTree([auth.homeRoute()]);
};
