# Arquitectura de Contenedores e Integración de IA — SLEP Los Libertadores

**Proyecto:** Sistema de Gestión Patrimonial e Inventario  
**Licitación ID:** 1305541-3-LE26  
**Rama:** `backend-inventario`

---

## 1. Topología del Clúster de Contenedores

La solución adopta una arquitectura desacoplada basada en microservicios y contenedores coordinados mediante **Docker Compose**, interconectados por una red puente aislada (`slep-net`).

```text
                        [ Clientes Web / Navegadores ]
                                      │ HTTP (:80)
                                      ▼
             ┌──────────────────────────────────────────────────┐
             │       slep-gateway (Nginx Unprivileged)          │
             │           Puerto perimetral :80 / :8080          │
             └───────────────┬──────────────────┬───────────────┘
                             │                  │
                Ruta /       │                  │ Ruta /api/
                (Frontend)   ▼                  ▼ (Backend API)
     ┌───────────────────────────────┐  ┌───────────────────────────────────────┐
     │  slep-frontend (Angular 22)   │  │    slep-backend (Laravel 11 / PHP 8.3)│
     │  Nginx Alpine (:8080)         │  │    PHP-CLI Alpine (:8000)             │
     │  Archivos estáticos SPA       │  │    Auditoría, Kardex y Lógica Negocio │
     └───────────────────────────────┘  └───────┬──────────────────────┬────────┘
                                                │                      │
                                   Persistencia │                      │ Inferencia IA
                                   SQL (:3306)  ▼                      ▼ HTTP (:11434)
                                ┌────────────────────────┐   ┌────────────────────────┐
                                │ slep-database          │   │ slep-ollama            │
                                │ MySQL 8.0              │   │ Ollama 0.40.7 Oficial  │
                                │ Volumen: db-data       │   │ Volumen: ollama-models │
                                └────────────────────────┘   └────────────────────────┘
```

---

## 2. Responsabilidad y Especificación de los Servicios

| Servicio | Componente Tecnológico | Imagen Base | Puerto Expuesto | Rol Arquitectónico |
| :--- | :--- | :--- | :--- | :--- |
| **`gateway`** | Nginx Proxy Inverso | `nginxinc/nginx-unprivileged:1.28-alpine3.23` | `80:8080` (Host) | Punto perimetral único. Rutea el tráfico hacia frontend y backend, maneja compresión gzip y aísla la red interna. |
| **`frontend`** | Angular 22 SPA | `nginxinc/nginx-unprivileged:1.28-alpine3.23` | `8080` (Interno) | Sirve los activos precompilados minificados. Maneja fallback a `index.html` para el router de Angular. |
| **`backend`** | Laravel 11/12 API | `php:8.3.35-cli-alpine3.23` | `8000` (Interno) | Provee endpoints REST, control de acceso, trazabilidad auditable y orquesta la inferencia con Ollama. |
| **`database`** | MySQL Relacional | `mysql:8.0.40` | `127.0.0.1:3306` (Host loopback) | Persistencia ACID de activos, kardex, bitácora y usuarios. Enlace restringido a red Docker interna y loopback local para backups. |
| **`ollama`** | Motor de LLM Local | `ollama/ollama:0.40.7` | `11434` (Interno) | Ejecuta inferencia local de lenguaje natural para sugerir categorías patrimoniales bajo catálogo formal. |

---

## 3. Justificación de Imágenes Ligeras y Seguridad

1. **Compilación Multietapa (Multi-Stage Builds):**
   * **Frontend:** Se utiliza `node:22.23.4-alpine3.23` exclusivamente como builder para compilar los fuentes TypeScript y generar los bundles estáticos. La imagen final de ejecución es `nginxinc/nginx-unprivileged:1.28-alpine3.23` (~25 MB), descartando por completo Node.js, npm y los ~250 MB de `node_modules`.
   * **Backend:** Se utiliza `composer:2.9.5` como builder para descargar e instalar las dependencias con optimización de autoloader (`--no-dev --optimize-autoloader`). La imagen final monta solo el código productivo y las librerías sobre `php:8.3.35-cli-alpine3.23` con OPcache activo.
2. **Ejecución No Privilegiada (Non-Root):**
   * El gateway y el frontend corren bajo el usuario `nginx` (UID `101`).
   * El backend corre bajo el usuario `www-data` (UID `82`).
   * Ningún contenedor de aplicación tiene permisos de superusuario `root`.
3. **Versiones Inmutables y Específicas:**
   * Queda prohibido el uso del tag `latest` para evitar roturas accidentales y asegurar reproducibilidad estricta.
