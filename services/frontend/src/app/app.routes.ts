import { Routes } from '@angular/router';
import { RegistroActivoComponent } from './registro-activo/registro-activo.component';

export const routes: Routes = [
  { path: '', redirectTo: 'registro-activo', pathMatch: 'full' },
  { path: 'registro-activo', component: RegistroActivoComponent },
];
