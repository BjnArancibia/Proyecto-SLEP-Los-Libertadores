# Arquitectura de Contenedores, Microservicios, Observabilidad e IA — SLEP Los Libertadores

**Proyecto:** Sistema de Gestión Patrimonial e Inventario  
**Licitación ID:** 1305541-3-LE26  
**Rama Principal:** `main` (Unidad 2 — Arquitectura de Microservicios en Docker Compose)

---

## 1. Topología del Clúster de Contenedores (8 Servicios Desacoplados)

La solución adopta una arquitectura de microservicios coordinados mediante **Docker Compose**, interconectados por la red puente aislada (`slep-net`) y expuestos a través de un **API Gateway** unificado (`slep-gateway`):

```text
                        [ Clientes Web / Navegadores ]
                                      │ HTTP (:80)
                                      ▼
             ┌────────────────────────────────────────────────────────────────────┐
             │                  slep-gateway (Nginx API Gateway)                  │
             │                     Puerto perimetral :80 / :8080                  │
             └───┬───────────────┬────────────────┬─────────────────┬─────────────┘
                 │               │                │                 │
         Ruta /  │   /api/auth/  │  /api/activos/ │  /api/movimien. │  /portainer/
                 │   /api/user   │  /api/kardex/  │  /api/bitacora/ │  (WebSockets)
                 ▼               ▼  /api/ia/      ▼                 ▼
     ┌──────────────────┐ ┌───────────────┐ ┌──────────────────┐ ┌──────────────────┐
     │  slep-frontend   │ │slep-api-usua. │ │ slep-api-flujos  │ │ slep-monitoring  │
     │  Angular 22 SPA  │ │Roles, Auth    │ │Flujos y Bitácora │ │ Portainer CE     │
     │  Nginx (:8080)   │ │Sanctum (:8000)│ │Auditable (:8000) │ │ Alpine (:9000)   │
     └──────────────────┘ └───────┬───────┘ └────────┬─────────┘ └──────────────────┘
                                  │                  │
                 ┌────────────────┴──────────────────┼─────────────────┐
                 │                                   │                 │
                 │   ┌───────────────────────────┐   │                 │
                 │   │    slep-api-inventario    │◄──┘                 │
                 │   │    Activos, Kardex e IA   │                     │
                 │   │    Laravel (:8000)        │                     │
                 │   └─────────────┬─────────────┘                     │
                 │                 │                                   │
                 │    Persistencia │             Inferencia IA         │
                 │     SQL (:3306) │             HTTP (:11434)         │
                 │                 ▼                  ▼                │
                 │      ┌────────────────────┐ ┌───────────────┐       │
                 └─────►│   slep-database    │ │  slep-ollama  │◄──────┘
                        │   MySQL 8.0.40     │ │  qwen2.5:1.5b │
                        │   Vol: db-data     │ │  Vol: models  │
                        └────────────────────┘ └───────────────┘
```

---

## 2. Responsabilidad y Especificación de los Servicios

| Servicio | Contenedor | Componente Tecnológico | Imagen Base | Puerto Expuesto | Rol Arquitectónico |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`gateway`** | `slep-gateway` | Nginx API Gateway | `nginxinc/nginx-unprivileged:1.28-alpine3.23` | `80:8080` (Host) | Punto perimetral único. Rutea el tráfico hacia frontend, los 3 microservicios y Portainer. |
| **`frontend`** | `slep-frontend` | Angular 22 SPA | `nginxinc/nginx-unprivileged:1.28-alpine3.23` | `8080` (Interno) | Sirve los activos precompilados minificados. Maneja fallback a `index.html` para el router. |
| **`backend-usuarios`** | `slep-api-usuarios` | API de Identidad y Roles | `php:8.3.35-cli-alpine3.23` | `8000` (Interno) | **Microservicio 1 (RF-01):** Autenticación, emisión de tokens Sanctum y perfiles de usuarios. |
| **`backend-inventario`**| `slep-api-inventario` | API de Inventario e IA | `php:8.3.35-cli-alpine3.23` | `8000` (Interno) | **Microservicio 2 (RF-02/RF-04):** Activos fijos, stock en bodega, Kardex e integración con Ollama. |
| **`backend-flujos`** | `slep-api-flujos` | API de Flujos y Auditoría | `php:8.3.35-cli-alpine3.23` | `8000` (Interno) | **Microservicio 3 (RF-03/RF-05):** Solicitudes con segregación de funciones y bitácora histórica. |
| **`database`** | `slep-database` | MySQL Relacional | `mysql:8.0.40` | `127.0.0.1:3306` (Loopback) | Persistencia ACID relacional de activos, kardex, bitácora y usuarios. Enlace interno seguro y loopback local para backups. |
| **`ollama`** | `slep-ollama` | Motor de LLM Local | `ollama/ollama:0.40.7` | `11434` (Interno) | Ejecuta inferencia local de lenguaje natural para sugerir categorías patrimoniales oficiales. |
| **`monitoring`** | `slep-monitoring` | Portainer CE | `portainer/portainer-ce:2.27.1-alpine` | `9000:9000` (Host) / `/portainer/` | Observabilidad visual en tiempo real de contenedores, consumo de CPU/RAM, salud y logs. |

