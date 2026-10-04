import { Component, signal } from "@angular/core";
import { Router } from "@angular/router";
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from "@angular/forms";
import { AuthService, USUARIOS_MOCK } from "../services/auth.service";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: "./login.component.html",
  styleUrl: "./login.component.css",
})
export class LoginComponent {
  mostrarPassword = signal(false);

  cargando = signal(false); // mensaje de carga mientras procesa el login

  mensajeError = signal("");

  loginForm: FormGroup;
  usuariosMock = USUARIOS_MOCK;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.loginForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required]],
    });
  }

  iniciarComoMock(usuarioId: number): void {
    this.authService.loginMock(usuarioId);
    this.router.navigate(["/registro-activo"]);
  }

  alternarPassword(): void {
    this.mostrarPassword.update((v) => !v);
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    // Activamos carga y limpiamos errores anteriores.
    this.cargando.set(true);
    this.mensajeError.set("");

    try {
      const { email, password } = this.loginForm.value;
      await this.authService.login(email, password);

      this.router.navigate(["/registro-activo"]); // login exitoso: redirigimos a la página principal
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.mensajeError.set(error.message); // login fallido: mostramos el mensaje de error
      } else {
        this.mensajeError.set(
          "Ocurrió un error inesperado. Intenta nuevamente.",
        );
      }
    } finally {
      this.cargando.set(false);
    }
  }

  // Retorna true si el  correo tiene error y ya fue interactuado
  get emailInvalido(): boolean {
    const ctrl = this.loginForm.get("email");
    return !!(ctrl?.invalid && ctrl?.touched);
  }
  // Retorna true si la contraseña tiene error y ya fue interactuado
  get passwordInvalido(): boolean {
    const ctrl = this.loginForm.get("password");
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}
