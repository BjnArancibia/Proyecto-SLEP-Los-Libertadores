import { Injectable, signal, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {
  SolicitudMovimiento,
  EventoBitacora,
} from "../models/movimiento.model";
import { Usuario } from "./auth.service";
import { BitacoraService } from "./bitacora.service";

const STORAGE_KEY = "slep_movimientos_mock";

// Datos de prueba iniciales alineados con el mockup flujo_aprobacion_v3.html
const SOLICITUDES_INICIALES: SolicitudMovimiento[] = [
  {
    id: "SOL-2026-0421",
    tipo: "TRASLADO",
    estado: "PENDIENTE_REVISION",
    fechaCreacion: "08/09/2026 09:14",
    activoCodigo: "AF-2023-01847",
    activoNombre: "Escritorio ejecutivo ergonómico",
    origen: "Esc. Los Andes",
    destino: "Esc. El Palqui",
    solicitanteId: 1, // Carmen Tapia
    solicitanteNombre: "Carmen Tapia",
    solicitanteRol: "Solicitante",
    solicitanteEstablecimiento: "Escuela Los Andes",
    justificacion:
      "Necesidad urgente de mobiliario para sala de profesores de sede El Palqui.",
    bitacora: [
      {
        id: "BIT-01",
        fecha: "08/09/2026 09:14",
        accion: "Solicitud creada y enviada a revisión",
        usuarioNombre: "Carmen Tapia",
        usuarioRol: "Solicitante",
        tipoPunto: "verde",
      },
      {
        id: "BIT-02",
        fecha: "08/09/2026 09:14",
        accion: "Asignada al aprobador Pedro Henríquez",
        usuarioNombre: "Sistema automático",
        usuarioRol: "Sistema",
        tipoPunto: "azul",
      },
      {
        id: "BIT-03",
        fecha: "08/09/2026 09:15",
        accion: "Pendiente de resolución",
        usuarioNombre: "A la espera de decisión del aprobador",
        usuarioRol: "",
        tipoPunto: "gris",
      },
    ],
  },
  {
    id: "SOL-2026-0422",
    tipo: "BAJA",
    estado: "PENDIENTE_REVISION",
    fechaCreacion: "08/09/2026 11:30",
    activoCodigo: "AF-2021-00912",
    activoNombre: "Servidor ProLiant DL380 G9",
    origen: "Bodega Central SLEP",
    destino: "Baja definitiva / Reciclaje RAEE",
    solicitanteId: 2, // Creada por Pedro Henríquez (Aprobador) -> Demuestra NO-autoaprobación!
    solicitanteNombre: "Pedro Henríquez",
    solicitanteRol: "Aprobador",
    solicitanteEstablecimiento: "Escuela Los Andes",
    justificacion:
      "Equipo con placa madre dañada y fuera de garantía. Declarado irreparable por soporte TI.",
    bitacora: [
      {
        id: "BIT-11",
        fecha: "08/09/2026 11:30",
        accion: "Solicitud de baja creada por Pedro Henríquez",
        usuarioNombre: "Pedro Henríquez",
        usuarioRol: "Aprobador",
        tipoPunto: "verde",
      },
      {
        id: "BIT-12",
        fecha: "08/09/2026 11:30",
        accion:
          "Bloqueo de autoaprobación aplicado: Requiere visto bueno de Admin",
        usuarioNombre: "Sistema de Segregación de Funciones",
        usuarioRol: "Seguridad RF-03",
        tipoPunto: "azul",
      },
    ],
  },
];

export interface ResultadoValidacion {
  puedeAprobar: boolean;
  esAutoaprobacion: boolean;
  motivoBloqueo?: string;
}

@Injectable({
  providedIn: "root",
})
export class MovimientosService {
  private _solicitudes = signal<SolicitudMovimiento[]>(
    this.cargarSolicitudes(),
  );
  readonly solicitudes = this._solicitudes.asReadonly();

  // Solicitud activa seleccionada para visualizar en la pantalla
  private _solicitudActivaId = signal<string>("SOL-2026-0421");
  readonly solicitudActivaId = this._solicitudActivaId.asReadonly();

  private http = inject(HttpClient);
  private bitacoraService = inject(BitacoraService);

  constructor() {}

  /** Carga solicitudes desde localStorage o usa los datos mock iniciales */
  private cargarSolicitudes(): SolicitudMovimiento[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    return SOLICITUDES_INICIALES;
  }

  private guardar(solicitudes: SolicitudMovimiento[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(solicitudes));
    this._solicitudes.set(solicitudes);
  }

  /** Obtiene la solicitud activa */
  getSolicitudActual(): SolicitudMovimiento | undefined {
    return this._solicitudes().find((s) => s.id === this._solicitudActivaId());
  }

  seleccionarSolicitud(id: string): void {
    this._solicitudActivaId.set(id);
  }

  /**
   * REGLA DE ORO DEL RF-03: Segregación de Funciones y Prohibición de Autoaprobación
   */
  validarPermisoAprobacion(
    solicitud: SolicitudMovimiento,
    usuario: Usuario | null,
  ): ResultadoValidacion {
    if (!usuario) {
      return {
        puedeAprobar: false,
        esAutoaprobacion: false,
        motivoBloqueo: "Debes iniciar sesión para resolver solicitudes.",
      };
    }

    // 1. Prohibición estricta de autoaprobación
    if (
      solicitud.solicitanteId === usuario.id ||
      (solicitud.solicitanteNombre &&
        solicitud.solicitanteNombre.toLowerCase() ===
          `${usuario.nombre} ${usuario.apellido}`.toLowerCase())
    ) {
      return {
        puedeAprobar: false,
        esAutoaprobacion: true,
        motivoBloqueo:
          "El solicitante no puede aprobar su propia solicitud. Este registro debe ser resuelto por otro aprobador o administrador.",
      };
    }

    // 2. Rol con privilegios de autorización
    const tieneRolAutorizado =
      usuario.rol === "APROBADOR" || usuario.rol === "ADMIN";
    if (!tieneRolAutorizado) {
      return {
        puedeAprobar: false,
        esAutoaprobacion: false,
        motivoBloqueo: `Tu rol (${usuario.rol}) no tiene autorización para aprobar o rechazar solicitudes.`,
      };
    }

    // 3. Estado de la solicitud
    if (solicitud.estado !== "PENDIENTE_REVISION") {
      return {
        puedeAprobar: false,
        esAutoaprobacion: false,
        motivoBloqueo: `Esta solicitud ya fue resuelta (Estado: ${solicitud.estado}).`,
      };
    }

    return {
      puedeAprobar: true,
      esAutoaprobacion: false,
    };
  }

  /** Aprobar solicitud con justificación obligatoria */
  aprobarSolicitud(
    id: string,
    comentario: string,
    usuario: Usuario,
  ): { exito: boolean; mensaje: string } {
    const solicitud = this._solicitudes().find((s) => s.id === id);
    if (!solicitud)
      return { exito: false, mensaje: "Solicitud no encontrada." };

    const validacion = this.validarPermisoAprobacion(solicitud, usuario);
    if (!validacion.puedeAprobar) {
      return {
        exito: false,
        mensaje: validacion.motivoBloqueo || "No autorizado.",
      };
    }

    if (!comentario || comentario.trim().length < 5) {
      return {
        exito: false,
        mensaje: "Debe ingresar una justificación para aprobar.",
      };
    }

    const ahora = new Date().toLocaleString("es-CL");
    const nuevoEvento: EventoBitacora = {
      id: `BIT-${Date.now()}`,
      fecha: ahora,
      accion: `Solicitud APROBADA: ${comentario.trim()}`,
      usuarioNombre: `${usuario.nombre} ${usuario.apellido}`,
      usuarioRol: usuario.rol,
      comentario: comentario.trim(),
      tipoPunto: "verde",
    };

    const actualizadas = this._solicitudes().map((s) => {
      if (s.id === id) {
        return {
          ...s,
          estado: "APROBADO" as const,
          aprobadorId: usuario.id,
          aprobadorNombre: `${usuario.nombre} ${usuario.apellido}`,
          resolucionFecha: ahora,
          resolucionComentario: comentario.trim(),
          bitacora: [...s.bitacora, nuevoEvento],
        };
      }
      return s;
    });

    this.guardar(actualizadas);

    // Bitácora de transacciones
    this.bitacoraService.registrarTransaccion({
      folio: solicitud.id,
      modulo: "SOLICITUDES",
      accion: `Resolución de Solicitud de ${solicitud.tipo}`,
      decision: "APROBADO",
      justificacion: comentario.trim(),
      valores_anteriores: {
        codigo_solicitud: solicitud.id,
        estado: solicitud.estado,
        aprobador: null,
      },
      valores_posteriores: {
        codigo_solicitud: solicitud.id,
        estado: "APROBADO",
        aprobador: `${usuario.nombre} ${usuario.apellido}`,
        fecha_resolucion: ahora,
        comentario_resolucion: comentario.trim(),
      },
      usuario_nombre: `${usuario.nombre} ${usuario.apellido}`,
      usuario_perfil: usuario.rol,
    });

    return { exito: true, mensaje: "Solicitud aprobada exitosamente." };
  }

  // Rechazo de solicitud con justificación obligatoria
  rechazarSolicitud(
    id: string,
    motivo: string,
    usuario: Usuario,
  ): { exito: boolean; mensaje: string } {
    const solicitud = this._solicitudes().find((s) => s.id === id);
    if (!solicitud)
      return { exito: false, mensaje: "Solicitud no encontrada." };

    const validacion = this.validarPermisoAprobacion(solicitud, usuario);
    if (!validacion.puedeAprobar) {
      return {
        exito: false,
        mensaje: validacion.motivoBloqueo || "No autorizado.",
      };
    }

    if (!motivo || motivo.trim().length < 5) {
      return {
        exito: false,
        mensaje: "Debe ingresar un motivo para el rechazo.",
      };
    }

    const ahora = new Date().toLocaleString("es-CL");
    const nuevoEvento: EventoBitacora = {
      id: `BIT-${Date.now()}`,
      fecha: ahora,
      accion: `Solicitud RECHAZADA: ${motivo.trim()}`,
      usuarioNombre: `${usuario.nombre} ${usuario.apellido}`,
      usuarioRol: usuario.rol,
      comentario: motivo.trim(),
      tipoPunto: "rojo",
    };

    const actualizadas = this._solicitudes().map((s) => {
      if (s.id === id) {
        return {
          ...s,
          estado: "RECHAZADO" as const,
          aprobadorId: usuario.id,
          aprobadorNombre: `${usuario.nombre} ${usuario.apellido}`,
          resolucionFecha: ahora,
          resolucionComentario: motivo.trim(),
          bitacora: [...s.bitacora, nuevoEvento],
        };
      }
      return s;
    });

    this.guardar(actualizadas);

    // Bitácora Auditable de Transacciones
    this.bitacoraService.registrarTransaccion({
      folio: solicitud.id,
      modulo: "SOLICITUDES",
      accion: `Resolución de Solicitud de ${solicitud.tipo}`,
      decision: "RECHAZADO",
      justificacion: motivo.trim(),
      valores_anteriores: {
        codigo_solicitud: solicitud.id,
        estado: solicitud.estado,
        aprobador: null,
      },
      valores_posteriores: {
        codigo_solicitud: solicitud.id,
        estado: "RECHAZADO",
        aprobador: `${usuario.nombre} ${usuario.apellido}`,
        fecha_resolucion: ahora,
        comentario_resolucion: motivo.trim(),
      },
      usuario_nombre: `${usuario.nombre} ${usuario.apellido}`,
      usuario_perfil: usuario.rol,
    });

    return { exito: true, mensaje: "Solicitud rechazada." };
  }

  // Ejecutar movimiento físico en bodega
  ejecutarEnBodega(
    id: string,
    usuario: Usuario,
  ): { exito: boolean; mensaje: string } {
    const solicitud = this._solicitudes().find((s) => s.id === id);
    if (!solicitud)
      return { exito: false, mensaje: "Solicitud no encontrada." };

    if (usuario.rol !== "ENCARGADO_BODEGA" && usuario.rol !== "ADMIN") {
      return {
        exito: false,
        mensaje:
          "Solo el Encargado de Bodega o el Administrador pueden registrar la ejecución física.",
      };
    }

    if (solicitud.estado !== "APROBADO") {
      return {
        exito: false,
        mensaje: "La solicitud debe estar aprobada para ejecutarse.",
      };
    }

    const ahora = new Date().toLocaleString("es-CL");
    const nuevoEvento: EventoBitacora = {
      id: `BIT-${Date.now()}`,
      fecha: ahora,
      accion: "Movimiento ejecutado físicamente en bodega / Cierre de registro",
      usuarioNombre: `${usuario.nombre} ${usuario.apellido}`,
      usuarioRol: usuario.rol,
      tipoPunto: "verde",
    };

    const actualizadas = this._solicitudes().map((s) => {
      if (s.id === id) {
        return {
          ...s,
          estado: "EJECUTADO" as const,
          ejecutorId: usuario.id,
          ejecutorNombre: `${usuario.nombre} ${usuario.apellido}`,
          ejecucionFecha: ahora,
          bitacora: [...s.bitacora, nuevoEvento],
        };
      }
      return s;
    });

    this.guardar(actualizadas);

    this.bitacoraService.registrarTransaccion({
      folio: solicitud.id,
      modulo: "SOLICITUDES",
      accion: `Ejecución física en bodega de ${solicitud.tipo}`,
      decision: "EJECUTADO",
      justificacion: `Movimiento de ${solicitud.activoNombre} completado físicamente desde ${solicitud.origen} hacia ${solicitud.destino}`,
      valores_anteriores: {
        codigo_solicitud: solicitud.id,
        estado: solicitud.estado,
      },
      valores_posteriores: {
        codigo_solicitud: solicitud.id,
        estado: "EJECUTADO",
        ejecutor: `${usuario.nombre} ${usuario.apellido}`,
        fecha_ejecucion: ahora,
      },
      usuario_nombre: `${usuario.nombre} ${usuario.apellido}`,
      usuario_perfil: usuario.rol,
    });

    return {
      exito: true,
      mensaje: "Movimiento ejecutado en bodega y registrado con éxito.",
    };
  }

  // Reiniciar solicitudes en memoria local, localStorage y BD
  reiniciarSolicitudes(): void {
    const copias: SolicitudMovimiento[] = JSON.parse(
      JSON.stringify(SOLICITUDES_INICIALES),
    );

    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(copias));
    }
    this._solicitudes.set(copias);
    this._solicitudActivaId.set("SOL-2026-0421");
    this.bitacoraService.reiniciarBitacora();

    // Sincronizar reinicio con base de datos en backend
    this.http
      .post("http://127.0.0.1:8000/api/movimientos/reset", {})
      .subscribe({
        next: () => console.log("Solicitudes reiniciadas en Base de Datos."),
        error: () =>
          console.warn(
            "Aviso: Base de datos no conectada para reset, reiniciado en local.",
          ),
      });
  }

  reiniciarDatosMock(): void {
    this.reiniciarSolicitudes();
  }
}
