# Sistema de Gestión Patrimonial e Inventario - SLEP Los Libertadores

## Descripción General

Plataforma web desarrollada para la administración centralizada de activos fijos, control de existencias en bodega y trazabilidad del flujo de solicitudes del **Servicio Local de Educación Pública (SLEP) Los Libertadores** (Licitación ID: `1305541-3-LE26`).

El sistema garantiza la continuidad operacional mediante una arquitectura de alta disponibilidad desplegada en Google Cloud Platform (GCP), con balanceo de carga, segregación de bases de datos, auditoría inmutable de transacciones y un procedimiento automatizado de respaldo y recuperación ante desastres.

---

## Arquitectura y Estructura del Proyecto

El sistema adopta una arquitectura cliente-servidor distribuida en dos máquinas virtuales (Compute Engine) interconectadas mediante una VPC privada (`10.194.0.0/20`):

- **Edge Proxy & Frontend (VM 1):** Servidor perimetral Nginx que actúa como proxy inverso y balanceador de carga hacia las réplicas backend, además de servir los archivos compilados de la interfaz en Angular.
- **Backend API (VM 1 y VM 2):** Réplicas de la API REST construidas en **Laravel 11 (PHP 8.2 / 8.3)** que procesan las solicitudes de negocio bajo balanceo Round Robin.
- **Persistencia de Datos (VM 1):** Motor relacional **MySQL** (`slep_db`) para producción en GCP / compatible con **PostgreSQL** para desarrollo local aislado.

```text
proyecto-slep-los-libertadores/
├── .gitignore
├── .env.example
├── README.md
├── docs/
│   └── infraestructura-u1.md         # Informe técnico y evidencias de la Unidad 1
├── services/
│   ├── frontend/                     # Aplicación SPA en Angular 22 LTS
│   └── backend/
│       └── api-inventario/           # API REST Laravel 11 (PHP 8.2/8.3)
├── infrastructure/
│   ├── proxy/
│   │   └── nginx.conf                # Configuración de Upstream y Failover
│   └── monitoring/
│       └── systemd-status.sh         # Script de observabilidad y salud del clúster (RNF-07)
└── scripts/
    ├── backup/
    │   └── backup_db.sh              # Respaldo automatizado mysqldump con rotación a 7 días
    ├── restore/
    │   └── restore_db.sh             # Procedimiento y script de Disaster Recovery
    └── deploy/
        └── deploy.sh                 # Pipeline local de despliegue
```

---

## Avances y Funcionalidades Implementadas

### Módulo Frontend
- **Autenticación y Acceso:** Sistema de inicio de sesión con validación de credenciales y control de acceso basado en los roles del usuario.
- **Interfaz y Navegación:** Sidebar interactivo y unificación de la navegación, ajustando las pantallas para soportar despliegue de datos masivos.
- **Flujos Electrónicos:** Implementación del módulo de movimientos con segregación de funciones, permitiendo gestionar traslados y bajas de activos.
- **Control de Stock y Bodega:** Módulo Kardex para visualización del estado actual del inventario, stock disponible, historial y alertas de reposición.
- **Generación de Etiquetas:** Modal específico para consultar e imprimir etiquetas de activos, integrando generación de códigos QR y códigos de barras.
- **Bitácora Auditable:** Visualización histórica de transacciones y estados con trazabilidad completa.

### Módulo Backend
- **Base de Datos y Modelos:** Estructura para gestionar tablas de activos, usuarios, kardex, bitácora de transacciones y movimientos.
- **Seguridad:** Implementación de tokens de autorización y asignación de permisos por roles (Solicitante, Aprobador, Encargado de Bodega y Administrador).
- **API Endpoints:** Rutas seguras para autenticación, listado y creación de activos, flujo de aprobaciones de movimientos, registros de kardex y monitoreo de salud (`/api/health`).
- **Datos Iniciales (Seeders):** Configuración de usuarios y perfiles predeterminados para pruebas locales sin necesidad de registros manuales.

---

## Instrucciones de Instalación y Ejecución Local

Para ejecutar el proyecto en un entorno local, se deben seguir las instrucciones detalladas en cada servicio:

- **Backend (API Inventario):** Revisar el archivo [README del Backend](./services/backend/api-inventario/README.md) para levantar los servicios, configurar la base de datos, ejecutar las migraciones y probar las rutas.
- **Frontend (Interfaz Web):** Revisar la carpeta de frontend en `./services/frontend/` para la instalación de dependencias (`npm install`) y ejecución del servidor de desarrollo (`npm start` o `ng serve`).
- **Infraestructura y Despliegue:** Consultar la carpeta `infrastructure/` y los documentos en `docs/infraestructura-u1.md`.
