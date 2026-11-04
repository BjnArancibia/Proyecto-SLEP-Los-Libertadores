# Topología del Clúster de Microservicios, Balanceadores y Proxy Inverso

Este diagrama modela la arquitectura completa de distribución de tráfico, alta disponibilidad y contención de recursos del clúster containerizado para el **SLEP Los Libertadores**, integrando explícitamente los **dos balanceadores de carga** y el **proxy inverso**:

```mermaid
flowchart TD
    subgraph EXTERNO["1. Zona Exterior (Internet / WAN Educacional)"]
        CLIENTES["Clientes Web / Navegadores<br/>(Escuelas y Administración SLEP)"]
    end

    subgraph LB_EXTERNO["2. Balanceador de Carga Perimetral (L4/L7 - Edge LB)"]
        LB1["Balanceador de Carga Externo en GCP IP Pública Estática :80 / :443<br/>• Distribución perimetral<br/>"]
    end

    CLIENTES -->|"Tráfico HTTP / HTTPS"| LB1

    subgraph PROXY_INVERSO["3. Proxy Inverso y API Gateway"]
        GATEWAY["slep-gateway (Nginx Proxy Inverso)<br/>Puerto :8080"]
    end

    LB1 -->|"Balanceo / Failover"| GATEWAY

    subgraph LB_INTERNO["4. Balanceador de Carga Interno (Nginx)"]
        LB2["Balanceador de Carga Interno Detección pasiva de fallos • Distribución equitativa hacia réplicas de Microservicios"]
    end

    GATEWAY -->|"Peticiones Dinámicas API"| LB2
    GATEWAY -->|"Tráfico Estático"| SPA["slep-frontend<br/>Angular 22 LTS (Nginx)"]
    GATEWAY -->|"Gestión Clúster"| MONITORING["slep-monitoring<br/>Portainer CE 2.27"]

    subgraph CLUSTER["5. Red Privada Interna Aislada"]
        subgraph MICROSERVICIOS["Microservicios Backend (PHP 8.3 Alpine CLI)"]
            API_USER["slep-api-usuarios<br/>Auth (:8000)<br/>"]
            API_INV["slep-api-inventario<br/>Activos, Kardex e IA (:8000)<br/>"]
            API_FLU["slep-api-flujos<br/>Flujos & Bitácora (:8000)<br/>"]
        end

        LB2 -->|"Upstream usuarios_api"| API_USER
        LB2 -->|"Upstream inventario_api"| API_INV
        LB2 -->|"Upstream flujos_api"| API_FLU

        subgraph PERSISTENCIA["Almacenamiento y Cómputo Especializado"]
            DB[("slep-database<br/>MySQL 8.0.40 (:3306)<br/>")]
            OLLAMA["slep-ollama<br/>Ollama 0.40.7 (:11434)"]
        end

        API_USER -->|"Consultas SQL"| DB
        API_INV -->|"Consultas SQL"| DB
        API_FLU -->|"Consultas SQL"| DB
        API_INV -->|"Inferencia LLM Local"| OLLAMA
    end

    subgraph VOLUMENES["6. Volúmenes Persistentes (Host Storage)"]
        V_DB[("slep-mysql-data")]
        V_OLLAMA[("slep-ollama-models")]
        DB --- V_DB
        OLLAMA --- V_OLLAMA
    end
```

---

## Justificación para la Defensa de la Unidad 2: ¿Por qué 2 Balanceadores y 1 Proxy Inverso?

Esta separación se justifica en tres capas funcionales:

### 1. Balanceador de Carga Perimetral / Externo (Capa L4/L7)

- **Función:** Es el primer punto de contacto en la nube (GCP Cloud Load Balancing).
- **Justificación:** Recibe el volumen masivo de tráfico concurrente desde las escuelas y dependencias públicas del SLEP. Si el clúster crece horizontalmente a múltiples máquinas virtuales o nodos de cómputo, este balanceador externo distribuye el tráfico entre las distintas instancias de Nginx Gateway sin que los usuarios finales perciban interrupciones (alta disponibilidad perimetral).

### 2. Proxy Inverso (API Gateway en slep-gateway)

- **Función:** Centraliza la lógica de seguridad y el punto único de entrada.
- **Justificación:** Oculta la topología interna del sistema. Ningún cliente accede jamás de forma directa a los contenedores PHP, MySQL ni Ollama. Además, se encarga de:
  - Aplicar cabeceras de seguridad.
  - Comprimir en tiempo real el bundle de Angular.
  - Enrutar el tráfico por contexto URL (`/api/auth/`, `/api/activos/`, `/api/movimientos/`, `/portainer/`).

### 3. Balanceador de Carga Interno (Upstreams L7 en Nginx)

- **Función:** Balanceo a nivel de capa de aplicación mediante directivas upstream (`usuarios_api`, `inventario_api`, `flujos_api`).
- **Justificación:** Permite escalar los microservicios backend de forma independiente (por ejemplo, levantar réplicas de `backend-inventario` si hay alta demanda de Kardex) mediante _Keepalive sockets_. Posee tolerancia a fallos (`max_fails=3 fail_timeout=10s`), aislando automáticamente a cualquier contenedor backend que presente fallas sin voltear el clúster completo.

---

## Tabla de Asignación y Contención de Recursos (Compose Resource Limits)

| Servicio              | Rol Arquitectónico                                  | Usuario de Ejecución | Límite CPU | Límite RAM | Reserva RAM |
| :-------------------- | :-------------------------------------------------- | :------------------- | :--------: | :--------: | :---------: |
| `slep-gateway`        | Proxy Inverso y Balanceador Upstream L7             | Nginx                |    0.50    |   256 MB   |    64 MB    |
| `slep-frontend`       | Servidor Web Estático Angular 22                    | Nginx                |    0.50    |   256 MB   |    64 MB    |
| `slep-api-usuarios`   | Microservicio de Identidad y Roles (RF-01)          | www-data             |    0.75    |  1024 MB   |   256 MB    |
| `slep-api-inventario` | Microservicio de Inventario, Kardex e IA (RF-02/04) | www-data             |    1.25    |  1536 MB   |   512 MB    |
| `slep-api-flujos`     | Microservicio de Solicitudes y Auditoría (RF-03/05) | www-data             |    0.75    |  1024 MB   |   256 MB    |
| `slep-database`       | Persistencia Relacional MySQL 8.0                   | mysql                |    2.00    |  3072 MB   |   1024 MB   |
| `slep-ollama`         | Motor de Inferencia LLM Local (Qwen 2.5)            | ollama               |    2.00    |  2048 MB   |   512 MB    |
| `slep-monitoring`     | Dashboard Operacional Portainer CE                  | root                 |    0.50    |   256 MB   |    64 MB    |
