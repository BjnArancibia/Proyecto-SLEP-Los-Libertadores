import { Injectable, computed, signal, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {
  MovimientoKardex,
  NuevoMovimientoDTO,
  ProductoKardex,
  TipoMovimientoKardex,
} from "../models/kardex.model";
import { AuthService } from "./auth.service";
import { BitacoraService } from "./bitacora.service";

const STORAGE_KEY_MOVIMIENTOS = "slep_kardex_movimientos_mock";
const STORAGE_KEY_PRODUCTO_ACTIVO = "slep_kardex_producto_activo_id";

// Catálogo institucional unificado de insumos en Bodega Central SLEP Los Libertadores
export const CATALOGO_PRODUCTOS_BODEGA: ProductoKardex[] = [
  {
    id: "BOD-001",
    codigo: "INS-2024-00312",
    nombre: "Papel bond 75g A4 — Bodega central SLEP",
    ubicacionBodega: "Estantería A-02 / Nivel 1",
    categoria: "Insumos de oficina",
    unidadMedida: "Resmas",
    stockMinimoAlerta: 10,
    documentoReferencia: "FAC-44021",
    stockInicial: 122,
  },
  {
    id: "BOD-002",
    codigo: "INS-2024-00105",
    nombre: "Tóner HP LaserJet Enterprise W9004MC Negro",
    ubicacionBodega: "Estantería B-01 / Gabinete 4",
    categoria: "Equipamiento computacional",
    unidadMedida: "Unidades",
    stockMinimoAlerta: 10,
    documentoReferencia: "OC-2026-0112",
    stockInicial: 20,
  },
  {
    id: "BOD-003",
    codigo: "INS-2024-00440",
    nombre: "Archivadores palanca oficio lomo ancho 8cm",
    ubicacionBodega: "Estantería A-05 / Nivel 3",
    categoria: "Insumos de oficina",
    unidadMedida: "Unidades",
    stockMinimoAlerta: 10,
    documentoReferencia: "GD-8790",
    stockInicial: 95,
  },
  {
    id: "BOD-004",
    codigo: "INS-2024-00810",
    nombre: "Plumones pizarra acrílica recargables (Pack x4)",
    ubicacionBodega: "Estantería A-03 / Nivel 2",
    categoria: "Insumos de oficina",
    unidadMedida: "Packs",
    stockMinimoAlerta: 10,
    documentoReferencia: "OC-2026-0304",
    stockInicial: 75,
  },
  {
    id: "BOD-005",
    codigo: "INS-2024-00955",
    nombre: "Dispensadores de alcohol gel 1000ml institucional",
    ubicacionBodega: "Estantería D-01 / Nivel 1",
    categoria: "Aseo y desinfección",
    unidadMedida: "Unidades",
    stockMinimoAlerta: 10,
    documentoReferencia: "FAC-42110",
    stockInicial: 64,
  },
  {
    id: "BOD-006",
    codigo: "INS-2024-00620",
    nombre: "Sillas de alumno universitaria apilables azul",
    ubicacionBodega: "Patio de Carga / Zona C",
    categoria: "Mobiliario escolar",
    unidadMedida: "Unidades",
    stockMinimoAlerta: 10,
    documentoReferencia: "RES-SLEP-104",
    stockInicial: 45,
  },
];

// Historial inicial alineado por producto
const MOVIMIENTOS_INICIALES: MovimientoKardex[] = [
  // Movimientos Papel Bond (BOD-001) - Balance actual: 122
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
    productoId: "BOD-001",
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
    productoId: "BOD-001",
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
    productoId: "BOD-001",
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
    productoId: "BOD-001",
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
    productoId: "BOD-001",
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
    productoId: "BOD-001",
  },

  // Movimientos Tóner HP (BOD-002) - Balance inicial: 20
  {
    id: "MOV-TON-01",
    folio: "#F-0480",
    fecha: "01/09/2026 10:00",
    tipo: "ENTRADA",
    tipoLabel: "Entrada",
    cantidad: 20,
    origenDestino: "Proveedor HP Chile / Convenio Marco",
    responsableNombre: "J. Morales",
    responsableRol: "Administrador",
    balance: 20,
    documentoReferencia: "OC-2026-0112",
    observaciones: "Recepción de tóners para stock semestral SLEP.",
    productoId: "BOD-002",
  },

  // Movimientos Archivadores (BOD-003) - Balance inicial: 95
  {
    id: "MOV-ARC-01",
    folio: "#F-0450",
    fecha: "25/08/2026 09:30",
    tipo: "ENTRADA",
    tipoLabel: "Entrada",
    cantidad: 95,
    origenDestino: "Distribuidora Papelera Central",
    responsableNombre: "C. Tapia",
    responsableRol: "Encargada de Bodega",
    balance: 95,
    documentoReferencia: "GD-8790",
    observaciones: "Lote de archivadores palanca oficio.",
    productoId: "BOD-003",
  },

  // Movimientos Plumones (BOD-004) - Balance inicial: 75
  {
    id: "MOV-PLU-01",
    folio: "#F-0465",
    fecha: "28/08/2026 12:00",
    tipo: "ENTRADA",
    tipoLabel: "Entrada",
    cantidad: 75,
    origenDestino: "Proveedor Artel / Compra Directa",
    responsableNombre: "C. Tapia",
    responsableRol: "Encargada de Bodega",
    balance: 75,
    documentoReferencia: "OC-2026-0304",
    observaciones: "Lote de plumones recargables para pizarras.",
    productoId: "BOD-004",
  },

  // Movimientos Alcohol Gel (BOD-005) - Balance inicial: 64
  {
    id: "MOV-ALC-01",
    folio: "#F-0430",
    fecha: "20/08/2026 15:10",
    tipo: "ENTRADA",
    tipoLabel: "Entrada",
    cantidad: 64,
    origenDestino: "Laboratorio Sanitas / Convenio Marco",
    responsableNombre: "J. Morales",
    responsableRol: "Administrador",
    balance: 64,
    documentoReferencia: "FAC-42110",
    observaciones: "Insumos de higiene y desinfección preventiva.",
    productoId: "BOD-005",
  },

  // Movimientos Sillas Alumno (BOD-006) - Balance inicial: 45
  {
    id: "MOV-SIL-01",
    folio: "#F-0410",
    fecha: "18/08/2026 11:45",
    tipo: "ENTRADA",
    tipoLabel: "Entrada",
    cantidad: 45,
    origenDestino: "Fábrica Mobiliario Escolar",
    responsableNombre: "R. Fuentes",
    responsableRol: "Encargado de Bodega",
    balance: 45,
    documentoReferencia: "RES-SLEP-104",
    observaciones: "Adquisición anual de mobiliario de reposición.",
    productoId: "BOD-006",
  },
];

