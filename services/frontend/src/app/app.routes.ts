import { Routes } from "@angular/router";
import { LoginComponent } from "./login/login.component";
import { RegistroActivoComponent } from "./registro-activo/registro-activo.component";
import { authGuard, publicGuard } from "./guards/auth.guard";

export const routes: Routes = [
  // Ruta raíz: redirige al login por defecto
  { path: "", redirectTo: "login", pathMatch: "full" },

  // Pantalla de autenticación (RF-01)
  {
    path: "login",
    component: LoginComponent,
    canActivate: [publicGuard],
  },

  // Panel principal y Activos Fijos (RF-02) — protegido por authGuard
  {
    path: "registro-activo",
    component: RegistroActivoComponent,
    canActivate: [authGuard],
  },

  // Control de Stock y Kardex de Bodega en Tiempo Real (RF-04)
  {
    path: "bodega",
    component: RegistroActivoComponent,
    canActivate: [authGuard],
  },
  {
    path: "kardex",
    redirectTo: "bodega",
    pathMatch: "full",
  },

  // Flujo Electrónico de Aprobaciones con Segregación de Funciones (RF-03)
  {
    path: "aprobaciones",
    component: RegistroActivoComponent,
    canActivate: [authGuard],
  },
  {
    path: "flujo-aprobacion",
    redirectTo: "aprobaciones",
    pathMatch: "full",
  },

  // Panel general / Dashboard
  {
    path: "panel",
    component: RegistroActivoComponent,
    canActivate: [authGuard],
  },

  // Módulo de Solicitudes
  {
    path: "solicitudes",
    component: RegistroActivoComponent,
    canActivate: [authGuard],
  },

  // Módulo de Bitácora y Auditoría
  {
    path: "bitacora",
    component: RegistroActivoComponent,
    canActivate: [authGuard],
  },

  // Ruta comodín: cualquier URL desconocida redirige al login
  { path: "**", redirectTo: "login" },
];
