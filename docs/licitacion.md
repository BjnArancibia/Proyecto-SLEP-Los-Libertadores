# Especificación Técnica de Licitación y Evaluación Económica

**Proyecto:** Sistema de Gestión Patrimonial e Inventario  
**Mandante:** Servicio Local de Educación Pública (SLEP) Los Libertadores  
**ID Licitación:** `1305541-3-LE26`  
**Asignatura:** Administración de Redes y Sistemas Computacionales  
**Unidad:** Unidad 2 — Containerización, Microservicios y Operaciones de Clúster

---

## 1. Ficha Técnica de la Licitación

| Parámetro                         | Detalle Institucional                                                                                                                                                                                                                                         |
| :-------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Organismo Mandante**            | Servicio Local de Educación Pública (SLEP) Los Libertadores                                                                                                                                                                                                   |
| **Identificador Mercado Público** | Licitación Pública ID: 1305541-3-LE26                                                                                                                                                                                                                         |
| **Territorio y Alcance**          | Establecimientos educacionales públicos de las comunas de Conchalí y Quilicura                                                                                                                                                                                |
| **Objetivo General**              | Proveer una plataforma web centralizada para el inventario de activos fijos, control de existencias en bodega (Kardex), flujo electrónico de traslados/bajas con segregación de funciones, trazabilidad auditable y clasificación asistida mediante IA local. |
| **Normativa Legal Aplicable**     | Ley N° 21.040 (Nueva Educación Pública), Ley N° 19.628 (Protección de la Vida Privada), Resolución N° 7/2019 de la Contraloría General de la República (trazabilidad y control patrimonial público).                                                          |

---

## 2. Matriz de Requerimientos Funcionales (RF)

| Código    | Módulo                   | Descripción del Requerimiento                                                                                                                          | Criterio de Aceptación y Demostración                                                                                                                                        |
| :-------- | :----------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **RF-01** | Autenticación y Perfiles | Autenticación basada en tokens Sanctum con control estricto de acceso basado en roles (RBAC) y prevención de enumeración de identidades.               | 4 roles institucionales (ADMIN, ENCARGADO*BODEGA, SOLICITANTE, APROBADOR). Mensaje unificado de rechazo seguro: *"Credenciales inválidas. Compruebe correo y contraseña."\_. |
| **RF-02** | Gestión Patrimonial e IA | Registro único de bienes muebles, etiquetado patrimonial (código de barras e imprimible QR) y sugerencia automatizada de categoría mediante LLM local. | Generación dinámica de identificadores patrimoniales y clasificación asistida con Ollama (`qwen2.5:1.5b`) sin dependencia de servicios externos.                             |
| **RF-03** | Segregación de Funciones | Flujo electrónico formal de solicitudes de traslado y baja patrimonial con prohibición estricta de auto-aprobación.                                    | El usuario SOLICITANTE crea la solicitud; solo el perfil APROBADOR puede rechazar formalmente; el ENCARGADO_BODEGA ejecuta la recepción o despacho.                          |
| **RF-04** | Kardex en Tiempo Real    | Control de existencias continuo bajo el método Kardex, registrando entradas, salidas, traslados y ajustes físicos.                                     | Balance automatizado de stock físico, actualización inmediata de saldos y vinculación con documentos de respaldo (Guías de Despacho u Órdenes de Compra).                    |
| **RF-05** | Auditoría Inmutable      | Bitácora histórica inalterable que captura el estado anterior y posterior de cada transacción relevante.                                               | Exportación en formato CSV, registro de marca temporal, identidad del custodio e IP origen.                                                                                  |

---

## 3. Matriz de Requerimientos No Funcionales (RNF)

| Código     | Dimensión                         | Especificación Técnica Implementada                                                                                                                                                        |
| :--------- | :-------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **RNF-01** | **Disponibilidad**                | Clúster containerizado resiliente en Docker Compose con políticas de reinicio automático (`restart: unless-stopped`) y healthchecks perimetrales e internos cada 10–30s.                   |
| **RNF-02** | **Seguridad Perimetral**          | Gateway Nginx Alpine Unprivileged (`UID 101`), microservicios Laravel bajo usuario no root `www-data` (`UID 82`) y red privada Docker (`slep-net`) aislada de accesos públicos directos.   |
| **RNF-03** | **Eficiencia y Límites**          | Cuotas de contención estricta de hardware asignadas en Compose (`deploy.resources.limits` y `reservations`), garantizando coexistencia pacífica de 8 servicios en instancias de 4 GB RAM.  |
| **RNF-04** | **Soberanía y Privacidad**        | Motor de IA desplegado localmente en clúster (Ollama en contenedor). Ningún dato ni inventario institucional se transmite a APIs externas de terceros en cumplimiento de la Ley N° 19.628. |
| **RNF-05** | **Portabilidad y Automatización** | Despliegue automatizado reproducible con un comando (`docker compose up -d`), migraciones desasistidas con retry (`AUTO_MIGRATE=true`) y respaldos SQL de contingencia.                    |
| **RNF-06** | **Tolerancia y Respaldo**         | Script automatizado de volcado MySQL (`scripts/backup/backup_db.sh`) con retención de 30 días, cifrado opcional y datos semilla estándar de emergencia (`seeds.sql`).                      |
| **RNF-07** | **Observabilidad Operacional**    | Endpoints de salud unificados (`/healthz`, `/api/health`) y panel gráfico de telemetría y contenedores mediante Portainer Community Edition expuesto bajo proxy inverso.                   |
| **RNF-08** | **Usabilidad y Rendimiento SPA**  | Interfaz desarrollada en Angular 22 LTS empaquetada en Nginx Alpine no privilegiado (~25 MB), optimización gzip y renderizado reactivo con Signals.                                        |