export const PRODUCTO_GLOBAL: ProductoKardex = {
  id: "TODOS",
  codigo: "BOD-CONSOLIDADO",
  nombre: "Consolidado General — Todos los Insumos de Bodega Central",
  ubicacionBodega: "Bodega Central SLEP Los Libertadores",
  categoria: "Todas las categorías",
  unidadMedida: "Ítems",
  stockMinimoAlerta: 10,
  documentoReferencia: "Varios",
  stockInicial: 421,
};

@Injectable({
  providedIn: "root",
})
export class KardexService {
  // Catálogo completo de artículos
  readonly catalogoProductos = signal<ProductoKardex[]>(CATALOGO_PRODUCTOS_BODEGA);

  // Producto activo seleccionado en el visor de Kardex ('TODOS' o id de producto)
  readonly productoSeleccionadoId = signal<string>(this.cargarProductoActivoId());

  // Almacén general reactivo de movimientos
  private _movimientos = signal<MovimientoKardex[]>(this.cargarMovimientos());

  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private bitacoraService = inject(BitacoraService);

  // Filtros de búsqueda visual
  readonly filtroTipo = signal<string>("TODO");
  readonly terminoBusqueda = signal<string>("");

  // Producto actualmente en visualización (o consolidado)
  readonly producto = computed<ProductoKardex>(() => {
    const id = this.productoSeleccionadoId();
    if (id === "TODOS") {
      return PRODUCTO_GLOBAL;
    }
    return this.catalogoProductos().find((p) => p.id === id) || this.catalogoProductos()[0];
  });

