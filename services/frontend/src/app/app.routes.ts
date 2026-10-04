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

  // Panel principal — protegido por authGuard
  {
    path: "registro-activo",
    component: RegistroActivoComponent,
    canActivate: [authGuard],
  },

  // Redirección si se accede a flujo-aprobacion directamente
  {
    path: "flujo-aprobacion",
    redirectTo: "registro-activo",
    pathMatch: "full",
  },

  // Ruta comodín: cualquier URL desconocida redirige al login
  { path: "**", redirectTo: "login" },
];
