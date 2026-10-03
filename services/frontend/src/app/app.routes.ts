import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegistroActivoComponent } from './registro-activo/registro-activo.component';
import { authGuard, publicGuard } from './guards/auth.guard';

/*
  app.routes.ts — Definición de rutas de la aplicación

  Flujo de acceso según el estado de sesión:
    · Sin sesión → Solo puede acceder a /login (publicGuard)
    · Con sesión → No puede volver a /login (publicGuard lo desvía)
    · Con sesión → Puede acceder a /registro-activo (authGuard lo permite)
    · Sin sesión → No puede acceder a /registro-activo (authGuard lo bloquea)
*/
export const routes: Routes = [
  // Ruta raíz: redirige al login por defecto
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Pantalla de autenticación (RF-01)
  // publicGuard: si ya hay sesión activa, redirige al panel y evita mostrar el login de nuevo
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [publicGuard],
  },

  // Panel principal — protegido por authGuard
  // authGuard: si no hay sesión activa, redirige al login antes de cargar el componente
  {
    path: 'registro-activo',
    component: RegistroActivoComponent,
    canActivate: [authGuard],
  },

  // Ruta comodín: cualquier URL desconocida redirige al login
  { path: '**', redirectTo: 'login' },
];

