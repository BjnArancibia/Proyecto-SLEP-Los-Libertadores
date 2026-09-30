import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RegistroActivoTemplate } from "./registro-activo.template";

@Component({
  selector: "app-registro-activo",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./registro-activo.component.html",
  styleUrls: ["./registro-activo.component.css"],
})
export class RegistroActivoComponent extends RegistroActivoTemplate {
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

  setActiveNav(selectedLabel: string) {
    this.navItems.forEach((item) => {
      item.active = item.label === selectedLabel;
    });
  }
}
