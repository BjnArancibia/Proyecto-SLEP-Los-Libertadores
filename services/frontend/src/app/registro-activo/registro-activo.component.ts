import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegistroActivoTemplate } from './registro-activo.template';

@Component({
  selector: 'app-registro-activo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './registro-activo.component.html',
  styleUrls: ['./registro-activo.component.css']
})
export class RegistroActivoComponent extends RegistroActivoTemplate {
}
