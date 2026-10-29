# Sistema de Gestión Patrimonial e Inventario - SLEP Los Libertadores

## Descripción General

Plataforma web desarrollada para la administración centralizada de activos fijos, control de existencias en bodega, trazabilidad del flujo de solicitudes y clasificación asistida por Inteligencia Artificial del **Servicio Local de Educación Pública (SLEP) Los Libertadores** (Licitación ID: `1305541-3-LE26`).

El sistema garantiza la continuidad operacional mediante una arquitectura de alta disponibilidad desplegada en Google Cloud Platform (GCP) y un entorno containerizado reproducible de **8 servicios** con **Docker Compose**, integrando un **API Gateway** perimetral, **3 microservicios de backend independientes**, base de datos relacional **MySQL 8.0**, auditoría inmutable de transacciones, observabilidad visual en tiempo real con **Portainer CE** y un motor de modelos de lenguaje local (**Ollama**).

---

## Arquitectura y Estructura del Proyecto

El sistema adopta una arquitectura desacoplada basada en contenedores ligeros con cuotas estrictas de CPU/RAM y microservicios coordinados en la red privada `slep-net`:

- **API Gateway (`slep-gateway`):** Servidor perimetral Nginx no privilegiado que actúa como punto único de entrada (`:80`), enrutando peticiones a los 3 microservicios según prefijo de ruta, sirviendo la SPA de Angular (`/`) y exponiendo el panel de Portainer (`/portainer/`) con soporte WebSockets.
- **Frontend SPA (`slep-frontend`):** Aplicación construida en **Angular 22 LTS**, empaquetada mediante compilación multietapa sobre Nginx Alpine (~25 MB).
- **Microservicio Usuarios (`slep-api-usuarios`):** Servicio de identidad, autenticación, control de perfiles diferenciados y emisión de tokens Sanctum (**RF-01**).
- **Microservicio Inventario (`slep-api-inventario`):** Gestión patrimonial de bienes y activos fijos, control de existencias en Kardex y clasificación asistida con Ollama (**RF-02 y RF-04**).
- **Microservicio Flujos (`slep-api-flujos`):** Solicitudes electrónicas de movimientos (traslados y bajas) con segregación de funciones y bitácora histórica transaccional (**RF-03 y RF-05**).
- **Persistencia de Datos (`slep-database`):** Motor relacional **MySQL 8.0** aislado en la red interna con volumen persistente (`slep-mysql-data`) y enlace loopback local (`127.0.0.1:3306`) para respaldos automatizados.
- **Asistente de IA (`slep-ollama`):** Motor de inferencia local oficial de **Ollama** con el modelo ligero `qwen2.5:1.5b` para clasificación patrimonial asistida bajo catálogo oficial cerrado.
- **Panel de Monitoreo (`slep-monitoring`):** Dashboard visual de métricas de contenedores, uso de CPU/RAM, salud y logs en vivo con **Portainer Community Edition (v2.27.1 Alpine)** en `/portainer/` y puerto `:9000`.

```text
proyecto-slep-los-libertadores/
├── .dockerignore
├── .env.example                      # Plantilla de variables de entorno del clúster
├── .gitignore
├── README.md
├── docker-compose.yml                # Orquestación de los 8 servicios y cuotas CPU/RAM
├── docs/
│   ├── arquitectura.md               # Especificación técnica de microservicios, recursos e IA
│   ├── infraestructura-u1.md         # Informe técnico y evidencias de la Unidad 1
│   └── licitacion.md                 # Bases técnicas de la Licitación 1305541-3-LE26
├── services/
│   ├── frontend/                     # Aplicación SPA en Angular 22 LTS
│   │   ├── Dockerfile                # Compilación multietapa (Node 22 -> Nginx Unprivileged)
│   │   └── nginx.conf                # Configuración Nginx para SPA fallback
│   └── backend/
│       ├── api-usuarios/             # Microservicio 1: Identidad, Roles y Auth (RF-01)
│       │   ├── Dockerfile            # Imagen ligera PHP 8.3 CLI Alpine con OPcache
│       │   └── docker-entrypoint.sh  # Script de inicio seguro sin colisión de migraciones
│       ├── api-inventario/           # Microservicio 2: Activos, Kardex e IA Ollama (RF-02/RF-04)
│       │   ├── Dockerfile            # Imagen ligera PHP 8.3 CLI Alpine con OPcache
│       │   └── docker-entrypoint.sh  # Script de inicio seguro y ejecución de migraciones
│       └── api-flujos/               # Microservicio 3: Solicitudes y Bitácora (RF-03/RF-05)
│           ├── Dockerfile            # Imagen ligera PHP 8.3 CLI Alpine con OPcache
│           └── docker-entrypoint.sh  # Script de inicio seguro sin colisión de migraciones
├── infrastructure/
│   ├── database/                     # Esquema SQL base y semillas iniciales
│   ├── proxy/
│   │   ├── Dockerfile                # Imagen perimetral del API Gateway Nginx
│   │   ├── gateway.conf              # Ruteo a 3 microservicios, SPA y Portainer (/portainer/)
│   │   └── nginx.conf                # Configuración histórica para VM en GCP (Unidad 1)
│   └── monitoring/
│       └── systemd-status.sh         # Script de observabilidad y salud del clúster (RNF-07)
└── scripts/
    ├── backup/
    │   └── backup_db.sh              # Respaldo automatizado MySQL con rotación a 7 días
    ├── restore/
    │   └── restore_db.sh             # Procedimiento y script de Disaster Recovery
    └── deploy/
        ├── deploy.sh                 # Pipeline automatizado de despliegue containerizado (U2)
        └── setup_vm.sh               # Aprovisionamiento automatizado de VM
```

