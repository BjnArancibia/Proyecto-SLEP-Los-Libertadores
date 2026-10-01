import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from "@angular/forms";
import { HttpClient } from "@angular/common/http";
import { RegistroActivoTemplate } from "./registro-activo.template";

@Component({
  selector: "app-registro-activo",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./registro-activo.component.html",
  styleUrls: ["./registro-activo.component.css"],
})
export class RegistroActivoComponent extends RegistroActivoTemplate implements OnInit {
  activoForm!: FormGroup;
  apiUrl = 'http://127.0.0.1:8000/api/activos';

  currentUser = {
    initials: "JP",
    name: "Juan Pérez",
    role: "Administrador",
  };

  navItems = [
    { label: "Panel", icon: "ti ti-layout-dashboard", active: false },
    { label: "Activos Fijos", icon: "ti ti-package", active: true },
    { label: "Bodega", icon: "ti ti-building-warehouse", active: false },
    { label: "Solicitudes", icon: "ti ti-arrow-transfer-up", active: false },
    { label: "Aprobaciones", icon: "ti ti-checklist", active: false },
    { label: "Bitácora", icon: "ti ti-clipboard-list", active: false },
  ];

  constructor(private fb: FormBuilder, private http: HttpClient) {
    super();
  }

  ngOnInit(): void {
    this.activoForm = this.fb.group({
      numero_patrimonial: ['', Validators.required],
      numero_serie: [''],
      nombre: ['', Validators.required],
      marca_modelo: [''],
      establecimiento: ['Bodega central SLEP', Validators.required],
      dependencia: [''],
      custodio: ['']
    });
  }

  setActiveNav(selectedLabel: string) {
    this.navItems.forEach((item) => {
      item.active = item.label === selectedLabel;
    });
  }

  guardarActivo() {
    if (this.activoForm.invalid) {
      alert("Por favor complete todos los campos obligatorios.");
      return;
    }

    const payload = {
      ...this.activoForm.value,
      dependencia_sala: this.activoForm.value.dependencia,
      estado_conservacion: this.estadoSeleccionado,
      categoria_sugerida_ia: "Equipos computacionales — Notebooks y portátiles"
    };

    this.http.post(this.apiUrl, payload).subscribe({
      next: (res: any) => {
        alert("Activo guardado exitosamente!");
        this.activoForm.reset({
          establecimiento: 'Bodega central SLEP'
        });
      },
      error: (err) => {
        alert("Error al guardar activo: " + (err.error?.message || "Error desconocido"));
      }
    });
  }
}