### 2.1 Reglas de Enrutamiento del API Gateway ([infrastructure/proxy/gateway.conf](../infrastructure/proxy/gateway.conf))

El contenedor `slep-gateway` desacopla por completo al cliente web de la topología interna, dirigiendo cada petición al contenedor correspondiente:

| Prefijo / Ruta Entrante | Upstream Destino | Contenedor Interno | Características Especiales |
| :--- | :--- | :--- | :--- |
| `GET /healthz` | Respuesta directa Nginx | `slep-gateway:8080` | Retorna HTTP `200` (`gateway-healthy`) sin consultar upstreams. |
| `/portainer/` | `http://monitoring_ui/` | `slep-monitoring:9000` | Reescritura con *trailing slash* (`--base-url /portainer`) y soporte **WebSockets** (`Upgrade` / `Connection`). |
| `/api/auth/` y `= /api/user` | `http://usuarios_api` | `slep-api-usuarios:8000` | Login, logout y validación de sesión mediante tokens Sanctum (RF-01). |
| `/api/movimientos` y `/api/bitacora` | `http://flujos_api` | `slep-api-flujos:8000` | Flujos de traslado/baja y registro inmutable de auditoría (RF-03 / RF-05). |
| `/api/` *(resto de rutas API)* | `http://inventario_api` | `slep-api-inventario:8000` | `/api/activos`, `/api/kardex`, `/api/ia/*`, `/api/health` con timeouts extendidos (`90s`) para inferencia IA. |
| `/` *(fallback general)* | `http://frontend_app` | `slep-frontend:8080` | Aplicación SPA Angular 22 con compresión `gzip`. |

### 2.2 Límites y Reservas de Recursos por Contenedor ([docker-compose.yml](../docker-compose.yml))

Para evitar que un pico de procesamiento (por ejemplo, durante la inferencia del LLM en Ollama) degrade la base de datos o los microservicios transaccionales, cada servicio cuenta con cuotas mínimas garantizadas (`reservations`) y techos estrictos (`limits`):

| Servicio | Contenedor | CPU Reserva (Mín.) | CPU Límite (Máx.) | RAM Reserva (Mín.) | RAM Límite (Máx.) | Justificación Técnica |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **`gateway`** | `slep-gateway` | `0.10` | `0.50` | `64 MB` | `256 MB` | Proxy inverso Nginx asíncrono de bajo consumo de memoria. |
| **`frontend`** | `slep-frontend` | `0.10` | `0.50` | `64 MB` | `256 MB` | Entrega de archivos estáticos precompilados sobre Nginx Alpine. |
| **`backend-usuarios`** | `slep-api-usuarios` | `0.25` | `0.75` | `256 MB` | `1024 MB` | Operaciones ligeras de autenticación y emisión de tokens Sanctum. |
| **`backend-inventario`** | `slep-api-inventario` | `0.25` | `1.25` | `512 MB` | `1536 MB` | Mayor carga por gestión de activos, Kardex, migraciones y orquestación con Ollama. |
| **`backend-flujos`** | `slep-api-flujos` | `0.25` | `0.75` | `256 MB` | `1024 MB` | Procesamiento transaccional de solicitudes y consultas de bitácora auditable. |
| **`database`** | `slep-database` | `0.50` | `2.00` | `1024 MB` | `3072 MB` | Buffer pool de InnoDB y concurrencia de conexiones de los 3 microservicios. |
| **`ollama`** | `slep-ollama` | `1.50` | `2.50` | `2048 MB` | `5120 MB` | Carga en memoria de pesos cuantizados del modelo `qwen2.5:1.5b` e inferencia en CPU. |
| **`monitoring`** | `slep-monitoring` | `0.10` | `0.50` | `128 MB` | `512 MB` | Agente ligero en Go (Portainer CE Alpine) para telemetría del socket Docker. |
| **Total Clúster** | **8 Contenedores** | **3.05 vCPUs** | **8.75 vCPUs** | **4.375 GB** | **12.50 GB** | Dimensionado para operar de forma estable y aislada sin agotamiento de host (OOM). |

