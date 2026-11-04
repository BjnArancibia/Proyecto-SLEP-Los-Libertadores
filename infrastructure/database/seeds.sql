-- ==============================================================================
-- SLEP Los Libertadores - Datos Semilla Iniciales (Respaldo SQL de Emergencia)
-- Proyecto: Sistema de Gestión Patrimonial e Inventario
-- Licitación ID: 1305541-3-LE26
-- Compatible con: MySQL 8.0 y SQLite (Recuperación ante contingencias / Disaster Recovery)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Usuarios Institucionales Base (RF-01: Control de Acceso y Segregación de Roles)
--
-- Credenciales de acceso institucional para pruebas y defensa:
--   • Usuario 1 (SOLICITANTE)      : sol@slep.cl   | Pass: password123 | Hash: $2y$10$/bs8WOygZif/MKVf.ScxfO3WubPoREbO5OUpNSNljJE3CPQssKnfi
--   • Usuario 2 (APROBADOR)        : apro@slep.cl  | Pass: password123 | Hash: $2y$10$/bs8WOygZif/MKVf.ScxfO3WubPoREbO5OUpNSNljJE3CPQssKnfi
--   • Usuario 3 (ENCARGADO_BODEGA) : bod@slep.cl   | Pass: password123 | Hash: $2y$10$/bs8WOygZif/MKVf.ScxfO3WubPoREbO5OUpNSNljJE3CPQssKnfi
--   • Usuario 4 (ADMIN)            : admin@slep.cl | Pass: password123 | Hash: $2y$10$/bs8WOygZif/MKVf.ScxfO3WubPoREbO5OUpNSNljJE3CPQssKnfi
-- ------------------------------------------------------------------------------
INSERT INTO users (id, name, apellido, email, password, rol, cargo, establecimiento_id, establecimiento_nombre, created_at, updated_at)
VALUES
(1, 'Carmen', 'Tapia', 'sol@slep.cl', '$2y$10$/bs8WOygZif/MKVf.ScxfO3WubPoREbO5OUpNSNljJE3CPQssKnfi', 'SOLICITANTE', 'Coordinadora de Enlaces', 1, 'Escuela Los Andes', '2026-10-04 12:00:00', '2026-10-04 12:00:00'),
(2, 'Pedro', 'Henríquez', 'apro@slep.cl', '$2y$10$/bs8WOygZif/MKVf.ScxfO3WubPoREbO5OUpNSNljJE3CPQssKnfi', 'APROBADOR', 'Director de Establecimiento', 1, 'Escuela Los Andes', '2026-10-04 12:00:00', '2026-10-04 12:00:00'),
(3, 'Rodrigo', 'Soto', 'bod@slep.cl', '$2y$10$/bs8WOygZif/MKVf.ScxfO3WubPoREbO5OUpNSNljJE3CPQssKnfi', 'ENCARGADO_BODEGA', 'Jefe de Bodega Central', NULL, 'Bodega Central SLEP', '2026-10-04 12:00:00', '2026-10-04 12:00:00'),
(4, 'Admin', 'Sistema', 'admin@slep.cl', '$2y$10$/bs8WOygZif/MKVf.ScxfO3WubPoREbO5OUpNSNljJE3CPQssKnfi', 'ADMIN', 'Administrador General de TI', NULL, 'Administración Central', '2026-10-04 12:00:00', '2026-10-04 12:00:00');

