# Flujo de Solicitudes y Segregación de Funciones (RF-03 y RF-05)

Este diagrama modela la interacción entre los diferentes perfiles del SLEP Los Libertadores, garantizando la **segregación de funciones** (un solicitante no puede visar sus propias solicitudes) y el registro inmutable en la bitácora de auditoría.

```mermaid
sequenceDiagram
    autonumber
    actor Solicitante as Usuario Solicitante<br/>(Coordinador de Escuela)
    actor Aprobador as Usuario Aprobador<br/>(Director / Jefe DAEM)
    actor Bodega as Encargado de Bodega<br/>(Bodega Central SLEP)
    participant Gateway as API Gateway (Nginx)
    participant Flujos as Microservicio Flujos
    participant Inventario as Microservicio Inventario
    participant DB as MySQL Database
    participant Bitacora as Bitácora Auditable (RF-05)

    %% Paso 1: Creación de Solicitud
    Note over Solicitante,Flujos: 1. Inicio de Solicitud de Movimiento (Traslado / Baja)
    Solicitante->>Gateway: POST /api/movimientos (activo, destino, justificación)
    Gateway->>Flujos: Enrutar con Bearer Token Sanctum
    Flujos->>DB: INSERT INTO movimientos (estado: PENDIENTE_REVISION)
    Flujos->>Bitacora: Registrar Transacción (Acción: Creación Solicitud, Decisión: PENDIENTE)
    Flujos-->>Solicitante: 201 Created (Código SOL-2026-XXXX)

    %% Paso 2: Revisión y Aprobación
    Note over Aprobador,Flujos: 2. Segregación de Funciones: Evaluación por Aprobador
    Aprobador->>Gateway: GET /api/movimientos/pendientes
    Gateway->>Flujos: Enrutar consulta
    Flujos-->>Aprobador: Lista de solicitudes pendientes de su jurisdicción

    alt Rechazo de Solicitud
        Aprobador->>Gateway: POST /api/movimientos/{id}/rechazar (motivo)
        Gateway->>Flujos: Procesar rechazo
        Flujos->>DB: UPDATE movimientos SET estado = 'RECHAZADO'
        Flujos->>Bitacora: Registrar Transacción (Decisión: RECHAZADO, Justificación)
        Flujos-->>Aprobador: Notificación de rechazo registrada
    else Aprobación de Solicitud
        Aprobador->>Gateway: POST /api/movimientos/{id}/aprobar (comentario)
        Gateway->>Flujos: Procesar visado formal
        Flujos->>DB: UPDATE movimientos SET estado = 'APROBADO'
        Flujos->>Bitacora: Registrar Transacción (Decisión: APROBADO, Usuario: Director)
        Flujos-->>Aprobador: 200 OK (Solicitud aprobada y lista para despacho)
    end

    %% Paso 3: Despacho y Kardex
    Note over Bodega,Inventario: 3. Ejecución Operativa en Bodega Central
    Bodega->>Gateway: POST /api/kardex/traslado (activo, guía despacho GD-XXXX)
    Gateway->>Inventario: Registrar movimiento físico
    Inventario->>DB: INSERT INTO kardexes (tipo: TRASLADO, saldo actualizado)
    Inventario->>DB: UPDATE assets SET custodio = nuevo_custodio, establecimiento = destino
    Inventario->>Bitacora: Registrar Transacción (Módulo: EXISTENCIAS, Acción: Traslado Físico)
    Inventario-->>Bodega: 200 OK (Comprobante Kardex generado)
```

### Reglas de Negocio Institucionales

1. **Incompatibilidad de Roles:** Un usuario con rol SOLICITANTE tiene bloqueados los endpoints `/api/movimientos/{id}/aprobar` y `/rechazar`.
2. **Inmutabilidad de la Bitácora:** Cada registro en bitacora_transacciones almacena el estado JSON (valores_anteriores y valores_posteriores), impidiendo modificaciones de auditoría.