  // Todos los movimientos sin filtrar por producto (para auditoría y despacho global)
  readonly todosLosMovimientos = this._movimientos.asReadonly();

  // Movimientos del producto actualmente seleccionado en Kardex (o todos si id === 'TODOS')
  readonly movimientos = computed<MovimientoKardex[]>(() => {
    const id = this.productoSeleccionadoId();
    if (id === "TODOS") {
      return this._movimientos();
    }
    return this._movimientos().filter((m) => (m.productoId || "BOD-001") === id);
  });

  // Stock actual del producto activo (o suma consolidada si 'TODOS')
  readonly stockActual = computed<number>(() => {
    const id = this.productoSeleccionadoId();
    if (id === "TODOS") {
      return this.catalogoProductos().reduce(
        (sum, p) => sum + this.getStockDeProducto(p.id),
        0,
      );
    }
    return this.getStockDeProducto(id);
  });

  // Obtener el stock dinámico de CUALQUIER producto del catálogo
  getStockDeProducto(productoId: string): number {
    const movs = this._movimientos().filter((m) => (m.productoId || "BOD-001") === productoId);
    if (movs.length > 0) {
      return movs[0].balance;
    }
    const prod = this.catalogoProductos().find((p) => p.id === productoId);
    return prod?.stockInicial ?? 0;
  }

  // Obtener la fecha del último movimiento registrado de un producto
  getUltimoMovimientoFecha(productoId: string): string {
    const movs = this._movimientos().filter((m) => (m.productoId || "BOD-001") === productoId);
    return movs.length > 0 ? movs[0].fecha : "—";
  }

  // Obtener nombre amigable de producto por ID
  getNombreProducto(productoId?: string): string {
    if (!productoId || productoId === "BOD-001") return "Papel bond 75g A4";
    const prod = this.catalogoProductos().find((p) => p.id === productoId);
    return prod ? prod.nombre : productoId;
  }

  // Obtener nombre corto para visualización compacta en tablas
  getNombreProductoCorto(productoId?: string): string {
    if (!productoId || productoId === "BOD-001") return "Papel bond A4";
    if (productoId === "BOD-002") return "Tóner HP LaserJet";
    if (productoId === "BOD-003") return "Archivadores Oficio";
    if (productoId === "BOD-004") return "Plumones Pizarra";
    if (productoId === "BOD-005") return "Dispensadores Gel";
    if (productoId === "BOD-006") return "Sillas de Alumno";
    const prod = this.catalogoProductos().find((p) => p.id === productoId);
    return prod ? prod.nombre.split("—")[0].trim() : productoId;
  }