-- ------------------------------------------------------------------------------
-- 2. Activos Fijos Patrimoniales de Muestra (RF-02)
-- Catálogo oficial de bienes muebles y equipamiento institucional
-- ------------------------------------------------------------------------------
INSERT INTO assets (id, numero_patrimonial, numero_serie, nombre, marca_modelo, estado_conservacion, establecimiento, dependencia_sala, custodio, categoria_sugerida_ia, created_at, updated_at)
VALUES
(1, 'ACT-2026-0001', 'PF39K09Z', 'Notebook Lenovo ThinkPad L14', 'Lenovo ThinkPad L14 Gen 4 Core i5 16GB', 'Bueno', 'Bodega Central SLEP', 'Estante Computación A-1', 'Rodrigo Soto', 'Equipos computacionales — Notebooks y portátiles', '2026-10-04 12:00:00', '2026-10-04 12:00:00'),
(2, 'ACT-2026-0002', 'VND88321', 'Proyector Láser Epson PowerLite', 'Epson PowerLite L260F Full HD', 'Bueno', 'Escuela Los Andes', 'Laboratorio Computación', 'Carmen Tapia', 'Equipos audiovisuales — Proyectores', '2026-10-04 12:05:00', '2026-10-04 12:05:00'),
(3, 'ACT-2026-0003', 'SN-DESK-092', 'Escritorio Ergonómico Docente', 'Mobiliario Escolar SpA Mod-2025', 'Bueno', 'Liceo Bicentenario Cordillera', 'Sala Profesores 2', 'Pedro Henríquez', 'Mobiliario — Escritorios y mesas', '2026-10-04 12:10:00', '2026-10-04 12:10:00'),
(4, 'ACT-2026-0004', 'PF39K10A', 'Notebook Lenovo ThinkPad L14', 'Lenovo ThinkPad L14 Gen 4 Core i5 16GB', 'Regular', 'Bodega Central SLEP', 'Estante Computación A-2', 'Rodrigo Soto', 'Equipos computacionales — Notebooks y portátiles', '2026-10-04 12:15:00', '2026-10-04 12:15:00'),
(5, 'ACT-2026-0005', 'SW-CIS-48P', 'Switch Cisco Catalyst 2960-X', 'Cisco WS-C2960X-48TD-L Gigabit PoE', 'Bueno', 'Administración Central', 'Sala Servidores Rack 01', 'Admin Sistema', 'Equipos de conectividad — Switches y Routers', '2026-10-04 12:20:00', '2026-10-04 12:20:00');

-- ------------------------------------------------------------------------------
-- 3. Existencias en Kardex de Bodega en Tiempo Real (RF-04)
-- Trazabilidad de entradas, salidas y stock disponible
-- ------------------------------------------------------------------------------
INSERT INTO kardexes (id, activo_codigo, activo_nombre, fecha_registro, tipo_movimiento, origen_destino, responsable, cantidad, saldo, estado_stock, documento_respaldo, created_at, updated_at)
VALUES
(1, 'ACT-2026-0001', 'Notebook Lenovo ThinkPad L14', '2026-10-04 12:00:00', 'INGRESO', 'Proveedor Oficial ChileCompra', 'Rodrigo Soto', 1, 1, 'DISPONIBLE', 'OC-2026-4410', '2026-10-04 12:00:00', '2026-10-04 12:00:00'),
(2, 'ACT-2026-0002', 'Proyector Láser Epson PowerLite', '2026-10-04 12:05:00', 'TRASLADO', 'Bodega Central -> Escuela Los Andes', 'Rodrigo Soto', 1, 1, 'DISPONIBLE', 'GD-2026-0891', '2026-10-04 12:05:00', '2026-10-04 12:05:00'),
(3, 'ACT-2026-0003', 'Escritorio Ergonómico Docente', '2026-10-04 12:10:00', 'TRASLADO', 'Bodega Central -> Liceo Bicentenario Cordillera', 'Rodrigo Soto', 1, 1, 'DISPONIBLE', 'GD-2026-0892', '2026-10-04 12:10:00', '2026-10-04 12:10:00'),
(4, 'ACT-2026-0004', 'Notebook Lenovo ThinkPad L14', '2026-10-04 12:15:00', 'INGRESO', 'Proveedor Oficial ChileCompra', 'Rodrigo Soto', 1, 1, 'DISPONIBLE', 'OC-2026-4410', '2026-10-04 12:15:00', '2026-10-04 12:15:00'),
(5, 'ACT-2026-0005', 'Switch Cisco Catalyst 2960-X', '2026-10-04 12:20:00', 'INGRESO', 'Licitación Infraestructura Redes', 'Admin Sistema', 1, 1, 'DISPONIBLE', 'OC-2026-3822', '2026-10-04 12:20:00', '2026-10-04 12:20:00');

