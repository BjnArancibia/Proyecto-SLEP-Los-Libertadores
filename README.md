# Sistema de Gestión Patrimonial e Inventario - SLEP Los Libertadores

## Descripción General

Plataforma web desarrollada para la administración centralizada de activos fijos, control de existencias en bodega y trazabilidad del flujo de solicitudes del **Servicio Local de Educación Pública (SLEP) Los Libertadores** (Licitación ID: `1305541-3-LE26`).

El sistema garantiza la continuidad operacional mediante una arquitectura de alta disponibilidad desplegada en Google Cloud Platform (GCP), con balanceo de carga, segregación de bases de datos, auditoría inmutable de transacciones y un procedimiento automatizado de respaldo y recuperación ante desastres.

---

## Arquitectura y Estructura del Proyecto

El sistema adopta una arquitectura cliente-servidor distribuida en dos máquinas virtuales (Compute Engine) interconectadas mediante una VPC privada (`10.194.0.0/20`):

- **Edge Proxy & Frontend (VM 1):** Servidor perimetral Nginx que actúa como proxy inverso y balanceador de carga hacia las réplicas backend, además de servir los archivos compilados de la interfaz en Angular.
- **Backend API (VM 1 y VM 2):** Réplicas de la API REST construidas en **Laravel 11 (PHP 8.3)** que procesan las solicitudes de negocio bajo balanceo Round Robin.
- **Persistencia de Datos (VM 1):** Motor relacional **MySQL** (`slep_db`) aislado para consumo exclusivo interno de las réplicas del clúster.

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
│       └── api-inventario/           # API REST Laravel 11 (PHP 8.3)
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
