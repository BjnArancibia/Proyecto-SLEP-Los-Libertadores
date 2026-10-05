// Almacena de forma automática el histórico para cada operación sobre activos y existencias:

export type ModuloBitacora = "ACTIVOS" | "EXISTENCIAS" | "SOLICITUDES";

export type DecisionBitacora =
  | "REGISTRADO"
  | "ACTUALIZADO"
  | "APROBADO"
  | "RECHAZADO"
  | "AJUSTADO"
  | "EJECUTADO"
  | "PENDIENTE_REVISION";

export interface TransaccionBitacora {
  id: number | string;
  folio: string;
  fecha_hora: string;
  usuario_id?: number | null;
  usuario_nombre: string;
  usuario_perfil: string; // solicitante, aprobador, encargado_bodega, admin
  modulo: ModuloBitacora;
  accion: string; // Descripción de operación
  decision: DecisionBitacora | string;
  justificacion: string;
  valores_anteriores: Record<string, any> | null; // Snapshot previo (null en altas)
  valores_posteriores: Record<string, any> | null; // Snapshot resultante
  ip_origen?: string;
}

export interface FiltrosBitacora {
  textoBusqueda?: string;
  modulo?: ModuloBitacora | "TODOS";
  decision?: string | "TODAS";
  fechaInicio?: string;
  fechaFin?: string;
}
