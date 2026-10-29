# Microservicio 1: API de Usuarios y Autenticación (`slep-api-usuarios`)

**Proyecto:** Sistema de Gestión Patrimonial e Inventario — SLEP Los Libertadores  
**Cobertura Funcional:** **RF-01** (Control de acceso, roles y perfiles diferenciados)  
**Stack:** Laravel 11/12 (PHP 8.3 Alpine + Laravel Sanctum)

---

## Responsabilidad Arquitectónica

Este microservicio gestiona de manera exclusiva la identidad, el inicio/cierre de sesión y la validación de sesiones mediante tokens Bearer (`Laravel Sanctum`). En el clúster Docker, el **API Gateway (`slep-gateway`)** enruta hacia este servicio todas las peticiones dirigidas a `/api/auth/*` y `/api/user`.

---

## Ejecución en Desarrollo Local

```bash
cd services/backend/api-usuarios
composer install
cp .env.example .env
php artisan key:generate
php artisan serve --port=8001
```

---

## Cuentas de Prueba (Seeders)

La contraseña común para todas las cuentas predefinidas es **`password123`**:

| Rol | Correo Electrónico | Dependencia / Unidad |
| :--- | :--- | :--- |
| **Solicitante** | `sol@slep.cl` | Escuela Los Andes |
| **Aprobador** | `apro@slep.cl` | Escuela Los Andes |
| **Encargado de Bodega** | `bod@slep.cl` | Bodega Central SLEP |
| **Administrador** | `admin@slep.cl` | Administración Central |

---

## Endpoints Expuestos (`routes/api.php`)

- `POST /api/auth/login`
  - **Body:** `{ "email": "admin@slep.cl", "password": "password123" }`
  - **Respuesta:** Retorna el `token` Sanctum y el perfil del usuario autenticado.
- `GET /api/user` *(Requiere header `Authorization: Bearer <token>`)*
  - Retorna los datos y rol del usuario autenticado.
- `POST /api/auth/logout` *(Requiere header `Authorization: Bearer <token>`)*
  - Revoca el token de acceso activo.
- `GET /api/health`
  - Endpoint de observabilidad (RNF-07) que reporta `"service": "api-usuarios"` y el estado de conexión con MySQL.