---

## 4. Presupuesto y Evaluación de Costos en Google Cloud Platform (GCP)

Para asegurar la sostenibilidad financiera del SLEP Los Libertadores, se calculó el **Costo Total de Propiedad (TCO)** mensual y anual para el despliegue en la región `southamerica-west1` (Santiago de Chile):

### 4.1. Desglose Mensual Estimado de Infraestructura Cloud

| Componente                        | Tipo de Recurso en GCP           | Especificación Técnica                                                        | Costo Estimado (USD/mes) | Costo Estimado (CLP/mes)\* |
| :-------------------------------- | :------------------------------- | :---------------------------------------------------------------------------- | :----------------------: | :------------------------: |
| **Nodo Principal**                | Compute Engine `e2-standard-2`   | 2 vCPUs, 8 GB RAM (Host de Gateway, Frontend, Microservicios, MySQL y Ollama) |         ~$48.80          |          ~$46.500          |
| **Almacenamiento Persistente**    | Persistent Disk Balanceado (SSD) | 50 GB para bases de datos MySQL, modelos de Ollama y bitácoras                |          ~$6.00          |          ~$5.700           |
| **Dirección IP Pública Estática** | External IP Address              | IP IPv4 estática asignada al Gateway                                          |
| Nginx                             | ~$2.90                           | ~$2.800                                                                       |
| **Tráfico de Red Egress**         | Network Egress (Internet)        | Estimación de 40 GB/mes de salida para acceso de colegios y bodegas           |          ~$4.80          |          ~$4.500           |
| **Respaldo Automático**           | Cloud Storage (Standard Bucket)  | 30 GB de almacenamiento para respaldos mysqldump diarios rotados a 30 días    |          ~$0.60          |           ~$600            |
| **Total Mensual Infraestructura** |                                  |                                                                               |   **~$63.10 USD/mes**    |    **~$60.100 CLP/mes**    |

_\*Tipo de cambio referencial: $950 CLP por USD._

---

### 4.2. Análisis de Ahorro por Adopción de Stack Open Source

La arquitectura diseñada para el SLEP Los Libertadores prescinde por completo de licencias comerciales propietarias por usuario o por núcleo, reduciendo drásticamente el gasto recurrente del organismo mandante:

| Concepto de Licenciamiento | Solución Propietaria Tradicional | Solución SLEP Propuesta (Open Source) | Ahorro Anual Estimado |
| :--- | :--- | :--- | :---: |
| **Sistema Operativo Servidor** | Windows Server Datacenter (~$600 USD) | Ubuntu 24.04 LTS ($0) | ~$600 USD |
| **Motor de Base de Datos** | MS SQL Server Standard (~$1.800 USD) | MySQL 8.0 Community ($0) | ~$1.800 USD |
| **Licencias de Acceso Cliente (CALs)** | 50 licencias nominales (~$2.500 USD) | Sin límite de usuarios (Licencias $0) | ~$2.500 USD |
| **API Inferencia Inteligencia AI** | Consumo por Tokens OpenAI (~$600 USD/año) | Ollama Local con Qwen 2.5 ($0) | ~$600 USD |
| **Monitoreo y Orquestación** | Software APM comercial (~$900 USD/año) | Portainer CE + Nginx ($0) | ~$900 USD |
| **TOTAL ANUAL EN LICENCIAS** | **~$6.400 USD / año** | **$0 USD / año** | **~$6.400 USD / año** |
| **AHORRO ANUAL TOTAL ESTIMADO** | | | **~$6.080.000 CLP / año** |

### 4.3. Conclusión Económica para la Licitación

La solución propuesta no solo cumple con las directrices de austeridad y eficiencia en el gasto público exigidas para los Servicios Locales de Educación, sino que además ofrece un **Costo de Operación (OPEX) inferior a $65.000 CLP mensuales**, eliminando el riesgo de aumentos imprevistos de costos por consumo de tokens de Inteligencia Artificial gracias al uso del modelo local.
