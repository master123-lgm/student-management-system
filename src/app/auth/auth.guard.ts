import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { UserRole } from './auth.model';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

export const dashboardRedirectGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  return router.createUrlTree([authService.getDashboardRoute()]);
};

export const roleGuard =
  (allowedRoles: UserRole[]): CanActivateFn =>
    () => {
      const authService = inject(AuthService);
      const router = inject(Router);

      if (!authService.isAuthenticated()) {
        return router.createUrlTree(['/login']);
      }

      const currentRole = authService.role();

      if (currentRole && allowedRoles.includes(currentRole)) {
        return true;
      }

      return router.createUrlTree([authService.getDashboardRoute()]);
    };
