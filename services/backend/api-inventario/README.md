# API Backend Inventario - SLEP Los Libertadores

Esta es la API construida en Laravel 11 para manejar la lógica de inventario, stock y flujos de aprobación. Reemplaza los datos de prueba (mocks) que se estaban usando temporalmente en el frontend.

## Cómo levantar esto localmente

Si acabas de clonar el repositorio o descargar cambios, asegúrate de correr:

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```

La API quedará levantada por defecto en `http://127.0.0.1:8000`.

---

## Cuentas de Prueba (Seeders)

El comando `--seed` crea cuentas predefinidas para que no tengas que registrarte manualmente y puedas probar los diferentes roles del sistema. La contraseña para todos es **`password123`**:

- **Solicitante:** `carmen.tapia@slep.cl` (Escuela Los Andes)
- **Aprobador:** `pedro.henriquez@slep.cl` (Escuela Los Andes)
- **Encargado de Bodega:** `rodrigo.soto@slep.cl` (Bodega Central SLEP)
- **Administrador:** `admin@slep.cl` (Administración Central)

---

## Resumen de Endpoints Disponibles

Todas las rutas empiezan con `/api/`. Todas (excepto el login) requieren enviar el token en el header `Authorization: Bearer <tu-token>`.

### 🔑 Autenticación
- `POST /api/auth/login`
  - **Body:** `{ "email": "admin@slep.cl", "password": "password123" }`
  - **Respuesta:** Retorna el `token` de acceso y los datos del usuario.
- `POST /api/auth/logout`
  - Cierra la sesión y revoca el token del usuario actual.
- `GET /api/user`
  - Retorna los datos del usuario logueado en base a su token.

### 📦 Activos
- `GET /api/activos`
  - Trae el listado completo de activos del sistema.
- `POST /api/activos`
  - Crea un nuevo activo (requiere permisos).
- `GET /api/activos/{id}`
  - Trae el detalle de un activo específico.

### 🔄 Movimientos (Flujo de Aprobaciones)
- `GET /api/movimientos`
  - Retorna todas las solicitudes de movimientos (bajas, traslados) incluyendo la **bitácora** de cada una (historial de acciones).
- `POST /api/movimientos`
  - Crea una solicitud de movimiento nueva y añade automáticamente el primer paso a la bitácora usando el usuario autenticado. 
  - **Body esperado:** `tipo` (TRASLADO|BAJA), `activo_codigo`, `activo_nombre`, `origen`, `destino`, `justificacion` (opcional).

### 📊 Kardex (Control de Stock)
- `GET /api/kardex`
  - Trae todo el historial de movimientos de stock.
- `POST /api/kardex`
  - Registra una nueva entrada en el kardex. 
  - **Body esperado:** `activo_codigo`, `activo_nombre`, `fecha_registro`, `tipo_movimiento`, `origen_destino`, `responsable`, `estado_stock`, etc.

---

> **Nota para el equipo Frontend:** El formato de los datos que devuelve la API de Login, Movimientos y Kardex está alineado directamente con las interfaces y los servicios de Angular que se configuraron recientemente. Ya pueden cambiar de `localStorage` al `HttpClient` real.
