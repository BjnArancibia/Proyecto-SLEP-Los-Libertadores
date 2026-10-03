import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";

export const authGuard: CanActivateFn = () => {
  // Obtener instancia de servicio de autenticación
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.estaAutenticado()) {
    return true;
  }

  // No hay sesión -> bloqueamos y redirigimos al login
  return router.createUrlTree(["/login"]);
};

export const publicGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.estaAutenticado()) {
    return true;
  }

  // Ya tiene sesión ->  mandamos directo al panel principal
  return router.createUrlTree(["/registro-activo"]);
};