---

## Avances y Funcionalidades Implementadas

### Módulo Frontend (Angular 22)
- **Autenticación y Acceso (RF-01):** Sistema de inicio de sesión con validación de credenciales y control de acceso basado en roles (`Solicitante`, `Aprobador`, `Encargado de Bodega`, `Administrador`).
- **Interfaz y Navegación:** Sidebar interactivo, responsive design y navegación fluida entre módulos.
- **Clasificación Asistida por IA (RF-02):** Integración interactiva con Ollama en el formulario de activos, con sugerencia contextual, justificación técnica, nivel de confianza y botones de aceptación/descarte.
- **Flujos Electrónicos (RF-03):** Módulo de movimientos con segregación de funciones para traslados y bajas de bienes.
- **Control de Stock y Bodega (RF-04):** Módulo Kardex para existencias en tiempo real, catálogo multicódigo y alertas de reposición.
- **Generación de Etiquetas:** Modal con generación dinámica de códigos QR y códigos de barras (`Code128`).
- **Bitácora Auditable (RF-05):** Trazabilidad histórica completa de transacciones, valores anteriores/posteriores y exportación CSV.

### Arquitectura Backend Desacoplada (3 Microservicios Laravel 11/12) y DevOps
- **Desacoplamiento en Microservicios:** Separación del backend en tres contenedores independientes (`slep-api-usuarios`, `slep-api-inventario`, `slep-api-flujos`) enrutados transparentemente por el API Gateway Nginx.
- **Integración con Ollama:** Conector HTTP desacoplado en `api-inventario` con control de timeouts, esquema JSON estricto y validación contra catálogo oficial ([config/categorias_activos.php](./services/backend/api-inventario/config/categorias_activos.php)).
- **Resiliencia Operacional:** Manejo de excepciones de IA (`503 Service Unavailable`, `502 Bad Gateway`) que garantizan que el inventario siga operando manualmente si Ollama no está disponible.
- **Cuotas de Recursos y Gobernanza:** Límites máximos (`limits`) y reservas mínimas (`reservations`) de CPU y memoria RAM definidos por contenedor en [docker-compose.yml](./docker-compose.yml).
- **Observabilidad y Monitoreo (RNF-07):** Endpoints `/api/health` por microservicio y panel visual **Portainer CE** integrado en `/portainer/`.

---

## Instrucciones de Instalación y Ejecución

### Opción A: Despliegue Automatizado con Pipeline `deploy.sh` (Recomendado en VM Linux)
El script [scripts/deploy/deploy.sh](./scripts/deploy/deploy.sh) automatiza todo el ciclo de despliegue (actualización Git, liberación de puerto 80 si existe Nginx nativo, creación de `.env`, construcción de las imágenes, inicio de los 8 contenedores, descarga automática del modelo `qwen2.5:1.5b` en Ollama y verificación de salud):

```bash
./scripts/deploy/deploy.sh
```

### Opción B: Despliegue Manual con Docker Compose
Para levantar el clúster completo de **8 servicios** paso a paso:

1. **Configurar el archivo de entorno:**
   ```bash
   cp .env.example .env
   ```
2. **Construir e iniciar los contenedores:**
   ```bash
   docker compose up -d --build
   ```
3. **Descargar el modelo de IA en Ollama (primera vez):**
   ```bash
   docker compose exec ollama ollama pull qwen2.5:1.5b
   ```
4. **Abrir en el navegador:**
   * Aplicación Web (Frontend SPA): [http://localhost](http://localhost)
   * Monitoreo de Salud API: [http://localhost/api/health](http://localhost/api/health)
   * Estado del Asistente IA: [http://localhost/api/ia/estado](http://localhost/api/ia/estado)
   * Panel de Monitoreo Portainer: [http://localhost/portainer/](http://localhost/portainer/) (o puerto directo [http://localhost:9000](http://localhost:9000))

Para más detalles sobre la arquitectura de contenedores, cuotas de recursos y enrutamiento, consulte [docs/arquitectura.md](./docs/arquitectura.md).

### Opción C: Ejecución en Entorno Local (Desarrollo Directo)
- **Microservicios Backend (Laravel 11/12):**
  * [services/backend/api-usuarios/README.md](./services/backend/api-usuarios/README.md) (Autenticación y perfiles)
  * [services/backend/api-inventario/README.md](./services/backend/api-inventario/README.md) (Activos, Kardex e IA)
  * [services/backend/api-flujos/README.md](./services/backend/api-flujos/README.md) (Movimientos y Bitácora)
- **Frontend (Angular SPA):**
  ```bash
  cd services/frontend
  npm install
  npm start
  ```
- **Pruebas Automatizadas:**
  ```bash
  cd services/backend/api-inventario
  php artisan test --filter=IaControllerTest
  ```
