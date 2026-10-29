# Microservicio 3: API de Flujos y Auditoría (`slep-api-flujos`)

**Proyecto:** Sistema de Gestión Patrimonial e Inventario — SLEP Los Libertadores  
**Cobertura Funcional:** **RF-03** (Flujos de movimientos con segregación de funciones) y **RF-05** (Bitácora histórica auditable)  
**Stack:** Laravel 11/12 (PHP 8.3 Alpine)

---

## Responsabilidad Arquitectónica

Este microservicio gestiona las solicitudes electrónicas de traslado y baja de bienes patrimoniales (aplicando segregación de funciones entre Solicitante y Aprobador/Encargado) y administra la bitácora inmutable de transacciones para auditoría y cumplimiento normativo. En el clúster Docker, el **API Gateway (`slep-gateway`)** enruta hacia este servicio todas las peticiones dirigidas a `/api/movimientos*` y `/api/bitacora*`.

---

## Ejecución en Desarrollo Local

```bash
cd services/backend/api-flujos
composer install
cp .env.example .env
php artisan key:generate
php artisan serve --port=8002
```

---

## Endpoints Expuestos (`routes/api.php`)

### 🔄 Flujo de Movimientos y Aprobaciones (RF-03)
- `GET /api/movimientos`: Retorna todas las solicitudes de movimientos (`TRASLADO`, `BAJA`) junto con su historial de pasos (`bitacora_movimientos`).
- `POST /api/movimientos`: Crea una nueva solicitud de movimiento e inserta el hito inicial en la bitácora.
- `POST /api/movimientos/{id}/resolver`: Aprueba o rechaza una solicitud pendiente validando segregación de funciones.
- `POST /api/movimientos/reset`: Restaura las solicitudes de demostración.

### 🛡️ Bitácora Histórica de Transacciones (RF-05)
- `GET /api/bitacora`: Lista los eventos de auditoría con soporte para filtros por acción, entidad, usuario y rango de fechas.
- `GET /api/bitacora/{id}`: Obtiene el detalle completo (incluyendo snapshots JSON de valores anteriores y nuevos) de una transacción.
- `POST /api/bitacora`: Registra un nuevo evento de auditoría.
- `POST /api/bitacora/reset`: Restaura los eventos iniciales de demostración.

### 🩺 Salud (RNF-07)
- `GET /api/health`: Reporta `"service": "api-flujos"`, estado de conexión a MySQL y hostname del contenedor.
