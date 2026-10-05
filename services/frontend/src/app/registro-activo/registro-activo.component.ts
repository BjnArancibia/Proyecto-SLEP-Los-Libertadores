import {
  Component,
  OnInit,
  HostListener,
  ViewChild,
  ElementRef,
  AfterViewInit,
  signal,
  computed,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";
import { HttpClient } from "@angular/common/http";
import { RegistroActivoTemplate } from "./registro-activo.template";
import { AuthService } from "../services/auth.service";
import { MovimientosService } from "../services/movimientos.service";
import { BitacoraService } from "../services/bitacora.service";
import { TransaccionBitacora, ModuloBitacora } from "../models/bitacora.model";
import { Router } from "@angular/router";
import { FlujoAprobacionComponent } from "../flujo-aprobacion/flujo-aprobacion.component";
import { KardexComponent } from "../kardex/kardex.component";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";

@Component({
  selector: "app-registro-activo",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FlujoAprobacionComponent,
    KardexComponent,
  ],
  templateUrl: "./registro-activo.component.html",
  styleUrls: ["./registro-activo.component.css"],
})
export class RegistroActivoComponent
  extends RegistroActivoTemplate
  implements OnInit
{
  activoForm!: FormGroup;
  apiUrl = "http://127.0.0.1:8000/api/activos";

  // Controla qué vista se muestra en el área principal manteniendo la misma sidebar
  opcionActiva = "Activos Fijos";

  // Estado de la modal y del botón de etiqueta
  mostrarModal = false;
  botonEtiquetaHabilitado = false;
  ultimoActivoGuardado: {
    numero_patrimonial: string;
    numero_serie: string;
    custodio: string;
  } | null = null;

  @ViewChild("qrCanvas") qrCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild("barcodesvg") barcodesvg!: ElementRef<SVGElement>;

  // Perfil del usuario activo (se completa reactivamente desde AuthService)
  get currentUser() {
    const user = this.authService.usuario();
    if (user) {
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
    }
    return {
      initials: "JP",
      name: "Juan Pérez",
      role: "Administrador",
      email: "",
    };
  }

  // Controla si el menú de perfil / logout está visible
  mostrarMenuUsuario = false;

  navItems = [
    { label: "Panel", icon: "ti ti-layout-dashboard", active: false },
    { label: "Activos Fijos", icon: "ti ti-package", active: true },
    { label: "Bodega", icon: "ti ti-building-warehouse", active: false },
    { label: "Solicitudes", icon: "ti ti-arrow-transfer-up", active: false },
    { label: "Aprobaciones", icon: "ti ti-checklist", active: false },
    { label: "Bitácora", icon: "ti ti-clipboard-list", active: false },
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private authService: AuthService,
    private movimientosService: MovimientosService,
    private bitacoraService: BitacoraService,
    private router: Router,
  ) {
    super();
  }

  // Solicitudes reactivas del sistema (se actualizan automáticamente al aprobar/rechazar)
  get solicitudes() {
    return this.movimientosService.solicitudes;
  }

  get pendientesAprobacion(): number {
    return this.movimientosService
      .solicitudes()
      .filter((s) => s.estado === "PENDIENTE_REVISION").length;
  }

  revisarSolicitud(solicitudId: string): void {
    this.movimientosService.seleccionarSolicitud(solicitudId);
    this.setActiveNav("Aprobaciones");
  }

  // Notificación reactiva para la vista de solicitudes
  mensajeFeedback = signal<{ tipo: "exito" | "error"; texto: string } | null>(
    null,
  );

  reiniciarSolicitudes(): void {
    this.movimientosService.reiniciarSolicitudes();
    this.mensajeFeedback.set({
      tipo: "exito",
      texto:
        "Solicitudes de movimiento reiniciadas correctamente al estado inicial.",
    });
    setTimeout(() => {
      this.mensajeFeedback.set(null);
    }, 3500);
  }

  // Bitácora Auditable de Transacciones
  get transaccionesBitacora(): TransaccionBitacora[] {
    return this.bitacoraService.transaccionesFiltradas();
  }

  get statsBitacora() {
    return {
      total: this.bitacoraService.totalTransacciones(),
      activos: this.bitacoraService.totalActivos(),
      existencias: this.bitacoraService.totalExistencias(),
      solicitudes: this.bitacoraService.totalSolicitudes(),
    };
  }

  filtroBitacoraTexto = computed(() => this.bitacoraService.filtroTexto());
  filtroBitacoraModulo = computed(() => this.bitacoraService.filtroModulo());
  filtroBitacoraDecision = computed(() =>
    this.bitacoraService.filtroDecision(),
  );

  transaccionSeleccionada = signal<TransaccionBitacora | null>(null);
  mostrarModalDetalleBitacora = signal<boolean>(false);

  abrirDetalleTransaccion(t: TransaccionBitacora): void {
    this.transaccionSeleccionada.set(t);
    this.mostrarModalDetalleBitacora.set(true);
  }

  cerrarDetalleTransaccion(): void {
    this.mostrarModalDetalleBitacora.set(false);
    this.transaccionSeleccionada.set(null);
  }

  onFiltroTextoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.bitacoraService.setFiltroTexto(input.value);
  }

  onFiltroModuloChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.bitacoraService.setFiltroModulo(
      select.value as ModuloBitacora | "TODOS",
    );
  }

  onFiltroDecisionChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.bitacoraService.setFiltroDecision(select.value);
  }

  reiniciarBitacora(): void {
    this.bitacoraService.reiniciarBitacora();
    this.mensajeFeedback.set({
      tipo: "exito",
      texto: "Bitácora auditable de transacciones reiniciada.",
    });
    setTimeout(() => {
      this.mensajeFeedback.set(null);
    }, 3500);
  }

  obtenerClavesComparacion(t: TransaccionBitacora | null): string[] {
    if (!t) return [];
    const keys = new Set<string>();
    if (t.valores_anteriores) {
      Object.keys(t.valores_anteriores).forEach((k) => keys.add(k));
    }
    if (t.valores_posteriores) {
      Object.keys(t.valores_posteriores).forEach((k) => keys.add(k));
    }
    return Array.from(keys);
  }

  formatearNombreCampo(clave: string): string {
    const map: Record<string, string> = {
      numero_patrimonial: "N° Patrimonial",
      numero_serie: "N° Serie",
      nombre: "Nombre Activo / Bien",
      marca_modelo: "Marca / Modelo",
      estado_conservacion: "Conservación",
      establecimiento: "Establecimiento",
      dependencia_sala: "Dependencia / Sala",
      custodio: "Custodio Responsable",
      codigo_solicitud: "Código de Solicitud",
      tipo: "Tipo Movimiento",
      estado: "Estado Solicitud",
      origen: "Origen",
      destino: "Destino",
      solicitante: "Solicitante",
      aprobador: "Usuario Aprobador",
      fecha_resolucion: "Fecha Resolución",
      comentario_resolucion: "Comentario Resolución",
      saldo_stock: "Saldo en Stock",
      cantidad_operacion: "Cantidad Operación",
      estado_stock: "Estado de Stock",
      documento_respaldo: "Documento Respaldo",
      documento_guia: "Guía de Despacho",
      ubicacion_actual: "Ubicación Actual",
      item_codigo: "Código Ítem",
      item_nombre: "Nombre Insumo / Ítem",
      diferencia: "Diferencia de Ajuste",
    };
    return map[clave] || clave.replace(/_/g, " ").toUpperCase();
  }

  esValorModificado(clave: string, t: TransaccionBitacora | null): boolean {
    if (!t || !t.valores_anteriores || !t.valores_posteriores) return false;
    return (
      JSON.stringify(t.valores_anteriores[clave]) !==
      JSON.stringify(t.valores_posteriores[clave])
    );
  }

  exportarBitacoraCSV(): void {
    const transacciones = this.bitacoraService.transacciones();
    if (transacciones.length === 0) {
      alert("No hay transacciones registradas para exportar.");
      return;
    }

    const encabezados = [
      "Folio",
      "Fecha/Hora",
      "Módulo",
      "Acción Ejecutada",
      "Decisión",
      "Usuario",
      "Perfil",
      "Justificación",
      "Valores Anteriores",
      "Valores Posteriores",
    ];

    const filas = transacciones.map((t) => [
      `"${t.folio}"`,
      `"${t.fecha_hora}"`,
      `"${t.modulo}"`,
      `"${t.accion.replace(/"/g, '""')}"`,
      `"${t.decision}"`,
      `"${t.usuario_nombre}"`,
      `"${t.usuario_perfil}"`,
      `"${(t.justificacion || "").replace(/"/g, '""')}"`,
      `"${JSON.stringify(t.valores_anteriores || {}).replace(/"/g, '""')}"`,
      `"${JSON.stringify(t.valores_posteriores || {}).replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [encabezados.join(","), ...filas.map((f) => f.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `bitacora_auditoria_slep_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  get eventosBitacora() {
    const eventos: Array<{
      fecha: string;
      modulo: string;
      tagClass: string;
      accion: string;
      usuario: string;
      rol: string;
    }> = [];

    // Recorrer solicitudes y sus bitácoras
    this.movimientosService.solicitudes().forEach((s) => {
      s.bitacora.forEach((b) => {
        eventos.push({
          fecha: b.fecha,
          modulo:
            b.accion.includes("APROBADA") || b.accion.includes("RECHAZADA")
              ? "Aprobaciones"
              : "Solicitudes",
          tagClass:
            b.accion.includes("APROBADA") || b.accion.includes("RECHAZADA")
              ? "tag-aprobaciones"
              : "tag-solicitudes",
          accion: `${s.id}: ${b.accion}`,
          usuario: b.usuarioNombre,
          rol: b.usuarioRol || "Sistema",
        });
      });
    });

    return eventos;
  }

  ngOnInit(): void {
    this.activoForm = this.fb.group({
      numero_patrimonial: ["", Validators.required],
      numero_serie: [""],
      nombre: ["", Validators.required],
      marca_modelo: [""],
      establecimiento: ["Bodega central SLEP", Validators.required],
      dependencia: [""],
      custodio: [""],
    });

    // Detectar qué opción debe estar activa a partir de la URL
    const currentUrl = this.router.url.toLowerCase();
    if (currentUrl.includes("/bodega") || currentUrl.includes("/kardex")) {
      this.opcionActiva = "Bodega";
    } else if (
      currentUrl.includes("/aprobaciones") ||
      currentUrl.includes("/flujo-aprobacion")
    ) {
      this.opcionActiva = "Aprobaciones";
    } else if (currentUrl.includes("/panel")) {
      this.opcionActiva = "Panel";
    } else if (currentUrl.includes("/solicitudes")) {
      this.opcionActiva = "Solicitudes";
    } else if (currentUrl.includes("/bitacora")) {
      this.opcionActiva = "Bitácora";
    } else {
      this.opcionActiva = "Activos Fijos";
    }

    this.navItems.forEach((item) => {
      item.active = item.label === this.opcionActiva;
    });
  }

  // Alterna la visibilidad del menú de perfil al hacer click
  alternarMenuUsuario(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.mostrarMenuUsuario = !this.mostrarMenuUsuario;
  }

  // Cierre de sesión activa y redirige al login
  cerrarSesion(): void {
    this.authService.logout();
  }

  // Si se hace click fuera del menú de usuario, se cierra
  @HostListener("document:click")
  onDocumentClick(): void {
    this.mostrarMenuUsuario = false;
  }

  setActiveNav(selectedLabel: string) {
    this.navItems.forEach((item) => {
      item.active = item.label === selectedLabel;
    });

    this.opcionActiva = selectedLabel;

    // Mapear cada opción a su ruta correspondiente en el historial
    const routeMap: Record<string, string> = {
      Panel: "/panel",
      "Activos Fijos": "/registro-activo",
      Bodega: "/bodega",
      Solicitudes: "/solicitudes",
      Aprobaciones: "/aprobaciones",
      Bitácora: "/bitacora",
    };

    if (routeMap[selectedLabel]) {
      window.history.pushState({}, "", routeMap[selectedLabel]);
    }
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
      categoria_sugerida_ia: "Equipos computacionales — Notebooks y portátiles",
    };

    this.http.post(this.apiUrl, payload).subscribe({
      next: (res: any) => {
        this.ultimoActivoGuardado = {
          numero_patrimonial: payload.numero_patrimonial,
          numero_serie: payload.numero_serie || "S/N",
          custodio: payload.custodio || "—",
        };
        this.botonEtiquetaHabilitado = true;

        // Registrar la transacción en la bitácora auditable
        this.bitacoraService.registrarTransaccion({
          folio: payload.numero_patrimonial,
          modulo: "ACTIVOS",
          accion: "Alta de Activo Fijo",
          decision: "REGISTRADO",
          justificacion:
            "Incorporación de activo al inventario patrimonial institucional",
          valores_anteriores: null,
          valores_posteriores: {
            numero_patrimonial: payload.numero_patrimonial,
            numero_serie: payload.numero_serie || "S/N",
            nombre: payload.nombre,
            marca_modelo: payload.marca_modelo,
            estado_conservacion: payload.estado_conservacion,
            establecimiento: payload.establecimiento,
            dependencia_sala: payload.dependencia_sala,
            custodio: payload.custodio,
          },
          usuario_nombre: this.currentUser.name,
          usuario_perfil: this.currentUser.role,
        });

        alert("Activo guardado exitosamente!");
        this.activoForm.reset({ establecimiento: "Bodega central SLEP" });
      },
      error: (err) => {
        alert(
          "Error al guardar activo: " +
            (err.error?.message || "Error desconocido"),
        );
      },
    });
  }

  abrirModal() {
    if (!this.botonEtiquetaHabilitado || !this.ultimoActivoGuardado) return;
    this.mostrarModal = true;
    // Esperar a que Angular renderice el modal antes de dibujar los códigos
    setTimeout(() => this.generarCodigos(), 50);
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  @HostListener("document:keydown.escape")
  onEscapeKey() {
    if (this.mostrarModal) {
      this.cerrarModal();
    }
  }

  private generarCodigos() {
    if (!this.ultimoActivoGuardado) return;
    const valor = this.ultimoActivoGuardado.numero_patrimonial;

    // Generar QR en canvas
    if (this.qrCanvas?.nativeElement) {
      QRCode.toCanvas(this.qrCanvas.nativeElement, valor, {
        width: 100,
        margin: 1,
        color: { dark: "#1e293b", light: "#ffffff" },
      });
    }

    // Generar código de barras en SVG
    if (this.barcodesvg?.nativeElement) {
      JsBarcode(this.barcodesvg.nativeElement, valor, {
        format: "CODE128",
        width: 1.5,
        height: 40,
        displayValue: true,
        fontSize: 11,
        fontOptions: "bold",
        lineColor: "#1e293b",
        background: "#ffffff",
        margin: 4,
      });
    }
  }
}