4. **Protección de Secretos:**
   * Los archivos `.dockerignore` impiden que claves SSH, archivos `.env`, logs y caches locales se empaqueten dentro de las capas de Docker.

---

## 4. Integración de Inteligencia Artificial con Ollama

### 4.1 Modelo Seleccionado y Justificación
* **Modelo elegido:** `qwen2.5:1.5b` (Q4_K_M).
* **Tamaño en disco:** ~986 MB.
* **Consumo de memoria RAM:** ~1.5 GB a 1.8 GB durante inferencia.
* **Ventajas clave:**
  1. **Excelente soporte en español:** Supera a modelos de tamaño similar en precisión sintáctica y semántica.
  2. **Capacidad de salida estructurada (JSON Schema):** Respeta de forma determinista el formato JSON solicitado sin generar alucinaciones ni markdown innecesario.
  3. **Baja latencia:** Genera respuestas en menos de 2 a 3 segundos en CPUs estándar de 2 a 4 núcleos.
  4. **Alternativas viables configurables:** Si el host cuenta con recursos muy reducidos se puede configurar `OLLAMA_MODEL=qwen2.5:0.5b` (398 MB); si cuenta con 16 GB de RAM, se puede optar por `qwen2.5:3b` (1.9 GB).

### 4.2 Catálogo Oficial Cerrado
Las sugerencias se contrastan de forma obligatoria contra el catálogo definido en [config/categorias_activos.php](file:///c:/Users/matia/OneDrive/Escritorio/UTALCA/2026-2/Proyecto-AdmindeRedes/Proyecto-SLEP-Los-Libertadores/services/backend/api-inventario/config/categorias_activos.php). Si el modelo genera una categoría inexistente, la capa de servicio `App\Services\Ia\SugerenciaCategoriaService` la rechaza y arroja `RespuestaIaInvalidaException` (HTTP 502), evitando contaminación de la base de datos patrimonial.

### 4.3 Flujo de la Sugerencia
```text
[Formulario Registro]
        │ 1. Usuario ingresa nombre ("Notebook Lenovo ThinkPad L14")
        │ 2. Clic en "Sugerir IA"
        ▼
[Frontend Angular - IaService]
        │ POST /api/ia/sugerir-categoria
        ▼
[Gateway Nginx] ──► [Backend Laravel - IaController]
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
        └─► Clic en "Guardar" -> Se persiste en PostgreSQL y en la bitácora auditable
```

### 4.4 Resiliencia y Desacoplamiento
La inteligencia artificial es estrictamente **consultiva y asistencial**. Si el contenedor de Ollama se detiene, se agota el timeout o el modelo no está descargado:
* El backend captura el error y responde con HTTP `503 Service Unavailable` y un mensaje claro.
* La interfaz web muestra una advertencia visual suave informando la indisponibilidad de la IA.
* **El operador puede guardar el activo manualmente sin ningún tipo de bloqueo ni pérdida de datos.**

---

## 5. Procedimiento de Ejecución Local

### Paso 1: Configurar Variables de Entorno
```bash
cp .env.example .env
```

### Paso 2: Construir e Iniciar los Servicios
```bash
docker compose up -d --build
```

### Paso 3: Descargar el Modelo en Ollama (Primera Ejecución)
El contenedor almacena los modelos en el volumen persistente `slep-ollama-models`, por lo que esta descarga se realiza una única vez:
```bash
docker compose exec ollama ollama pull qwen2.5:1.5b
```

Para verificar que el modelo esté listo:
```bash
docker compose exec ollama ollama list
```

### Paso 4: Acceder a la Plataforma
* **Aplicación Web (Frontend):** `http://localhost` (a través del gateway perimetral).
* **Endpoint de Salud (RNF-07):** `http://localhost/api/health`
* **Estado de la IA:** `http://localhost/api/ia/estado`
* **Catálogo de Categorías:** `http://localhost/api/ia/categorias`

---

## 6. Diagnóstico y Monitoreo

* **Ver estado de salud de todos los contenedores:**
  ```bash
  docker compose ps
  ```
* **Inspeccionar registros en tiempo real:**
  ```bash
  docker compose logs -f backend
  docker compose logs -f gateway
  docker compose logs -f ollama
  ```
* **Comprobación manual de conexión con Ollama desde el backend:**
  ```bash
  docker compose exec backend wget -qO- http://ollama:11434/api/tags
  ```
* **Detener los servicios conservando volúmenes:**
  ```bash
  docker compose down
  ```
