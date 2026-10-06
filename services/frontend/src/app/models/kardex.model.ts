// Modelos y Contratos para RF-04: Control de Stock y Kardex de Bodega en Tiempo Real

export type TipoMovimientoKardex =
  | "ENTRADA" // Ingreso por compra, recepción o donación (+ stock)
  | "SALIDA" // Despacho, consumo interno o entrega a departamento (- stock)
  | "TRASLADO" // Envío entre Bodega Central y un establecimiento/escuela (- stock origen, + stock destino)
  | "DEVOLUCION" // Retorno de insumos no utilizados desde un establecimiento (+ stock)
  | "AJUSTE"; // Ajuste por inventario físico / auditoría (+ o - stock)

export interface MovimientoKardex {
  id: string;
  folio: string;
  fecha: string;
  tipo: TipoMovimientoKardex;
  tipoLabel: string;
  cantidad: number;
  origenDestino: string;
  responsableNombre: string;
  responsableRol?: string;
  balance: number;
  documentoReferencia?: string;
  observaciones?: string;
  productoId?: string;
}

export interface ProductoKardex {
  id: string;
  codigo: string;
  nombre: string;
  ubicacionBodega: string;
  categoria: string;
  unidadMedida: string;
  stockMinimoAlerta: number;
  documentoReferencia?: string;
  stockInicial?: number;
}

export interface NuevoMovimientoDTO {
  tipo: TipoMovimientoKardex;
  cantidad: number;
  origenDestino: string;
  documentoReferencia?: string;
  observaciones?: string;
  productoId?: string;
}
