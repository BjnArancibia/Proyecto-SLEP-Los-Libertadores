import {
  Component,
  computed,
  signal,
  HostListener,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AuthService, Usuario } from "../services/auth.service";
import { KardexService } from "../services/kardex.service";
import {
  TipoMovimientoKardex,
  NuevoMovimientoDTO,
} from "../models/kardex.model";

@Component({
  selector: "app-kardex",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./kardex.component.html",
  styleUrl: "./kardex.component.css",
})

// Manejo de visualización de movimientos, registro de nuevos movimientos y exportación de auditoría.
export class KardexComponent {
  private kardexService = inject(KardexService);
  private authService = inject(AuthService);

  // Control de la modal de Nuevo Movimiento
  mostrarModalMovimiento = signal<boolean>(false);
  mensajeAlerta = signal<{ tipo: "exito" | "error"; texto: string } | null>(
    null,
  );

  // Formulario del nuevo movimiento
  nuevoMovimiento: NuevoMovimientoDTO = {
    tipo: "SALIDA",
    cantidad: 10,
    origenDestino: "→ Liceo Bicentenario",
    documentoReferencia: "",
    observaciones: "",
  };

  // Opciones de destino comunes en el SLEP Los Libertadores
  readonly opcionesDestinoSugeridas: Record<TipoMovimientoKardex, string[]> = {
    ENTRADA: [
      "Proveedor externo",
      "Donación Ministerio de Educación",
      "Compra convenio marco SLEP",
      "Recepción Bodega Central",
    ],
    SALIDA: [
      "→ Liceo Bicentenario",
      "→ Esc. Los Andes",
      "→ Esc. El Palqui",
      "→ Colegio República de Chile",
      "→ Departamento de Educación SLEP",
    ],
    TRASLADO: [
      "→ Liceo Bicentenario",
      "→ Esc. El Palqui",
      "→ Esc. Los Andes",
      "→ Bodega Satélite Norte",
    ],
    DEVOLUCION: [
      "← Esc. Los Andes",
      "← Liceo Bicentenario",
      "← Esc. El Palqui",
      "← Taller de Mantención",
    ],
    AJUSTE: [
      "Ajuste por inventario físico anual",
      "Corrección de conteo de auditoría",
    ],
  };

  // Datos reactivos provenientes de KardexService
  readonly catalogoProductos = this.kardexService.catalogoProductos;
  readonly producto = this.kardexService.producto;
  readonly movimientos = this.kardexService.movimientosFiltrados;
  readonly stockActual = this.kardexService.stockActual;
  readonly totalEntradas = this.kardexService.totalEntradas;
  readonly totalSalidas = this.kardexService.totalSalidas;
  readonly stockCritico = this.kardexService.stockEsCritico;
  readonly filtroActual = this.kardexService.filtroTipo;
  readonly busquedaTexto = this.kardexService.terminoBusqueda;

  getStockDeProducto(id: string): number {
    return this.kardexService.getStockDeProducto(id);
  }

  getNombreProducto(id?: string): string {
    return this.kardexService.getNombreProducto(id);
  }

  getNombreProductoCorto(id?: string): string {
    return this.kardexService.getNombreProductoCorto(id);
  }

  readonly esVistaConsolidada = computed(
    () => this.kardexService.productoSeleccionadoId() === "TODOS",
  );

  readonly articulosCriticosCount = computed(() => {
    return this.catalogoProductos().filter(
      (p) => this.getStockDeProducto(p.id) <= p.stockMinimoAlerta,
    ).length;
  });

  onCambiarProducto(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.kardexService.seleccionarProducto(val);
  }

  // Datos del usuario logueado en AuthService
  readonly usuarioActual = computed<Usuario | null>(() =>
    this.authService.usuario(),
  );

  // Datos de usuario mostrado en interfaz
  readonly currentUser = computed(() => {
    const user = this.usuarioActual();
    if (!user) {
      return {
        initials: "JM",
        name: "J. Morales",
        role: "Administrador",
        email: "j.morales@slep.cl",
      };
    }
    const rolLabels: Record<string, string> = {
      ADMIN: "Administrador",
      ENCARGADO_BODEGA: "Encargado de Bodega",
      SOLICITANTE: "Solicitante",
      APROBADOR: "Aprobador",
    };
    return {
      name: `${user.nombre.charAt(0)}. ${user.apellido}`,
      fullName: `${user.nombre} ${user.apellido}`,
      initials:
        `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`.toUpperCase(),
      role: rolLabels[user.rol] || user.rol,
      email: user.email,
    };
  });

  constructor() {}

  // Filtrado
  aplicarFiltro(tipo: string): void {
    this.kardexService.setFiltro(tipo);
  }

  onBuscar(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.kardexService.setBusqueda(input.value);
  }

  exportarAuditoria(): void {
    this.kardexService.exportarCSV();
  }

  // Notificación visual reactiva
  mensajeNotificacion = signal<{ tipo: "exito" | "error"; texto: string } | null>(
    null,
  );

  // Reiniciar y limpiar movimientos de bodega (inmediato y sin bloqueos)
  reiniciarMovimientos(): void {
    this.kardexService.restablecerDatos();
    this.mensajeNotificacion.set({
      tipo: "exito",
      texto: "Registros y existencias de bodega reiniciados correctamente al estado original.",
    });
    setTimeout(() => {
      this.mensajeNotificacion.set(null);
    }, 3500);
  }

  // Manejo Modal
  abrirModal(): void {
    const pId = this.producto().id;
    this.nuevoMovimiento = {
      tipo: "SALIDA",
      cantidad: 10,
      origenDestino: "→ Liceo Bicentenario",
      documentoReferencia: "",
      observaciones: "",
      productoId: pId === "TODOS" ? "BOD-001" : pId,
    };
    this.mensajeAlerta.set(null);
    this.mostrarModalMovimiento.set(true);
  }

  cerrarModal(): void {
    this.mostrarModalMovimiento.set(false);
    this.mensajeAlerta.set(null);
  }

  onTipoMovimientoChange(): void {
    const sugerencias =
      this.opcionesDestinoSugeridas[this.nuevoMovimiento.tipo];
    if (sugerencias && sugerencias.length > 0) {
      this.nuevoMovimiento.origenDestino = sugerencias[0];
    }
  }

  guardarMovimiento(): void {
    if (!this.nuevoMovimiento.cantidad || this.nuevoMovimiento.cantidad <= 0) {
      this.mensajeAlerta.set({
        tipo: "error",
        texto: "Ingrese una cantidad válida mayor a cero.",
      });
      return;
    }

    if (!this.nuevoMovimiento.origenDestino.trim()) {
      this.mensajeAlerta.set({
        tipo: "error",
        texto: "Indique el origen o destino del movimiento.",
      });
      return;
    }

    const resultado = this.kardexService.registrarMovimiento(
      this.nuevoMovimiento,
    );

    if (resultado.exito) {
      this.mensajeAlerta.set({ tipo: "exito", texto: resultado.mensaje });
      setTimeout(() => {
        this.cerrarModal();
      }, 1200);
    } else {
      this.mensajeAlerta.set({ tipo: "error", texto: resultado.mensaje });
    }
  }

  @HostListener("document:keydown.escape")
  onEscape(): void {
    if (this.mostrarModalMovimiento()) {
      this.cerrarModal();
    }
  }
}
