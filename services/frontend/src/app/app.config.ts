import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, HttpInterceptorFn } from '@angular/common/http';

import { routes } from './app.routes';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('auth_token') : null;
  if (token && !token.startsWith('mock-token')) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  return next(req);
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