---

## 3. Justificación de Imágenes Ligeras, Persistencia y Seguridad

1. **Compilación Multietapa (Multi-Stage Builds):**
   * **Frontend:** Se utiliza `node:22.23.4-alpine3.23` exclusivamente como builder para compilar los fuentes TypeScript y generar los bundles estáticos. La imagen final de ejecución es `nginxinc/nginx-unprivileged:1.28-alpine3.23` (~25 MB), descartando por completo Node.js, npm y los ~250 MB de `node_modules`.
   * **Microservicios Backend:** Los 3 microservicios (`api-usuarios`, `api-inventario`, `api-flujos`) utilizan `composer:2.9.5` como builder (`--no-dev --optimize-autoloader`). La imagen final monta solo el código productivo y las librerías sobre `php:8.3.35-cli-alpine3.23` con OPcache activo y paquetes del sistema actualizados (`apk upgrade --no-cache`).
2. **Coordinación de Migraciones sin Condiciones de Carrera:**
   * Los 3 microservicios comparten el esquema relacional en `slep-database` (`MySQL 8.0.40`). Para evitar bloqueos de tablas al iniciar el clúster simultáneamente, solo `backend-inventario` tiene `AUTO_MIGRATE="true"`, mientras que `backend-usuarios` y `backend-flujos` inician con `AUTO_MIGRATE="false"` y volúmenes de `storage` independientes (`slep-usuarios-storage`, `slep-inventario-storage`, `slep-flujos-storage`).
3. **Ejecución No Privilegiada (Non-Root):**
   * El gateway y el frontend corren bajo el usuario `nginx` (UID `101`).
   * Los 3 microservicios de backend corren bajo el usuario `www-data` (UID `82`).
4. **Versiones Inmutables y Protección de Secretos:**
   * Todas las imágenes utilizan tags de versión fija (`1.28-alpine3.23`, `8.3.35-cli-alpine3.23`, `8.0.40`, `0.40.7`, `2.27.1-alpine`), prohibiendo el uso de `latest`.
   * Los archivos `.dockerignore` impiden que claves SSH, archivos `.env`, logs y caches locales se empaqueten dentro de las imágenes.

---

## 4. Integración de Inteligencia Artificial con Ollama

### 4.1 Modelo Seleccionado y Justificación
* **Modelo elegido:** `qwen2.5:1.5b` (Q4_K_M).
* **Tamaño en disco:** ~986 MB.
* **Consumo de memoria RAM:** ~1.5 GB a 1.8 GB durante inferencia (cubierto dentro de la reserva de `2048 MB` y límite de `5120 MB` asignado a `slep-ollama`).
* **Ventajas clave:**
  1. **Excelente soporte en español:** Supera a modelos de tamaño similar en precisión sintáctica y semántica.
  2. **Capacidad de salida estructurada (JSON Schema):** Respeta de forma determinista el formato JSON solicitado sin generar alucinaciones ni markdown innecesario.
  3. **Baja latencia:** Genera respuestas en menos de 2 a 3 segundos en CPUs estándar de 2 a 4 núcleos.
  4. **Alternativas viables configurables:** Si el host cuenta con recursos muy reducidos se puede configurar `OLLAMA_MODEL=qwen2.5:0.5b` (398 MB); si cuenta con 16 GB de RAM, se puede optar por `qwen2.5:3b` (1.9 GB).

### 4.2 Catálogo Oficial Cerrado
Las sugerencias se contrastan de forma obligatoria contra el catálogo definido en [config/categorias_activos.php](../services/backend/api-inventario/config/categorias_activos.php). Si el modelo genera una categoría inexistente, la capa de servicio `App\Services\Ia\SugerenciaCategoriaService` la rechaza y arroja `RespuestaIaInvalidaException` (HTTP 502), evitando contaminación de la base de datos patrimonial.

