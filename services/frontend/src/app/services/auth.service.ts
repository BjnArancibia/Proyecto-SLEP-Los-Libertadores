import { Injectable, signal, computed } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Router } from "@angular/router";
import { firstValueFrom } from "rxjs";

// Los 4 roles del sistema definidos en el RF-01
export type Rol = "ADMIN" | "ENCARGADO_BODEGA" | "SOLICITANTE" | "APROBADOR";

// Estructura del usuario autenticado que retorna el backend de Laravel
export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: Rol;
  establecimientoId: number | null; // null solo para el ADMIN (alcance transversal)
  establecimientoNombre: string;
}

// Estructura de la respuesta del endpoint POST /api/auth/login de Laravel
export interface AuthResponse {
  token: string;
  usuario: Usuario;
}

// URL base del backend
const API_URL = "http://127.0.0.1:8000/api";

// Perfiles de usuario institucionales con segregación de funciones (RF-01 / RF-03)
export const USUARIOS_MOCK: Usuario[] = [
  {
    id: 1,
    nombre: "Carmen",
    apellido: "Tapia",
    email: "sol@slep.cl",
    rol: "SOLICITANTE",
    establecimientoId: 1,
    establecimientoNombre: "Escuela Los Andes",
  },
  {
    id: 2,
    nombre: "Pedro",
    apellido: "Henríquez",
    email: "apro@slep.cl",
    rol: "APROBADOR",
    establecimientoId: 1,
    establecimientoNombre: "Escuela Los Andes",
  },
  {
    id: 3,
    nombre: "Rodrigo",
    apellido: "Soto",
    email: "bod@slep.cl",
    rol: "ENCARGADO_BODEGA",
    establecimientoId: null,
    establecimientoNombre: "Bodega Central SLEP",
  },
  {
    id: 4,
    nombre: "Admin",
    apellido: "Sistema",
    email: "admin@slep.cl",
    rol: "ADMIN",
    establecimientoId: null,
    establecimientoNombre: "Administración Central",
  },
];

@Injectable({
  providedIn: "root", // Solo existirá una instancia de este servicio en toda la app
})
export class AuthService {
  private _usuario = signal<Usuario | null>(null);

  // Signal público de solo lectura: cualquier componente puede leer el usuario actual
  readonly usuario = this._usuario.asReadonly();

  // Computed: true si hay un usuario con sesión activa
  readonly estaAutenticado = computed(() => this._usuario() !== null);

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    // Al iniciar la app, recupera la sesión guardada para no perderla al recargar
    this.recuperarSesion();
  }

  // Retorna los perfiles mock disponibles para prueba de roles
  getUsuariosMock(): Usuario[] {
    return USUARIOS_MOCK;
  }

  // Inicio de sesión directo
  loginMock(usuarioId: number): void {
    const usuario = USUARIOS_MOCK.find((u) => u.id === usuarioId);
    if (!usuario) return;

    this.guardarSesion(`mock-token-${usuario.id}`, usuario);
  }

  async login(email: string, password: string): Promise<void> {
    const MENSAJE_ERROR_GENERICO =
      "Credenciales inválidas. Compruebe correo y contraseña.";

    try {
      // Intentamos con el backend real de Laravel
      const respuesta = await firstValueFrom(
        this.http.post<AuthResponse>(`${API_URL}/auth/login`, {
          email,
          password,
        }),
      );
      this.guardarSesion(respuesta.token, respuesta.usuario);
    } catch (error: unknown) {
      // Si el servidor respondió con error de autenticación (401 o 422), rechazar tajantemente
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401 || error.status === 422) {
          throw new Error(MENSAJE_ERROR_GENERICO);
        }
      }

      // Modo contingencia / demostración offline (backend inalcanzable por fallo de red o clúster apagado)
      // Solo se permite si el correo existe Y la contraseña ingresada coincide estrictamente con la estándar ("password123")
      const mock = USUARIOS_MOCK.find(
        (u) => u.email.toLowerCase() === email.toLowerCase(),
      );
      if (mock && password === "password123") {
        this.guardarSesion(`mock-token-${mock.id}`, mock);
        return;
      }

      // Si las credenciales no coinciden o no es un usuario autorizado, rechazar con mensaje genérico
      throw new Error(MENSAJE_ERROR_GENERICO);
    }
  }

  logout(): void {
    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("auth_usuario");
    this._usuario.set(null);
    this.router.navigate(["/login"]);
  }

  // Guarda el token y usuario en sessionStorage y actualiza el signal
  guardarSesion(token: string, usuario: Usuario): void {
    sessionStorage.setItem("auth_token", token);
    sessionStorage.setItem("auth_usuario", JSON.stringify(usuario));
    this._usuario.set(usuario);
  }

  // Al iniciar la app, intenta reconstruir la sesión desde sessionStorage
  private recuperarSesion(): void {
    const usuarioGuardado = sessionStorage.getItem("auth_usuario");
    if (usuarioGuardado) {
      try {
        this._usuario.set(JSON.parse(usuarioGuardado));
      } catch {
        // Si el JSON estaba corrupto, limpiamos todo para no dejar la app en mal estado
        sessionStorage.clear();
      }
    }
  }
}
