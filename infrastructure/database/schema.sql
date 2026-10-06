-- Tabla de Usuarios e Identidades
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL DEFAULT 'SOLICITANTE', -- Admin, encargado_bodega, solicitante, aprobador
    cargo VARCHAR(255) NULL,                        
    establecimiento_nombre VARCHAR(255) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

-- Tabla de Activos Fijos Patrimoniales
CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_patrimonial VARCHAR(100) UNIQUE NOT NULL,
    numero_serie VARCHAR(100) NULL,
    nombre VARCHAR(255) NOT NULL,
    marca_modelo VARCHAR(255) NULL,
    estado_conservacion VARCHAR(50) NOT NULL, -- Bueno, Regular, Malo
    establecimiento VARCHAR(255) NOT NULL,
    dependencia_sala VARCHAR(255) NULL,
    custodio VARCHAR(255) NULL,
    categoria_sugerida_ia VARCHAR(100) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

-- Tabla de Solicitudes de Movimientos
CREATE TABLE IF NOT EXISTS movimientos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_solicitud VARCHAR(50) UNIQUE NOT NULL, -- Ej: SOL-2026-0421
    tipo VARCHAR(50) NOT NULL, -- Traslado, baja, alta, asignación, devolución
    estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE_REVISION', -- Pendiente_revision, aprobado, rechazado, completado
    activo_codigo VARCHAR(100) NOT NULL,                      
    activo_nombre VARCHAR(255) NOT NULL, 
    origen VARCHAR(255) NOT NULL,
    destino VARCHAR(255) NOT NULL,
    solicitante_id INTEGER NOT NULL,
    solicitante_nombre VARCHAR(255) NOT NULL,
    solicitante_rol VARCHAR(50) NOT NULL,
    solicitante_establecimiento VARCHAR(255) NOT NULL,
    justificacion TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (solicitante_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de Existencias / Kardex de Bodega en Tiempo Real
CREATE TABLE IF NOT EXISTS kardexes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activo_codigo VARCHAR(100) NOT NULL,
    activo_nombre VARCHAR(255) NOT NULL,
    fecha_registro VARCHAR(50) NOT NULL,
    tipo_movimiento VARCHAR(50) NOT NULL, -- Entrada, salida, traslado, devolución, ajuste
    origen_destino VARCHAR(255) NOT NULL, 
    responsable VARCHAR(255) NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1,
    saldo INTEGER NOT NULL DEFAULT 1,
    estado_stock VARCHAR(50) NOT NULL, -- Disponible, en transito, dado de baja
    documento_respaldo VARCHAR(100) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

-- Tabla de Bitácora Auditable de Transacciones
-- Almacena histórico automático para cada operación sobre activos y existencias
CREATE TABLE IF NOT EXISTS bitacora_transacciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    folio VARCHAR(100) NOT NULL, -- Folio de activo, solicitud o comprobante
    fecha_hora TIMESTAMP NOT NULL, -- Fecha y hora de cada transacción
    usuario_id INTEGER NULL,
    usuario_nombre VARCHAR(255) NOT NULL,  
    usuario_perfil VARCHAR(100) NOT NULL, 
    modulo VARCHAR(50) NOT NULL, -- ACTIVOS, EXISTENCIAS, SOLICITUDES
    accion VARCHAR(255) NOT NULL, -- Acción ejecutada (Alta, Modificación, Aprobación, etc.)
    decision VARCHAR(100) NULL, -- Decisión tomada (APROBADO, RECHAZADO, REGISTRADO, AJUSTADO)
    justificacion TEXT NULL, -- Justificación o motivo ingresado
    valores_anteriores TEXT NULL, 
    valores_posteriores TEXT NULL, 
    ip_origen VARCHAR(45) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_bitacora_folio ON bitacora_transacciones (folio);
CREATE INDEX IF NOT EXISTS idx_bitacora_fecha_hora ON bitacora_transacciones (fecha_hora);
CREATE INDEX IF NOT EXISTS idx_bitacora_modulo ON bitacora_transacciones (modulo);
