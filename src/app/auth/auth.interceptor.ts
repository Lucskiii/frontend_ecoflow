import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  const setHeaders: Record<string, string> = {
    'ngrok-skip-browser-warning': 'true'
  };

  if (token) {
    setHeaders['Authorization'] = `Bearer ${token}`;
  }

  return next(
    request.clone({
      setHeaders
    })
  );
};
