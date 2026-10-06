// Flujo Electrónico de Movimientos con Segregación de Funciones

export type TipoMovimiento =
  | "ALTA"
  | "TRASLADO"
  | "ASIGNACION"
  | "DEVOLUCION"
  | "BAJA";

export type EstadoMovimiento =
  | "PENDIENTE_REVISION" // Solicitada, esperando aprobación
  | "APROBADO" // Autorizada por el aprobador/admin, esperando ejecución en bodega
  | "RECHAZADO" // Rechazada por el aprobador/admin (fin del flujo)
  | "EJECUTADO"; // Ejecutada físicamente por bodega (flujo completado)

export interface EventoBitacora {
  id: string;
  fecha: string;
  accion: string;
  usuarioNombre: string;
  usuarioRol: string;
  comentario?: string;
  tipoPunto: "verde" | "azul" | "gris" | "rojo";
}

export interface SolicitudMovimiento {
  id: string; // Ej: 'SOL-2026-0421'
  tipo: TipoMovimiento; // Ej: 'TRASLADO'
  estado: EstadoMovimiento; // Estado actual del ciclo de vida
  fechaCreacion: string; // Ej: '08/09/2026 09:14'

  // Datos del activo
  activoCodigo: string; // Ej: 'AF-2023-01847'
  activoNombre: string; // Ej: 'Escritorio ejecutivo ergonómico'

  // Ubicaciones
  origen: string; // Ej: 'Esc. Los Andes'
  destino: string; // Ej: 'Esc. El Palqui'

  // Solicitante
  solicitanteId: number; // ID único del usuario que solicita
  solicitanteNombre: string; // Ej: 'Carmen Tapia'
  solicitanteRol: string; // Ej: 'SOLICITANTE'
  solicitanteEstablecimiento: string;
  justificacion: string; // Motivo ingresado por el solicitante

  // Resolución (Aprobación / Rechazo)
  aprobadorId?: number;
  aprobadorNombre?: string;
  resolucionFecha?: string;
  resolucionComentario?: string;

  // Ejecución física (Bodega)
  ejecutorId?: number;
  ejecutorNombre?: string;
  ejecucionFecha?: string;

  // Historial y auditoría de la solicitud
  bitacora: EventoBitacora[];
}