  // Cambiar el producto activo en el visor de Kardex
  seleccionarProducto(productoId: string): void {
    if (productoId === "TODOS" || this.catalogoProductos().some((p) => p.id === productoId)) {
      this.productoSeleccionadoId.set(productoId);
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_KEY_PRODUCTO_ACTIVO, productoId);
      }
      this.filtroTipo.set("TODO");
      this.terminoBusqueda.set("");
    }
  }

  // Total acumulado de entradas del producto seleccionado
  readonly totalEntradas = computed<number>(() => {
    const movs = this.movimientos();
    return movs.reduce((acc, m) => (m.cantidad > 0 ? acc + m.cantidad : acc), 0);
  });

  // Total acumulado de salidas del producto seleccionado
  readonly totalSalidas = computed<number>(() => {
    const movs = this.movimientos();
    return movs.reduce((acc, m) => (m.cantidad < 0 ? acc + Math.abs(m.cantidad) : acc), 0);
  });

  // Alerta si el producto seleccionado está en stock crítico (o si alguno lo está en vista consolidada)
  readonly stockEsCritico = computed<boolean>(() => {
    const id = this.productoSeleccionadoId();
    if (id === "TODOS") {
      return this.catalogoProductos().some(
        (p) => this.getStockDeProducto(p.id) <= p.stockMinimoAlerta,
      );
    }
    return this.stockActual() <= this.producto().stockMinimoAlerta;
  });

  // Movimientos filtrados por término o tipo
  readonly movimientosFiltrados = computed<MovimientoKardex[]>(() => {
    const tipo = this.filtroTipo().toUpperCase();
    const query = this.terminoBusqueda().trim().toLowerCase();
    let lista = this.movimientos();

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

  constructor() {
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

  private cargarMovimientos(): MovimientoKardex[] {
    if (typeof localStorage === "undefined") return MOVIMIENTOS_INICIALES;
    const raw = localStorage.getItem(STORAGE_KEY_MOVIMIENTOS);
    if (raw) {
      try {
        const parsed: MovimientoKardex[] = JSON.parse(raw);
        // Garantizar que todos los productos del catálogo institucional existan en movimientos
        const productosConMovimiento = new Set(
          parsed.map((m) => m.productoId || "BOD-001"),
        );
        const faltantes: MovimientoKardex[] = [];
        for (const prod of CATALOGO_PRODUCTOS_BODEGA) {
          if (!productosConMovimiento.has(prod.id)) {
            const movsProd = MOVIMIENTOS_INICIALES.filter(
              (m) => m.productoId === prod.id,
            );
            faltantes.push(...movsProd);
          }
        }
        if (faltantes.length > 0) {
          const combinada = [...parsed, ...faltantes];
          localStorage.setItem(STORAGE_KEY_MOVIMIENTOS, JSON.stringify(combinada));
          return combinada;
        }
        return parsed;
      } catch {
        localStorage.removeItem(STORAGE_KEY_MOVIMIENTOS);
      }
    }
    return MOVIMIENTOS_INICIALES;
  }

  private cargarProductoActivoId(): string {
    if (typeof localStorage === "undefined") return "TODOS";
    return localStorage.getItem(STORAGE_KEY_PRODUCTO_ACTIVO) || "TODOS";
  }

  private guardar(movimientos: MovimientoKardex[]): void {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY_MOVIMIENTOS, JSON.stringify(movimientos));
    }
    this._movimientos.set(movimientos);
  }

  // Registrar nuevo movimiento vinculado al producto correcto
  registrarMovimiento(dto: NuevoMovimientoDTO): {
    exito: boolean;
    mensaje: string;
  } {
    const productoIdObjetivo =
      dto.productoId && dto.productoId !== "TODOS"
        ? dto.productoId
        : this.productoSeleccionadoId() !== "TODOS"
          ? this.productoSeleccionadoId()
          : "BOD-001";

    const prod =
      this.catalogoProductos().find((p) => p.id === productoIdObjetivo) ||
      this.catalogoProductos()[0];
    const stockActual = this.getStockDeProducto(productoIdObjetivo);

    const esDescuento = dto.tipo === "SALIDA" || dto.tipo === "TRASLADO";

    if (esDescuento && dto.cantidad > stockActual) {
      return {
        exito: false,
        mensaje: `Stock insuficiente para ${prod.nombre}. Disponible actual: ${stockActual} ${prod.unidadMedida}.`,
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
    const nuevoBalance =
      dto.tipo === "AJUSTE" ? dto.cantidad : stockActual + cantidadAplicada;

    const correlativo =
      522 + (this._movimientos().length - MOVIMIENTOS_INICIALES.length);
    const folioGenerado = `#F-${String(correlativo).padStart(4, "0")}`;

    const now = new Date();
    const dia = String(now.getDate()).padStart(2, "0");
    const mes = String(now.getMonth() + 1).padStart(2, "0");
    const anio = now.getFullYear();
    const hora = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    const fechaHora = `${dia}/${mes}/${anio} ${hora}:${min}`;

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

    const docRefFinal =
      dto.documentoReferencia?.trim() || prod.documentoReferencia || "—";

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
      documentoReferencia: docRefFinal,
      observaciones: dto.observaciones?.trim() || "",
      productoId: productoIdObjetivo,
    };

    // Insertar al inicio de la lista
    const nuevaLista = [nuevoMovimiento, ...this._movimientos()];
    this.guardar(nuevaLista);

    // Si no estábamos en vista consolidada 'TODOS', activar el producto movido
    if (
      this.productoSeleccionadoId() !== "TODOS" &&
      this.productoSeleccionadoId() !== productoIdObjetivo
    ) {
      this.seleccionarProducto(productoIdObjetivo);
    }

    // Bitácora Auditable de Transacciones
    const decision = dto.tipo === "AJUSTE" ? "AJUSTADO" : "EJECUTADO";
    this.bitacoraService.registrarTransaccion({
      folio: docRefFinal !== "—" ? docRefFinal : folioGenerado,
      modulo: "EXISTENCIAS",
      accion: `Movimiento de Existencias (${prod.nombre}): ${etiquetas[dto.tipo]} (${dto.origenDestino})`,
      decision: decision,
      justificacion:
        dto.observaciones?.trim() ||
        `Operación de bodega ${etiquetas[dto.tipo]} para ${prod.nombre} con destino/origen: ${dto.origenDestino}`,
      valores_anteriores: {
        item_codigo: prod.codigo,
        item_nombre: prod.nombre,
        saldo_stock: stockActual,
      },
      valores_posteriores: {
        item_codigo: prod.codigo,
        item_nombre: prod.nombre,
        cantidad_operacion: cantidadAplicada,
        saldo_stock: nuevoBalance,
        documento_respaldo: docRefFinal,
      },
      usuario_nombre: responsableNombre,
      usuario_perfil: responsableRol,
    });

    // Sincronizar con backend si está disponible
    this.http
      .post("http://127.0.0.1:8000/api/kardex", {
        activo_codigo: prod.codigo,
        activo_nombre: prod.nombre,
        fecha_registro: fechaHora,
        tipo_movimiento: dto.tipo,
        origen_destino: dto.origenDestino,
        responsable: responsableNombre,
        cantidad: cantidadAplicada,
        saldo: nuevoBalance,
        estado_stock:
          nuevoBalance <= prod.stockMinimoAlerta ? "CRITICO" : "DISPONIBLE",
        documento_respaldo: docRefFinal !== "—" ? docRefFinal : null,
      })
      .subscribe({
        next: () =>
          console.log("Movimiento de kardex persistido en Base de Datos."),
        error: () =>
          console.warn(
            "Aviso: BD no disponible para persistencia directa de kardex.",
          ),
      });

    return {
      exito: true,
      mensaje: `Movimiento de ${prod.nombre} registrado con éxito. Nuevo balance: ${nuevoBalance} ${prod.unidadMedida}.`,
    };
  }

  setFiltro(tipo: string): void {
    this.filtroTipo.set(tipo);
  }

  setBusqueda(query: string): void {
    this.terminoBusqueda.set(query);
  }

  restablecerDatos(): void {
    const copias: MovimientoKardex[] = JSON.parse(
      JSON.stringify(MOVIMIENTOS_INICIALES),
    );

    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY_MOVIMIENTOS, JSON.stringify(copias));
      localStorage.setItem(STORAGE_KEY_PRODUCTO_ACTIVO, "TODOS");
    }
    this._movimientos.set(copias);
    this.productoSeleccionadoId.set("TODOS");

    this.http.post("http://127.0.0.1:8000/api/kardex/reset", {}).subscribe({
      next: () => console.log("Kardex de bodega reiniciado en Base de Datos."),
      error: () =>
        console.warn(
          "Aviso: Base de datos no conectada para reset de kardex, reiniciado localmente.",
        ),
    });
  }

  exportarCSV(): void {
    const lista = this.movimientosFiltrados();
    const prod = this.producto();

    const headers = [
      "Folio",
      "Fecha",
      "Insumo / Producto",
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
      `"${this.getNombreProducto(m.productoId)}"`,
      `"${m.tipoLabel}"`,
      m.cantidad,
      `"${m.origenDestino}"`,
      `"${m.responsableNombre}"`,
      `"${m.documentoReferencia || "—"}"`,
      m.balance,
      `"${(m.observaciones || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "\uFEFF" +
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