### 4.3 Flujo de la Sugerencia
```text
[Formulario Registro]
        │ 1. Usuario ingresa nombre ("Notebook Lenovo ThinkPad L14")
        │ 2. Clic en "Sugerir IA"
        ▼
[Frontend Angular - IaService]
        │ POST /api/ia/sugerir-categoria
        ▼
[Gateway Nginx] ──► [slep-api-inventario - IaController]
                           │
                           │ Inyecta catálogo oficial en system prompt
                           ▼
                    [SugerenciaCategoriaService]
                           │ POST /api/chat con format=json_schema
                           ▼
                    [Contenedor Ollama - qwen2.5:1.5b]
                           │ Retorna JSON: { categoria_sugerida, justificacion, confianza, atributos }
                           ▼
                    [SugerenciaCategoriaService]
                           │ Valida que categoria_sugerida pertenezca al catálogo
                           ▼
                    [IaController] ──► Retorna HTTP 200 JSON
        ▲
        │ Respuesta renderizada reactivamente en la interfaz
        │
[Frontend Angular]
        ├─► Usuario revisa justificación y confianza ("ALTA")
        ├─► Clic en "Aceptar" -> Aplica la categoría al formulario
        └─► Clic en "Guardar" -> Se persiste en MySQL 8.0 y en la bitácora auditable
```

### 4.4 Resiliencia y Desacoplamiento
La inteligencia artificial es estrictamente **consultiva y asistencial**. Si el contenedor de Ollama se detiene, se agota el timeout o el modelo no está descargado:
* El microservicio `slep-api-inventario` captura el error y responde con HTTP `503 Service Unavailable` y un mensaje claro.
* La interfaz web muestra una advertencia visual suave informando la indisponibilidad de la IA.
* **El operador puede guardar el activo manualmente sin ningún tipo de bloqueo ni pérdida de datos.**

---

## 5. Procedimiento de Despliegue y Ejecución

### Opción A: Pipeline Automatizado ([scripts/deploy/deploy.sh](../scripts/deploy/deploy.sh))
En servidores o máquinas virtuales Linux, el script automatiza la detención de Nginx nativo heredado de la Unidad 1, actualización desde GitHub, creación de `.env`, compilación de imágenes, levantamiento de los 8 servicios, descarga del modelo en Ollama y verificación de salud:
```bash
./scripts/deploy/deploy.sh
```

### Opción B: Ejecución Manual Paso a Paso
#### Paso 1: Configurar Variables de Entorno
```bash
cp .env.example .env
```

#### Paso 2: Construir e Iniciar los 8 Servicios
```bash
docker compose up -d --build
```

#### Paso 3: Descargar el Modelo en Ollama (Primera Ejecución)
El contenedor almacena los modelos en el volumen persistente `slep-ollama-models`, por lo que esta descarga se realiza una única vez:
```bash
docker compose exec ollama ollama pull qwen2.5:1.5b
```

Para verificar que el modelo esté listo:
```bash
docker compose exec ollama ollama list
```

#### Paso 4: Acceder a la Plataforma y Paneles
* **Aplicación Web (Frontend SPA):** `http://localhost` (a través del API Gateway perimetral).
* **Panel de Monitoreo Portainer CE:** `http://localhost/portainer/` (o directo por puerto `http://localhost:9000/`).
* **Endpoint de Salud Gateway:** `http://localhost/healthz`
* **Endpoint de Salud API (RNF-07):** `http://localhost/api/health`
* **Estado de la IA:** `http://localhost/api/ia/estado`
* **Catálogo de Categorías:** `http://localhost/api/ia/categorias`

---

## 6. Diagnóstico y Monitoreo (Observabilidad)

* **Observabilidad visual en tiempo real (Portainer CE):**
  Ingresando a `http://localhost/portainer/` se visualiza el estado de los 8 contenedores (`healthy` / `running`), gráficas de uso de CPU, memoria RAM, red y visor de logs en vivo.
* **Ver estado de salud de todos los contenedores por consola:**
  ```bash
  docker compose ps
  ```
* **Inspeccionar registros en tiempo real por microservicio:**
  ```bash
  docker compose logs -f gateway
  docker compose logs -f backend-usuarios
  docker compose logs -f backend-inventario
  docker compose logs -f backend-flujos
  docker compose logs -f ollama
  docker compose logs -f monitoring
  ```
* **Comprobación manual de salud interna de cada microservicio:**
  ```bash
  docker compose exec backend-usuarios wget -qO- http://127.0.0.1:8000/api/health
  docker compose exec backend-inventario wget -qO- http://127.0.0.1:8000/api/health
  docker compose exec backend-flujos wget -qO- http://127.0.0.1:8000/api/health
  ```
* **Comprobación manual de conexión con Ollama desde el microservicio de inventario:**
  ```bash
  docker compose exec backend-inventario wget -qO- http://ollama:11434/api/tags
  ```
* **Detener los servicios conservando volúmenes:**
  ```bash
  docker compose down
  ```
