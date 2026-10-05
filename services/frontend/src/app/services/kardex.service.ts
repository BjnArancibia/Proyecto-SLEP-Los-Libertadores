import { Injectable, computed, signal, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {
  MovimientoKardex,
  NuevoMovimientoDTO,
  ProductoKardex,
  TipoMovimientoKardex,
} from "../models/kardex.model";
import { AuthService } from "./auth.service";

const STORAGE_KEY_MOVIMIENTOS = "slep_kardex_movimientos_mock";
const STORAGE_KEY_PRODUCTO = "slep_kardex_producto_mock";

// Datos iniciales
const PRODUCTO_INICIAL: ProductoKardex = {
  id: "PROD-001",
  codigo: "INS-2024-00312",
  nombre: "Papel bond 75g A4 — Bodega central SLEP",
  ubicacionBodega: "Bodega central SLEP",
  categoria: "Insumos de oficina",
  unidadMedida: "Resmas",
  stockMinimoAlerta: 30,
};

// Historial inicial alineado
const MOVIMIENTOS_INICIALES: MovimientoKardex[] = [
  {
    id: "MOV-0521",
    folio: "#F-0521",
    fecha: "08/09/2026 14:33",
    tipo: "SALIDA",
    tipoLabel: "Salida",
    cantidad: -20,
    origenDestino: "→ Liceo Bicentenario",
    responsableNombre: "C. Tapia",
    responsableRol: "Encargada de Bodega",
    balance: 122,
    documentoReferencia: "GD-8921",
    observaciones: "Despacho regular para inicio de mes académico.",
  },
  {
    id: "MOV-0498",
    folio: "#F-0498",
    fecha: "05/09/2026 09:11",
    tipo: "TRASLADO",
    tipoLabel: "Traslado",
    cantidad: -15,
    origenDestino: "→ Esc. El Palqui",
    responsableNombre: "R. Fuentes",
    responsableRol: "Encargado de Bodega",
    balance: 142,
    documentoReferencia: "TRAS-2026-014",
    observaciones: "Reasignación por urgencia de material escolar.",
  },
  {
    id: "MOV-0471",
    folio: "#F-0471",
    fecha: "02/09/2026 16:45",
    tipo: "ENTRADA",
    tipoLabel: "Entrada",
    cantidad: 100,
    origenDestino: "Proveedor externo",
    responsableNombre: "J. Morales",
    responsableRol: "Administrador",
    balance: 157,
    documentoReferencia: "FAC-44021",
    observaciones: "Orden de compra N° 2026-088. Recepción conforme.",
  },
  {
    id: "MOV-0444",
    folio: "#F-0444",
    fecha: "28/08/2026 11:20",
    tipo: "DEVOLUCION",
    tipoLabel: "Devolución",
    cantidad: 30,
    origenDestino: "← Esc. Los Andes",
    responsableNombre: "M. Sepúlveda",
    responsableRol: "Encargada Administrativa",
    balance: 57,
    documentoReferencia: "DEV-2026-004",
    observaciones: "Sobrante no consumido de proyecto primer semestre.",
  },
  {
    id: "MOV-0411",
    folio: "#F-0411",
    fecha: "22/08/2026 08:55",
    tipo: "SALIDA",
    tipoLabel: "Salida",
    cantidad: -50,
    origenDestino: "→ Esc. Los Andes",
    responsableNombre: "C. Tapia",
    responsableRol: "Encargada de Bodega",
    balance: 27,
    documentoReferencia: "GD-8790",
    observaciones: "Consumo mensual proyectado.",
  },
  {
    id: "MOV-0380",
    folio: "#F-0380",
    fecha: "15/08/2026 11:00",
    tipo: "ENTRADA",
    tipoLabel: "Entrada",
    cantidad: 120,
    origenDestino: "Proveedor externo",
    responsableNombre: "J. Morales",
    responsableRol: "Administrador",
    balance: 77,
    documentoReferencia: "FAC-43890",
    observaciones: "Reposición según licitación pública ID 2408-2026.",
  },
];

@Injectable({
  providedIn: "root",
})
export class KardexService {
  // Signals principales de datos
  private _producto = signal<ProductoKardex>(this.cargarProducto());
  private _movimientos = signal<MovimientoKardex[]>(this.cargarMovimientos());

  private http = inject(HttpClient);

  // Signals de estado visual (filtros y búsqueda en tiempo real)
  readonly filtroTipo = signal<string>("TODO");
  readonly terminoBusqueda = signal<string>("");

  // Lectura de señales
  readonly producto = this._producto.asReadonly();
  readonly movimientos = this._movimientos.asReadonly();

  // Stock actual: corresponde al balance del movimiento más reciente (primer elemento)
  readonly stockActual = computed<number>(() => {
    const list = this._movimientos();
    return list.length > 0 ? list[0].balance : 0;
  });

  // Total acumulado histórico de entradas
  readonly totalEntradas = computed<number>(() => {
    // Calculado dinámicamente sumando entradas y devoluciones
    const sum = this._movimientos().reduce((acc, m) => {
      return m.cantidad > 0 ? acc + m.cantidad : acc;
    }, 90); // 90 de saldo base inicial
    return sum;
  });

  // Total acumulado histórico de salidas (sumatoria de salidas y traslados)
  readonly totalSalidas = computed<number>(() => {
    const sum = this._movimientos().reduce((acc, m) => {
      return m.cantidad < 0 ? acc + Math.abs(m.cantidad) : acc;
    }, 133); // 133 de salidas base
    return sum;
  });

  // Alerta de stock crítico
  readonly stockEsCritico = computed<boolean>(() => {
    return this.stockActual() <= this._producto().stockMinimoAlerta;
  });

  // Lista filtrada por tipo y buscador
  readonly movimientosFiltrados = computed<MovimientoKardex[]>(() => {
    const tipo = this.filtroTipo().toUpperCase();
    const query = this.terminoBusqueda().trim().toLowerCase();
    let lista = this._movimientos();

    if (tipo !== "TODO") {
      lista = lista.filter((m) => m.tipo === tipo);
    }

    if (query) {
      lista = lista.filter(
        (m) =>
          m.folio.toLowerCase().includes(query) ||
          m.origenDestino.toLowerCase().includes(query) ||
          m.responsableNombre.toLowerCase().includes(query) ||
          m.tipoLabel.toLowerCase().includes(query) ||
          (m.documentoReferencia &&
            m.documentoReferencia.toLowerCase().includes(query)),
      );
    }

    return lista;
  });

  constructor(private authService: AuthService) {
    // Sincronización entre pestañas distintas en tiempo real
    if (typeof window !== "undefined") {
      window.addEventListener("storage", (event) => {
        if (event.key === STORAGE_KEY_MOVIMIENTOS && event.newValue) {
          try {
            this._movimientos.set(JSON.parse(event.newValue));
          } catch {
            // Ignorar errores de deserialización
          }
        }
      });
    }
  }

  // Carga movimientos desde localStorage o usa los iniciales

  private cargarMovimientos(): MovimientoKardex[] {
    if (typeof localStorage === "undefined") return MOVIMIENTOS_INICIALES;
    const raw = localStorage.getItem(STORAGE_KEY_MOVIMIENTOS);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        localStorage.removeItem(STORAGE_KEY_MOVIMIENTOS);
      }
    }
    return MOVIMIENTOS_INICIALES;
  }

  // Carga producto desde localStorage o usa el inicial

  private cargarProducto(): ProductoKardex {
    if (typeof localStorage === "undefined") return PRODUCTO_INICIAL;
    const raw = localStorage.getItem(STORAGE_KEY_PRODUCTO);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        localStorage.removeItem(STORAGE_KEY_PRODUCTO);
      }
    }
    return PRODUCTO_INICIAL;
  }

  private guardar(movimientos: MovimientoKardex[]): void {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(
        STORAGE_KEY_MOVIMIENTOS,
        JSON.stringify(movimientos),
      );
    }
    this._movimientos.set(movimientos);
  }

  // Registra un nuevo movimiento actualizando balance y existencias en tiempo real

  registrarMovimiento(dto: NuevoMovimientoDTO): {
    exito: boolean;
    mensaje: string;
  } {
    const stockActual = this.stockActual();
    const esDescuento = dto.tipo === "SALIDA" || dto.tipo === "TRASLADO";

    // Validación de integridad: prevenir quiebre de stock negativo
    if (esDescuento && dto.cantidad > stockActual) {
      return {
        exito: false,
        mensaje: `Stock insuficiente. Disponible actual: ${stockActual} unidades. No es posible el despacho`,
      };
    }

    if (dto.cantidad <= 0) {
      return {
        exito: false,
        mensaje: "La cantidad debe ser un número entero positivo mayor a cero.",
      };
    }

    const cantidadAplicada = esDescuento
      ? -Math.abs(dto.cantidad)
      : Math.abs(dto.cantidad);
    const nuevoBalance = stockActual + cantidadAplicada;

    // Calcular nuevo folio correlativo
    const correlativo =
      522 + (this._movimientos().length - MOVIMIENTOS_INICIALES.length);
    const folioGenerado = `#F-${String(correlativo).padStart(4, "0")}`;

    // Obtener fecha y hora en formato chileno DD/MM/AAAA HH:mm
    const now = new Date();
    const dia = String(now.getDate()).padStart(2, "0");
    const mes = String(now.getMonth() + 1).padStart(2, "0");
    const anio = now.getFullYear();
    const hora = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    const fechaHora = `${dia}/${mes}/${anio} ${hora}:${min}`;

    // Obtener datos del usuario logueado
    const user = this.authService.usuario();
    const responsableNombre = user
      ? `${user.nombre.charAt(0)}. ${user.apellido}`
      : "Bodega Central";
    const responsableRol = user ? user.rol : "ENCARGADO_BODEGA";

    const etiquetas: Record<TipoMovimientoKardex, string> = {
      ENTRADA: "Entrada",
      SALIDA: "Salida",
      TRASLADO: "Traslado",
      DEVOLUCION: "Devolución",
      AJUSTE: "Ajuste",
    };

    const nuevoMovimiento: MovimientoKardex = {
      id: `MOV-${Date.now()}`,
      folio: folioGenerado,
      fecha: fechaHora,
      tipo: dto.tipo,
      tipoLabel: etiquetas[dto.tipo],
      cantidad: cantidadAplicada,
      origenDestino: dto.origenDestino,
      responsableNombre: responsableNombre,
      responsableRol: responsableRol,
      balance: nuevoBalance,
      documentoReferencia: dto.documentoReferencia?.trim() || "—",
      observaciones: dto.observaciones?.trim() || "",
    };

    // Insertar al inicio de la lista (orden cronológico descendente)
    const nuevaLista = [nuevoMovimiento, ...this._movimientos()];
    this.guardar(nuevaLista);

    // Sincronizar nuevo movimiento con base de datos en backend
    this.http.post("http://127.0.0.1:8000/api/kardex", {
      activo_codigo: this._producto().codigo,
      activo_nombre: this._producto().nombre,
      fecha_registro: fechaHora,
      tipo_movimiento: dto.tipo,
      origen_destino: dto.origenDestino,
      responsable: responsableNombre,
      cantidad: cantidadAplicada,
      saldo: nuevoBalance,
      estado_stock: nuevoBalance <= this._producto().stockMinimoAlerta ? "CRITICO" : "DISPONIBLE",
      documento_respaldo: dto.documentoReferencia?.trim() || null
    }).subscribe({
      next: () => console.log("Movimiento de kardex persistido en Base de Datos."),
      error: () => console.warn("Aviso: BD no disponible para persistencia directa de kardex.")
    });

    return {
      exito: true,
      mensaje: `Movimiento ${folioGenerado} registrado exitosamente. Nuevo stock: ${nuevoBalance} unidades.`,
    };
  }

  // Cambio del filtro en la tabla
  setFiltro(tipo: string): void {
    this.filtroTipo.set(tipo);
  }

  // Actualiza término de búsqueda
  setBusqueda(query: string): void {
    this.terminoBusqueda.set(query);
  }

  // Restablecer datos localmente y en BD
  restablecerDatos(): void {
    const copias: MovimientoKardex[] = JSON.parse(
      JSON.stringify(MOVIMIENTOS_INICIALES),
    );
    const prodCopia: ProductoKardex = JSON.parse(
      JSON.stringify(PRODUCTO_INICIAL),
    );

    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY_MOVIMIENTOS, JSON.stringify(copias));
      localStorage.setItem(STORAGE_KEY_PRODUCTO, JSON.stringify(prodCopia));
    }
    this._movimientos.set(copias);
    this._producto.set(prodCopia);

    // Sincronizar reinicio con base de datos en backend
    this.http.post("http://127.0.0.1:8000/api/kardex/reset", {}).subscribe({
      next: () => console.log("Kardex de bodega reiniciado en Base de Datos."),
      error: () =>
        console.warn(
          "Aviso: Base de datos no conectada para reset de kardex, reiniciado localmente.",
        ),
    });
  }

  // Exporta la bitácora de movimientos en formato CSV
  exportarCSV(): void {
    const lista = this.movimientosFiltrados();
    const prod = this._producto();

    // Encabezados auditable
    const headers = [
      "Folio",
      "Fecha",
      "Tipo de Movimiento",
      "Cantidad",
      "Origen / Destino",
      "Responsable",
      "Documento Ref.",
      "Balance Resultante",
      "Observaciones",
    ];

    const rows = lista.map((m) => [
      `"${m.folio}"`,
      `"${m.fecha}"`,
      `"${m.tipoLabel}"`,
      m.cantidad,
      `"${m.origenDestino}"`,
      `"${m.responsableNombre}"`,
      `"${m.documentoReferencia || "—"}"`,
      m.balance,
      `"${(m.observaciones || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "\uFEFF" + // UTF-8 BOM para soporte correcto de tildes en Microsoft Excel
      `Producto: ${prod.nombre} (${prod.codigo})\n` +
      `Fecha de exportación: ${new Date().toLocaleString()}\n` +
      `Stock actual: ${this.stockActual()} ${prod.unidadMedida}\n\n` +
      headers.join(";") +
      "\n" +
      rows.map((e) => e.join(";")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `kardex_${prod.codigo}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
