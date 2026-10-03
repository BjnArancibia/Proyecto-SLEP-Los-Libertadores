import { Injectable, signal, computed } from "@angular/core";
import { HttpClient } from "@angular/common/http";
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

  async login(email: string, password: string): Promise<void> {
    // firstValueFrom convierte el Observable de HttpClient en una Promise,
    // lo que nos permite usar async/await de forma limpia
    const respuesta = await firstValueFrom(
      this.http.post<AuthResponse>(`${API_URL}/auth/login`, {
        email,
        password,
      }),
    );

    this.guardarSesion(respuesta.token, respuesta.usuario);
  }

  logout(): void {
    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("auth_usuario");
    this._usuario.set(null);
    this.router.navigate(["/login"]);
  }

  // Guarda el token y usuario en sessionStorage y actualiza el signal
  private guardarSesion(token: string, usuario: Usuario): void {
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
