import { Component, computed, signal, HostListener } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import {
  AuthService,
  Usuario,
  Rol,
} from "../services/auth.service";
import { MovimientosService } from "../services/movimientos.service";
import { SolicitudMovimiento } from "../models/movimiento.model";

// Componente principal para el flujo de aprobación de solicitudes
@Component({
  selector: "app-flujo-aprobacion",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./flujo-aprobacion.component.html",
  styleUrl: "./flujo-aprobacion.component.css",
})
export class FlujoAprobacionComponent {
  // Comentario o justificación ingresada por el aprobador
  comentarioResolucion = signal<string>("");

  mensajeFeedback = signal<{ tipo: "exito" | "error"; texto: string } | null>(
    null,
  );

  mostrarMenuUsuario = signal<boolean>(false);

  navItems = [
    { label: "Panel", icon: "ti ti-layout-dashboard", active: false },
    { label: "Activos Fijos", icon: "ti ti-package", active: false },
    { label: "Bodega", icon: "ti ti-building-warehouse", active: false },
    { label: "Solicitudes", icon: "ti ti-arrow-transfer-up", active: false },
    { label: "Aprobaciones", icon: "ti ti-checklist", active: true },
    { label: "Bitácora", icon: "ti ti-clipboard-list", active: false },
  ];

  readonly solicitudActual = computed<SolicitudMovimiento | undefined>(() => {
    return this.movimientosService.getSolicitudActual();
  });

  // Lista de todas las solicitudes para el selector de aprobaciones
  readonly todasSolicitudes = computed(() =>
    this.movimientosService.solicitudes(),
  );

  // Usuario actualmente autenticado
  readonly usuarioActual = computed<Usuario | null>(() =>
    this.authService.usuario(),
  );

  readonly currentUser = computed(() => {
    const user = this.usuarioActual();
    if (!user) {
      return { initials: "—", name: "Sin sesión", role: "Invitado", email: "" };
    }
    const rolLabels: Record<string, string> = {
      ADMIN: "Administrador",
      ENCARGADO_BODEGA: "Encargado de Bodega",
      SOLICITANTE: "Solicitante",
      APROBADOR: "Aprobador",
    };
    return {
      name: `${user.nombre} ${user.apellido}`,
      initials:
        `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`.toUpperCase(),
      role: rolLabels[user.rol] || user.rol,
      email: user.email,
    };
  });

  // Validación reactiva de permisos
  readonly validacionSegregacion = computed(() => {
    const solicitud = this.solicitudActual();
    const usuario = this.usuarioActual();
    if (!solicitud) return { puedeAprobar: false, esAutoaprobacion: false };
    return this.movimientosService.validarPermisoAprobacion(solicitud, usuario);
  });

  constructor(
    private authService: AuthService,
    private movimientosService: MovimientosService,
    private router: Router,
  ) {}

  seleccionarSolicitud(id: string): void {
    this.movimientosService.seleccionarSolicitud(id);
    this.comentarioResolucion.set("");
  }

  //Aprobar solicitud
  aprobar(): void {
    const solicitud = this.solicitudActual();
    const usuario = this.usuarioActual();
    if (!solicitud || !usuario) return;

    const res = this.movimientosService.aprobarSolicitud(
      solicitud.id,
      this.comentarioResolucion(),
      usuario,
    );

    if (res.exito) {
      this.mostrarFeedback("exito", res.mensaje);
      this.comentarioResolucion.set("");
    } else {
      this.mostrarFeedback("error", res.mensaje);
    }
  }

  //Rechazar solicitud
  rechazar(): void {
    const solicitud = this.solicitudActual();
    const usuario = this.usuarioActual();
    if (!solicitud || !usuario) return;

    const res = this.movimientosService.rechazarSolicitud(
      solicitud.id,
      this.comentarioResolucion(),
      usuario,
    );

    if (res.exito) {
      this.mostrarFeedback("exito", res.mensaje);
      this.comentarioResolucion.set("");
    } else {
      this.mostrarFeedback("error", res.mensaje);
    }
  }

  // Ejecución física en bodega (para rol ENCARGADO_BODEGA o ADMIN)
  ejecutarEnBodega(): void {
    const solicitud = this.solicitudActual();
    const usuario = this.usuarioActual();
    if (!solicitud || !usuario) return;

    const res = this.movimientosService.ejecutarEnBodega(solicitud.id, usuario);
    if (res.exito) {
      this.mostrarFeedback("exito", res.mensaje);
    } else {
      this.mostrarFeedback("error", res.mensaje);
    }
  }

  // Reiniciar solicitudes (disponible para cualquier rol, inmediato sin bloqueos)
  reiniciarSolicitudes(): void {
    this.movimientosService.reiniciarSolicitudes();
    this.comentarioResolucion.set("");
    this.mostrarFeedback(
      "exito",
      "Solicitudes reiniciadas correctamente al estado inicial.",
    );
  }

  setActiveNav(selectedLabel: string): void {
    this.navItems.forEach((item) => {
      item.active = item.label === selectedLabel;
    });

    if (selectedLabel === "Activos Fijos" || selectedLabel === "Panel") {
      this.router.navigate(["/registro-activo"]);
    } else if (
      selectedLabel === "Aprobaciones" ||
      selectedLabel === "Solicitudes"
    ) {
      this.router.navigate(["/flujo-aprobacion"]);
    }
  }

  cerrarSesion(): void {
    this.authService.logout();
  }

  alternarMenuUsuario(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.mostrarMenuUsuario.update((v) => !v);
  }

  @HostListener("document:click")
  onDocumentClick(): void {
    this.mostrarMenuUsuario.set(false);
  }

  private mostrarFeedback(tipo: "exito" | "error", texto: string): void {
    this.mensajeFeedback.set({ tipo, texto });
    setTimeout(() => {
      this.mensajeFeedback.set(null);
    }, 4500);
  }

  obtenerClasePaso(
    paso: number,
    estado: string | undefined,
  ): "done" | "now" | "wait" {
    if (!estado) return "wait";

    // Paso 1: Solicitud enviada
    if (paso === 1) return "done";

    // Paso 2: Revisión aprobador
    if (paso === 2) {
      if (estado === "PENDIENTE_REVISION") return "now";
      return "done"; // Aprobado, rechazado o ejecutado ya pasaron por revisión
    }

    // Paso 3: Ejecución bodega
    if (paso === 3) {
      if (estado === "PENDIENTE_REVISION" || estado === "RECHAZADO")
        return "wait";
      if (estado === "APROBADO") return "now";
      if (estado === "EJECUTADO") return "done";
    }

    // Paso 4: Cierre y registro
    if (paso === 4) {
      if (estado === "EJECUTADO") return "done";
      return "wait";
    }

    return "wait";
  }

  obtenerClaseConector(
    pasoPrevio: number,
    estado: string | undefined,
  ): "done" | "" {
    if (!estado) return "";
    if (
      pasoPrevio === 1 &&
      (estado === "APROBADO" ||
        estado === "RECHAZADO" ||
        estado === "EJECUTADO")
    ) {
      return "done";
    }
    if (pasoPrevio === 2 && estado === "EJECUTADO") {
      return "done";
    }
    if (pasoPrevio === 3 && estado === "EJECUTADO") {
      return "done";
    }
    return "";
  }
}
