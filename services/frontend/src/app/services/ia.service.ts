import { Injectable, signal } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Observable, catchError, map, of, throwError } from "rxjs";

export interface DatosSolicitudIa {
  nombre: string;
  marca_modelo?: string;
  estado_conservacion?: string;
  establecimiento?: string;
}

export interface SugerenciaIaData {
  categoria_sugerida: string;
  justificacion: string;
  confianza: "alta" | "media" | "baja";
  atributos_clave: string[];
  modelo_utilizado: string;
  catalogo_version: string;
}

export interface SugerenciaIaResponse {
  success: boolean;
  data?: SugerenciaIaData;
  error?: string;
  message?: string;
  detalle?: string;
}

export interface EstadoIaResponse {
  habilitado: boolean;
  servidor_ollama: "conectado" | "desconectado";
  modelo_configurado: string;
  modelo_descargado: boolean;
  catalogo_version: string;
  total_categorias: number;
}

@Injectable({
  providedIn: "root",
})
export class IaService {
  // En Docker/producción Nginx atiende el frontend y proxea /api hacia el backend.
  // En desarrollo local directo con ng serve en puerto 4200, si no hay proxy se recurre al backend en :8000.
  private readonly baseUrl = "/api/ia";
  private readonly fallbackUrl = "http://127.0.0.1:8000/api/ia";

  // Estado reactivo del asistente de IA
  readonly cargando = signal<boolean>(false);
  readonly ultimaSugerencia = signal<SugerenciaIaData | null>(null);
  readonly errorIa = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  /**
   * Solicita a Ollama sugerencia de clasificación para el bien descrito.
   */
  sugerirCategoria(datos: DatosSolicitudIa): Observable<SugerenciaIaResponse> {
    this.cargando.set(true);
    this.errorIa.set(null);

    // Intentar primero ruta relativa /api/ia (funciona en Docker/Nginx y producción)
    return this.http
      .post<SugerenciaIaResponse>(`${this.baseUrl}/sugerir-categoria`, datos)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          // Si da 404 (ej. dev server local de Angular sin proxy Nginx), reintentar al backend directo :8000
          if (err.status === 404 || err.status === 0) {
            return this.http.post<SugerenciaIaResponse>(
              `${this.fallbackUrl}/sugerir-categoria`,
              datos,
            );
          }
          return throwError(() => err);
        }),
        map((res) => {
          this.cargando.set(false);
          if (res?.data) {
            this.ultimaSugerencia.set(res.data);
          }
          return res;
        }),
        catchError((err: HttpErrorResponse) => {
          this.cargando.set(false);
          const mensaje =
            err.error?.message ||
            (err.status === 503
              ? "El asistente de IA local (Ollama) no se encuentra disponible. Puede continuar con el registro manual."
              : err.status === 502
                ? "La IA devolvió una clasificación inválida. Seleccione la categoría manualmente."
                : "No fue posible conectar con el asistente de IA.");

          this.errorIa.set(mensaje);
          return of({
            success: false,
            error: err.error?.error || "error_conexion",
            message: mensaje,
            detalle: err.error?.detalle,
          });
        }),
      );
  }

  /**
   * Comprueba si Ollama está en línea y si el modelo está descargado.
   */
  consultarEstado(): Observable<EstadoIaResponse | null> {
    return this.http.get<EstadoIaResponse>(`${this.baseUrl}/estado`).pipe(
      catchError(() =>
        this.http.get<EstadoIaResponse>(`${this.fallbackUrl}/estado`),
      ),
      catchError(() => of(null)),
    );
  }

  limpiar(): void {
    this.ultimaSugerencia.set(null);
    this.errorIa.set(null);
    this.cargando.set(false);
  }
}