-- ------------------------------------------------------------------------------
-- 4. Solicitudes de Movimientos (RF-03: Segregación de Funciones)
-- Solicitudes de traslado y baja iniciadas por solicitante para resolución de aprobador
-- ------------------------------------------------------------------------------
INSERT INTO movimientos (id, codigo_solicitud, tipo, estado, activo_codigo, activo_nombre, origen, destino, solicitante_id, solicitante_nombre, solicitante_rol, solicitante_establecimiento, justificacion, created_at, updated_at)
VALUES
(1, 'SOL-2026-001', 'TRASLADO', 'PENDIENTE_REVISION', 'ACT-2026-0001', 'Notebook Lenovo ThinkPad L14', 'Bodega Central SLEP', 'Escuela Los Andes', 1, 'Carmen Tapia', 'SOLICITANTE', 'Escuela Los Andes', 'Requerido para apoyo docente en laboratorio de computación.', '2026-10-04 13:00:00', '2026-10-04 13:00:00'),
(2, 'SOL-2026-002', 'TRASLADO', 'APROBADO', 'ACT-2026-0002', 'Proyector Láser Epson PowerLite', 'Bodega Central SLEP', 'Escuela Los Andes', 1, 'Carmen Tapia', 'SOLICITANTE', 'Escuela Los Andes', 'Equipamiento pedagógico para presentaciones audiovisuales.', '2026-10-04 13:30:00', '2026-10-04 14:00:00');

-- ------------------------------------------------------------------------------
-- 5. Bitácora Auditable de Transacciones (RF-05: Auditoría Inmutable)
-- Histórico inalterable de operaciones para control de contraloría y trazabilidad
-- ------------------------------------------------------------------------------
INSERT INTO bitacora_transacciones (id, folio, fecha_hora, usuario_id, usuario_nombre, usuario_perfil, modulo, accion, decision, justificacion, valores_anteriores, valores_posteriores, ip_origen, created_at, updated_at)
VALUES
(1, 'ACT-2026-0001', '2026-10-04 12:00:00', 3, 'Rodrigo Soto', 'ENCARGADO_BODEGA', 'ACTIVOS', 'Alta Patrimonial', 'REGISTRADO', 'Recepción conforme orden de compra OC-2026-4410', NULL, '{"numero_patrimonial":"ACT-2026-0001","nombre":"Notebook Lenovo ThinkPad L14","estado":"Bueno"}', '127.0.0.1', '2026-10-04 12:00:00', '2026-10-04 12:00:00'),
(2, 'SOL-2026-001', '2026-10-04 13:00:00', 1, 'Carmen Tapia', 'SOLICITANTE', 'SOLICITUDES', 'Creación de Solicitud de Traslado', 'PENDIENTE', 'Requerido para apoyo docente en laboratorio de computación.', NULL, '{"codigo_solicitud":"SOL-2026-001","tipo":"TRASLADO","destino":"Escuela Los Andes"}', '127.0.0.1', '2026-10-04 13:00:00', '2026-10-04 13:00:00'),
(3, 'SOL-2026-002', '2026-10-04 14:00:00', 2, 'Pedro Henríquez', 'APROBADOR', 'SOLICITUDES', 'Resolución de Solicitud', 'APROBADO', 'Aprobado según disponibilidad presupuestaria y necesidad pedagógica.', '{"estado":"PENDIENTE_REVISION"}', '{"estado":"APROBADO"}', '127.0.0.1', '2026-10-04 14:00:00', '2026-10-04 14:00:00');
