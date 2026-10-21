# Informe Técnico de Infraestructura y Operaciones - Unidad 1

**Proyecto:** Sistema de Gestión Patrimonial e Inventario  
**Mandante / Licitación:** SLEP Los Libertadores (ID: 1305541-3-LE26)  
**Asignatura:** Administración de Redes y Sistemas Computacionales

---

## 1. Ficha Técnica de Infraestructura y Topología de Red

La infraestructura está desplegada en **Google Cloud Platform (Compute Engine)** bajo una arquitectura distribuida de dos nodos:

| Parámetro             | Máquina Virtual 1 (VM 1)                       | Máquina Virtual 2 (VM 2)            |
| :-------------------- | :--------------------------------------------- | :---------------------------------- |
| **Nombre Host**       | `vm-app-principal`                             | `vm-app-replica`                    |
| **Rol**               | Edge Proxy, Frontend, Réplica Backend 1, MySQL | Réplica Backend 2 (Worker de Carga) |
| **Zona GCP**          | `southamerica-west1-a` (Santiago)              | `southamerica-west1-a` (Santiago)   |
| **Tipo de Instancia** | `e2-medium` (2 vCPUs, 4 GB RAM)                | `e2-small` / `e2-medium`            |
| **Sistema Operativo** | Ubuntu 24.04 LTS (x86_64)                      | Ubuntu 24.04 LTS (x86_64)           |
| **IP Pública**        | `34.176.114.6` (Acceso Perimetral)             | _Sin IP pública (Aislada)_          |
| **IP Privada VPC**    | `10.194.0.2`                                   | `10.194.0.3`                        |

### Diagrama de Flujo y Comunicación

```text
           [ Clientes Web / Navegadores ]
                         │ HTTP (80)
                         ▼
        ┌────────────────────────────────────────────────────────┐
        │  VM 1 (vm-app-principal - 34.176.114.6)               │
        │                                                        │
        │  [ Nginx Proxy Inverso & Balanceador de Carga ]         │
        │     ├── Servir SPA Angular (/dist/...)                 │
        │     └── Balanceador Upstream (/api/)                   │
        └───────────────┬────────────────────────┬───────────────┘
                        │ Round Robin (50%)      │ Round Robin (50%)
                        ▼ (Localhost:8000)       ▼ (10.194.0.3:8000)
        ┌─────────────────────────┐    ┌─────────────────────────┐
        │  Laravel Backend Rep 1  │    │  VM 2 (vm-app-replica)  │
        │  (VM 1)                 │    │  Laravel Backend Rep 2  │
        └───────────────┬─────────┘    └────────────┬────────────┘
                        │                           │
                        │ Consultas SQL (3306)      │ Red Privada
                        ▼                           │
        ┌───────────────────────────────────────────┴────────────┐
        │  MySQL Server (slep_db en VM 1 - 10.194.0.2)           │
        └────────────────────────────────────────────────────────┘
```
