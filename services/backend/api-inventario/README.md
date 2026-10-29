# Microservicio 2: API de Inventario, Kardex e IA (`slep-api-inventario`)

**Proyecto:** Sistema de Gestión Patrimonial e Inventario — SLEP Los Libertadores  
**Cobertura Funcional:** **RF-02** (Registro de activos y clasificación asistida por IA) y **RF-04** (Control de stock y Kardex)  
**Stack:** Laravel 11/12 (PHP 8.3 Alpine + Conector HTTP Ollama)

---

## Responsabilidad Arquitectónica

Este microservicio administra el catálogo patrimonial de activos fijos, el libro mayor de existencias en bodega (**Kardex**) y la integración desacoplada con el motor de Inteligencia Artificial local (**Ollama** con `qwen2.5:1.5b`) validada contra el catálogo oficial cerrado ([config/categorias_activos.php](./config/categorias_activos.php)). Asimismo, es el encargado de ejecutar las migraciones automáticas de la base de datos (`AUTO_MIGRATE=true`) al iniciar el clúster.

---

## Ejecución en Desarrollo Local

```bash
cd services/backend/api-inventario
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve --port=8000
```

---

## Endpoints Expuestos (`routes/api.php`)

### 📦 Activos Patrimoniales (RF-02)
- `GET /api/activos`: Retorna el listado completo de bienes y activos fijos registrados.
- `POST /api/activos`: Registra un nuevo activo patrimonial y genera traza de auditoría.
- `GET /api/activos/{id}`: Obtiene el detalle de un activo específico.

### 🤖 Clasificación Asistida por IA — Ollama (RF-02)
- `POST /api/ia/sugerir-categoria`: Recibe `{ "nombre": "...", "descripcion": "..." }` y consulta a Ollama con esquema JSON estricto, retornando categoría oficial, justificación, nivel de confianza y atributos sugeridos.
- `GET /api/ia/estado`: Verifica conectividad en vivo con el contenedor `slep-ollama` y disponibilidad del modelo.
- `GET /api/ia/categorias`: Retorna el catálogo oficial cerrado de categorías y subcategorías SLEP.

### 📊 Kardex y Control de Stock (RF-04)
- `GET /api/kardex`: Obtiene el historial de entradas, salidas, ajustes y transferencias de stock.
- `POST /api/kardex`: Registra un nuevo movimiento de stock en bodega.
- `POST /api/kardex/reset`: Restaura los registros de demostración del Kardex.

### 🩺 Salud (RNF-07)
- `GET /api/health`: Reporta `"service": "api-inventario"`, estado de conexión a MySQL y hostname del contenedor.
