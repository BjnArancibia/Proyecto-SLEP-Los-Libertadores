import { Injectable, signal, computed, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {
  TransaccionBitacora,
  FiltrosBitacora,
  ModuloBitacora,
} from "../models/bitacora.model";

const STORAGE_KEY = "slep_bitacora_transacciones";
const API_URL = "http://127.0.0.1:8000/api/bitacora";

const TRANSACCIONES_INICIALES: TransaccionBitacora[] = [
  {
    id: 1,
    folio: "AF-2023-01847",
    fecha_hora: "30/09/2026 09:15",
    usuario_id: 1,
    usuario_nombre: "Carmen Tapia",
    usuario_perfil: "SOLICITANTE",
    modulo: "ACTIVOS",
    accion: "Alta de Activo Fijo",
    decision: "REGISTRADO",
    justificacion:
      "Incorporación al patrimonio institucional según factura de compra F-88391.",
    valores_anteriores: null,
    valores_posteriores: {
      numero_patrimonial: "AF-2023-01847",
      nombre: "Escritorio ejecutivo ergonómico",
      marca_modelo: "Steelcase Actiu Pro",
      estado_conservacion: "Bueno",
      establecimiento: "Bodega Central SLEP",
      dependencia_sala: "Piso 1 - Recepción",
      custodio: "Carmen Tapia",
    },
    ip_origen: "192.168.1.45",
  },
  {
    id: 2,
    folio: "SOL-2026-0421",
    fecha_hora: "02/10/2026 10:30",
    usuario_id: 1,
    usuario_nombre: "Carmen Tapia",
    usuario_perfil: "SOLICITANTE",
    modulo: "SOLICITUDES",
    accion: "Creación de Solicitud de Traslado",
    decision: "PENDIENTE_REVISION",
    justificacion:
      "Necesidad urgente de mobiliario para sala de profesores de sede El Palqui.",
    valores_anteriores: null,
    valores_posteriores: {
      codigo_solicitud: "SOL-2026-0421",
      tipo: "TRASLADO",
      estado: "PENDIENTE_REVISION",
      activo_codigo: "AF-2023-01847",
      origen: "Esc. Los Andes",
      destino: "Esc. El Palqui",
      solicitante: "Carmen Tapia",
    },
    ip_origen: "192.168.1.45",
  },
  {
    id: 3,
    folio: "SOL-2026-0421",
    fecha_hora: "02/10/2026 14:20",
    usuario_id: 2,
    usuario_nombre: "Pedro Henríquez",
    usuario_perfil: "APROBADOR",
    modulo: "SOLICITUDES",
    accion: "Resolución de Solicitud de Traslado",
    decision: "APROBADO",
    justificacion:
      "Aprobado tras verificar disponibilidad de inventario y justificación docente.",
    valores_anteriores: {
      codigo_solicitud: "SOL-2026-0421",
      estado: "PENDIENTE_REVISION",
      aprobador: null,
      fecha_resolucion: null,
    },
    valores_posteriores: {
      codigo_solicitud: "SOL-2026-0421",
      estado: "APROBADO",
      aprobador: "Pedro Henríquez",
      fecha_resolucion: "02/10/2026 14:20",
    },
    ip_origen: "192.168.1.12",
  },
  {
    id: 4,
    folio: "KD-2026-0089",
    fecha_hora: "03/10/2026 08:45",
    usuario_id: 3,
    usuario_nombre: "Raúl Morales",
    usuario_perfil: "ENCARGADO_BODEGA",
    modulo: "EXISTENCIAS",
    accion: "Despacho de Traslado en Bodega",
    decision: "EJECUTADO",
    justificacion:
      "Entrega física a chofer institucional según guía de despacho GD-4491.",
    valores_anteriores: {
      activo_codigo: "AF-2023-01847",
      ubicacion_actual: "Esc. Los Andes",
      estado_stock: "DISPONIBLE",
    },
    valores_posteriores: {
      activo_codigo: "AF-2023-01847",
      ubicacion_actual: "Esc. El Palqui",
      estado_stock: "EN_TRANSITO",
      documento_guia: "GD-4491",
    },
    ip_origen: "192.168.1.78",
  },
  {
    id: 5,
    folio: "KD-2026-0095",
    fecha_hora: "04/10/2026 16:10",
    usuario_id: 4,
    usuario_nombre: "Valeska Soto",
    usuario_perfil: "ADMIN",
    modulo: "EXISTENCIAS",
    accion: "Ajuste de Conteo Físico de Existencias",
    decision: "AJUSTADO",
    justificacion:
      "Corrección tras inventario trimestral sorpresivo de insumos en bodega central.",
    valores_anteriores: {
      item_codigo: "INS-2026-0044",
      item_nombre: "Papel Fotocopia Carta 75g",
      saldo_stock: 120,
      estado: "DISPONIBLE",
    },
    valores_posteriores: {
      item_codigo: "INS-2026-0044",
      item_nombre: "Papel Fotocopia Carta 75g",
      saldo_stock: 115,
      diferencia: -5,
      estado: "DISPONIBLE",
    },
    ip_origen: "192.168.1.10",
  },
];

@Injectable({
  providedIn: "root",
})
export class BitacoraService {
  private http = inject(HttpClient);

  private _transacciones = signal<TransaccionBitacora[]>(
    this.cargarTransaccionesIniciales(),
  );
  readonly transacciones = this._transacciones.asReadonly();

  // Filtros reactivos
  private _filtroTexto = signal<string>("");
  private _filtroModulo = signal<ModuloBitacora | "TODOS">("TODOS");
  private _filtroDecision = signal<string>("TODAS");

  readonly filtroTexto = this._filtroTexto.asReadonly();
  readonly filtroModulo = this._filtroModulo.asReadonly();
  readonly filtroDecision = this._filtroDecision.asReadonly();

  // Lista filtrada reactiva
  readonly transaccionesFiltradas = computed(() => {
    let lista = this._transacciones();
    const texto = this._filtroTexto().trim().toLowerCase();
    const modulo = this._filtroModulo();
    const decision = this._filtroDecision();

    if (modulo !== "TODOS") {
      lista = lista.filter((t) => t.modulo === modulo);
    }

    if (decision !== "TODAS") {
      lista = lista.filter(
        (t) => t.decision.toUpperCase() === decision.toUpperCase(),
      );
    }

    if (texto) {
      lista = lista.filter(
        (t) =>
          t.folio.toLowerCase().includes(texto) ||
          t.usuario_nombre.toLowerCase().includes(texto) ||
          t.usuario_perfil.toLowerCase().includes(texto) ||
          t.accion.toLowerCase().includes(texto) ||
          t.justificacion.toLowerCase().includes(texto),
      );
    }

    return lista;
  });

  // Estadísticas computadas para dashboard de bitácora
  readonly totalTransacciones = computed(() => this._transacciones().length);
  readonly totalActivos = computed(
    () => this._transacciones().filter((t) => t.modulo === "ACTIVOS").length,
  );
  readonly totalExistencias = computed(
    () =>
      this._transacciones().filter((t) => t.modulo === "EXISTENCIAS").length,
  );
  readonly totalSolicitudes = computed(
    () =>
      this._transacciones().filter((t) => t.modulo === "SOLICITUDES").length,
  );

  constructor() {
    this.sincronizarConBackend();

    // Sincronización entre pestañas del navegador
    if (typeof window !== "undefined") {
      window.addEventListener("storage", (event) => {
        if (event.key === STORAGE_KEY && event.newValue) {
          try {
            this._transacciones.set(JSON.parse(event.newValue));
          } catch {
            // Ignorar errores de deserialización
          }
        }
      });
    }
  }

  setFiltroTexto(texto: string): void {
    this._filtroTexto.set(texto);
  }

  setFiltroModulo(modulo: ModuloBitacora | "TODOS"): void {
    this._filtroModulo.set(modulo);
  }

  setFiltroDecision(decision: string): void {
    this._filtroDecision.set(decision);
  }

  private cargarTransaccionesIniciales(): TransaccionBitacora[] {
    if (typeof localStorage === "undefined") return TRANSACCIONES_INICIALES;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    return TRANSACCIONES_INICIALES;
  }

  private guardarLocal(transacciones: TransaccionBitacora[]): void {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transacciones));
    }
    this._transacciones.set(transacciones);
  }

  // Consulta al backend para sincronización
  sincronizarConBackend(): void {
    this.http.get<any[]>(API_URL).subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          const formateadas: TransaccionBitacora[] = data.map((item) => ({
            id: item.id,
            folio: item.folio,
            fecha_hora: item.fecha_hora
              ? this.formatearFecha(item.fecha_hora)
              : new Date().toLocaleString("es-CL"),
            usuario_id: item.usuario_id,
            usuario_nombre: item.usuario_nombre,
            usuario_perfil: item.usuario_perfil,
            modulo: item.modulo,
            accion: item.accion,
            decision: item.decision || "REGISTRADO",
            justificacion: item.justificacion || "",
            valores_anteriores:
              typeof item.valores_anteriores === "string"
                ? JSON.parse(item.valores_anteriores)
                : item.valores_anteriores,
            valores_posteriores:
              typeof item.valores_posteriores === "string"
                ? JSON.parse(item.valores_posteriores)
                : item.valores_posteriores,
            ip_origen: item.ip_origen,
          }));
          this.guardarLocal(formateadas);
        }
      },
      error: () => {
        // En caso de que el backend no responda, se mantiene el estado local
      },
    });
  }

  // Registro de una nueva transacción
  registrarTransaccion(datos: {
    folio: string;
    modulo: ModuloBitacora;
    accion: string;
    decision: string;
    justificacion: string;
    valores_anteriores: Record<string, any> | null;
    valores_posteriores: Record<string, any> | null;
    usuario_nombre?: string;
    usuario_perfil?: string;
  }): TransaccionBitacora {
    const ahora = new Date();
    const dia = String(ahora.getDate()).padStart(2, "0");
    const mes = String(ahora.getMonth() + 1).padStart(2, "0");
    const anio = ahora.getFullYear();
    const hora = String(ahora.getHours()).padStart(2, "0");
    const min = String(ahora.getMinutes()).padStart(2, "0");
    const fechaHoraFormateada = `${dia}/${mes}/${anio} ${hora}:${min}`;

    const nuevaTransaccion: TransaccionBitacora = {
      id: Date.now(),
      folio: datos.folio,
      fecha_hora: fechaHoraFormateada,
      usuario_nombre: datos.usuario_nombre || "Sistema",
      usuario_perfil: datos.usuario_perfil || "ADMIN",
      modulo: datos.modulo,
      accion: datos.accion,
      decision: datos.decision,
      justificacion: datos.justificacion,
      valores_anteriores: datos.valores_anteriores,
      valores_posteriores: datos.valores_posteriores,
      ip_origen: "192.168.1." + Math.floor(Math.random() * 80 + 10),
    };

    const actualizadas = [nuevaTransaccion, ...this._transacciones()];
    this.guardarLocal(actualizadas);

    // Intentar persistir en el backend en segundo plano
    this.http
      .post(API_URL, {
        folio: datos.folio,
        modulo: datos.modulo,
        accion: datos.accion,
        decision: datos.decision,
        justificacion: datos.justificacion,
        valores_anteriores: datos.valores_anteriores,
        valores_posteriores: datos.valores_posteriores,
        usuario_nombre: datos.usuario_nombre,
        usuario_perfil: datos.usuario_perfil,
      })
      .subscribe({
        next: () => {},
        error: () => {},
      });

    return nuevaTransaccion;
  }

  // Reinicia bitácora auditable a los registros históricos predefinidos.

  reiniciarBitacora(): void {
    this.http.post(`${API_URL}/reset`, {}).subscribe({
      next: () => {
        this.sincronizarConBackend();
      },
      error: () => {
        this.guardarLocal(TRANSACCIONES_INICIALES);
      },
    });
    this.guardarLocal(TRANSACCIONES_INICIALES);
  }

  private formatearFecha(isoString: string): string {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      const dia = String(d.getDate()).padStart(2, "0");
      const mes = String(d.getMonth() + 1).padStart(2, "0");
      const anio = d.getFullYear();
      const hora = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      return `${dia}/${mes}/${anio} ${hora}:${min}`;
    } catch {
      return isoString;
    }
  }
}
