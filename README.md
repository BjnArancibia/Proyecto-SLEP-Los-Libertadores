# Sistema de Gestión Patrimonial e Inventario - SLEP Los Libertadores

## Descripción General

Plataforma web desarrollada para la administración centralizada de activos fijos, control de existencias en bodega, trazabilidad del flujo de solicitudes y clasificación asistida por Inteligencia Artificial del **Servicio Local de Educación Pública (SLEP) Los Libertadores** (Licitación ID: `1305541-3-LE26`).

El sistema garantiza la continuidad operacional mediante una arquitectura de alta disponibilidad desplegada en Google Cloud Platform (GCP) y un entorno containerizado reproducible con **Docker Compose**, integrando balanceo perimetral, base de datos relacional, auditoría inmutable de transacciones y un motor de modelos de lenguaje local (**Ollama**).

---

## Arquitectura y Estructura del Proyecto

El sistema adopta una arquitectura desacoplada basada en contenedores ligeros y microservicios coordinados en la red privada `slep-net`:

- **Edge Gateway (`slep-gateway`):** Servidor perimetral Nginx no privilegiado que actúa como proxy inverso unificado, balanceando las peticiones a la API (`/api/`) y sirviendo la SPA de Angular (`/`).
- **Frontend SPA (`slep-frontend`):** Aplicación construida en **Angular 22 LTS**, empaquetada mediante compilación multietapa sobre Nginx Alpine (~25 MB).
- **Backend API (`slep-backend`):** API REST desarrollada en **Laravel 11/12 (PHP 8.3 Alpine)** con OPcache, soporte para PostgreSQL / MySQL y auditoría transaccional.
- **Persistencia de Datos (`slep-database`):** Motor relacional **MySQL 8.0** aislado en la red interna con volumen persistente (`slep-mysql-data`).
- **Asistente de IA (`slep-ollama`):** Motor de inferencia local oficial de **Ollama** con el modelo ligero `qwen2.5:1.5b` para clasificación patrimonial asistida bajo catálogo oficial.
- **Panel de Monitoreo (`slep-monitoring`):** Dashboard visual de métricas, salud y logs en tiempo real con **Portainer Community Edition (v2.27.1 Alpine)** en el puerto `:9000`.

```text
proyecto-slep-los-libertadores/
├── .dockerignore
├── .env.example
├── .gitignore
├── README.md
├── docker-compose.yml                # Orquestación de los 5 servicios
├── docs/
│   ├── arquitectura.md               # Especificación técnica de contenedores e IA
│   └── infraestructura-u1.md         # Informe técnico y evidencias de la Unidad 1
├── services/
│   ├── frontend/                     # Aplicación SPA en Angular 22 LTS
│   │   ├── Dockerfile                # Compilación multietapa (Node 24 -> Nginx)
│   │   └── nginx.conf                # Configuración Nginx para SPA fallback
│   └── backend/
│       └── api-inventario/           # API REST Laravel 11/12 (PHP 8.3)
│           ├── Dockerfile            # Imagen ligera PHP 8.3 CLI Alpine con OPcache
│           └── docker-entrypoint.sh  # Script de inicio seguro y migraciones
├── infrastructure/
│   ├── proxy/
│   │   ├── Dockerfile                # Imagen perimetral del Gateway Nginx
│   │   ├── gateway.conf              # Ruteo unificado / y /api/ con timeouts IA
│   │   └── nginx.conf                # Configuración histórica para VM en GCP
│   └── monitoring/
│       └── systemd-status.sh         # Script de observabilidad y salud del clúster (RNF-07)
└── scripts/
    ├── backup/
    │   └── backup_db.sh              # Respaldo automatizado con rotación a 7 días
    ├── restore/
    │   └── restore_db.sh             # Procedimiento y script de Disaster Recovery
    └── deploy/
        ├── deploy.sh                 # Pipeline local de despliegue
        └── setup_vm.sh               # Aprovisionamiento automatizado de VM
```

---

## Avances y Funcionalidades Implementadas

### Módulo Frontend (Angular 22)
- **Autenticación y Acceso:** Sistema de inicio de sesión con validación de credenciales y control de acceso basado en roles.
- **Interfaz y Navegación:** Sidebar interactivo, responsive design y navegación fluida entre módulos.
- **Clasificación Asistida por IA:** Integración interactiva con Ollama en el formulario de activos, con sugerencia contextual, justificación técnica, nivel de confianza y botones de aceptación/descarte.
- **Flujos Electrónicos:** Módulo de movimientos con segregación de funciones para traslados y bajas de bienes.
- **Control de Stock y Bodega:** Módulo Kardex para existencias en tiempo real, catálogo multicódigo y alertas de reposición.
- **Generación de Etiquetas:** Modal con generación dinámica de códigos QR y códigos de barras (Code128).
- **Bitácora Auditable:** Trazabilidad histórica completa de transacciones, valores anteriores/posteriores y exportación CSV.

### Módulo Backend (Laravel 11/12)
- **Integración con Ollama:** Conector HTTP desacoplado con control de timeouts, esquema JSON estricto y validación contra catálogo oficial ([config/categorias_activos.php](./services/backend/api-inventario/config/categorias_activos.php)).
- **Resiliencia Operacional:** Manejo de excepciones de IA (`503 Service Unavailable`, `502 Bad Gateway`) que garantizan que el inventario siga operando manualmente si Ollama no está disponible.
- **Base de Datos y Modelos:** Tablas de activos, usuarios, kardex, movimientos y bitácora de transacciones.
- **Seguridad y Auditoría:** Autenticación con Sanctum, middleware de roles y servicio transversal `AuditoriaService`.
- **Monitoreo de Salud (RNF-07):** Endpoint formal `GET /api/health` para observabilidad del estado de la base de datos y uptime.

---

## Instrucciones de Instalación y Ejecución

### Opción A: Despliegue con Docker Compose (Recomendado)
Para levantar el clúster completo con los 5 servicios:

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
   * Aplicación Web: [http://localhost](http://localhost)
   * Monitoreo de Salud: [http://localhost/api/health](http://localhost/api/health)
   * Estado del Asistente IA: [http://localhost/api/ia/estado](http://localhost/api/ia/estado)
   * Panel de Monitoreo Portainer: [http://localhost:9000](http://localhost:9000)

Para más detalles sobre la arquitectura de contenedores, consulte [docs/arquitectura.md](./docs/arquitectura.md).

### Opción B: Ejecución en Entorno Local (Desarrollo Directo)
- **Backend (API Laravel):**
  ```bash
  cd services/backend/api-inventario
  composer install
  php artisan migrate
  php artisan serve --port=8000
  ```
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
