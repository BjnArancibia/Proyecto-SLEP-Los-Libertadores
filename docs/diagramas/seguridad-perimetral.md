# Seguridad Perimetral y Ruteo de Gateway Nginx

Este diagrama describe cómo el contenedor `slep-gateway` opera como único punto de entrada perimetral hacia el clúster, aislando los microservicios y la base de datos de Internet:

```mermaid
flowchart LR
    INTERNET["Tráfico Exterior / Clientes<br/>Puerto :80 o :8080"] --> GATEWAY

    subgraph GW["slep-gateway (Nginx Alpine Unprivileged)"]
        GATEWAY["Nginx Proxy Inverso<br/>(Filtros de Cabeceras & Timeouts IA)"]
    end

    subgraph RUTEO["Enrutamiento Unificado"]
        R_SPA["Ruta: /"]
        R_AUTH["Ruta: /api/auth/<br/>Ruta: /api/user"]
        R_INV["Ruta: /api/activos/<br/>Ruta: /api/kardex/<br/>Ruta: /api/ia/"]
        R_FLU["Ruta: /api/movimientos/<br/>Ruta: /api/bitacora/"]
        R_PORT["Ruta: /portainer/"]
    end

    GATEWAY --> R_SPA
    GATEWAY --> R_AUTH
    GATEWAY --> R_INV
    GATEWAY --> R_FLU
    GATEWAY --> R_PORT

    subgraph INTERNAL["Red Aislada slep-net (Sin puertos expuestos a Internet)"]
        R_SPA --> FRONTEND["slep-frontend (:8080)"]
        R_AUTH --> B_USERS["slep-api-usuarios (:8000)"]
        R_INV --> B_INV["slep-api-inventario (:8000)"]
        R_FLU --> B_FLU["slep-api-flujos (:8000)"]
        R_PORT --> MONITOR["slep-monitoring (:9000)"]

        B_USERS -.->|"Red interna"| MYSQL[("slep-database (:3306)")]
        B_INV -.->|"Red interna"| MYSQL
        B_FLU -.->|"Red interna"| MYSQL
        B_INV -.->|"Red interna"| OLLAMA["slep-ollama (:11434)"]
    end
```

### Medidas de Blindaje Aplicadas

1. **Sin Exposición de Puertos Backend a Internet:** Los contenedores backend-usuarios, backend-inventario, backend-flujos y ollama únicamente utilizan la directiva **expose** en Docker Compose, impidiendo accesos no autorizados desde fuera de la red **slep-net**.
2. **Ejecución como Usuario No Privilegiado:** Nginx corre bajo nginx y PHP bajo www-data.
3. **Caché y Compresión Gzip:** Todo el contenido estático de Angular es comprimido al vuelo en el Gateway para minimizar el ancho de banda y la latencia.
