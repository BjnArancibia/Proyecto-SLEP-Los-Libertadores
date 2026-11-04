# Especificación Técnica de Licitación y Evaluación Económica

**Proyecto:** Sistema de Gestión Patrimonial e Inventario  
**Mandante:** Servicio Local de Educación Pública (SLEP) Los Libertadores  
**ID Licitación:** `1305541-3-LE26`  
**Asignatura:** Administración de Redes y Sistemas Computacionales  
**Unidad:** Unidad 2 — Containerización, Microservicios y Operaciones de Clúster

---

## 1. Ficha Técnica de la Licitación

| Parámetro                            | Detalle Institucional                                                                                                                                                                                                            |
| :----------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Organismo Mandante**               | Servicio Local de Educación Pública (SLEP) Los Libertadores                                                                                                                                                                      |
| **Identificador Mercado Público**    | Licitación Pública ID: `1305541-3-LE26`                                                                                                                                                                                          |
| **Referencia y Acto Administrativo** | Licitación _"Arriendo de Software de Inventario, Bodega y Activo Fijo"_, asociada a la Resolución Exenta 555/02-09-2026                                                                                                          |
| **Enlace Oficial Mercado Público**   | [Ficha de Adquisición Mercado Público](https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?qs=ssX8Q1Qe8LTDvuETJPGdUw==)                                                                                |
| **Territorio y Alcance**             | Establecimientos educacionales públicos de las comunas de Conchalí y Quilicura                                                                                                                                                   |
| **Problema y Actores Clave**         | Centralizar, controlar y trazar existencias y bienes muebles bajo una plataforma SaaS multiestablecimiento. Actores: Administradores del sistema, Encargados de bodega, Personal de control patrimonial y Usuarios solicitantes. |
| **Normativa Legal Aplicable**        | Ley N° 21.040 (Nueva Educación Pública), Ley N° 19.628 (Protección de la Vida Privada), Resolución N° 7/2019 de la Contraloría General de la República (trazabilidad y control patrimonial público).                             |

---

## 2. Matriz de Requerimientos Funcionales (RF)

Estipulados formalmente según el documento de análisis del proyecto:

| Código    | Requisito Funcional                                               | Descripción Oficial (Documento Base)                                                                                                                                                                                                                                                                                                        | Implementación Técnica y Criterio de Aceptación                                                                                                                                                                            |
| :-------- | :---------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **RF-01** | **Gestión de Acceso y Perfiles Diferenciados**                    | El sistema debe implementar control de acceso por credenciales únicas y gestión de roles (Administrador, Encargado de Bodega, Solicitante y Aprobador). Debe impedir accesos y privilegios no autorizados según la matriz de permisos y restringir la visibilidad de datos por establecimiento educacional.                                 | Autenticación basada en tokens Sanctum, RBAC para los 4 perfiles, visibilidad delimitada por establecimiento_id y mensaje genérico seguro contra enumeración (_"Credenciales inválidas. Compruebe correo y contraseña."_). |
| **RF-02** | **Registro e Identificación Individual de Activos**               | El sistema debe registrar fichas individuales para cada activo fijo, asignando un identificador patrimonial único, número de serie, marca, modelo, estado de conservación. Asimismo, debe generar y reconocer códigos de barra y códigos QR vinculados a la ficha.                                                                          | Módulo de activos con ficha patrimonial, generación de identificadores únicos, renderizado dinámico de código de barras (JsBarcode), código QR imprimible y sugerencia asistida con IA local (Ollama).                     |
| **RF-03** | **Flujo Electrónico de Movimientos con Segregación de Funciones** | La plataforma debe proveer un flujo configurable para solicitar, revisar, autorizar y ejecutar altas, traslados, asignaciones, devoluciones y bajas de bienes patrimoniales. El sistema debe prohibir estrictamente la autoaprobación de solicitudes por parte del usuario solicitante, restringiendo la aprobación a perfiles autorizados. | Circuito electrónico con validación de roles en backend: creación exclusiva por SOLICITANTE, resolución bloqueada para el creador y reservada exclusivamente para perfil APROBADOR.                                        |
| **RF-04** | **Control de Stock y Kardex de Bodega en Tiempo Real**            | El sistema debe gestionar el ciclo de existencias de insumos y materiales, actualizando automáticamente los inventarios en origen/destino y manteniendo un Kardex continuo auditable por producto.                                                                                                                                          | Módulo Kardex con balance de entradas, salidas, traslados y ajustes físicos, actualización inmediata de saldos y vinculación con documentos de respaldo (Guías de Despacho u Órdenes de Compra).                           |
| **RF-05** | **Bitácora Auditable de Transacciones**                           | El sistema debe registrar de forma automática una bitácora histórica para cada operación sobre activos y existencias, almacenando folio, fecha/hora, usuario, perfil, acción ejecutada, decisión, justificación y los valores anteriores y posteriores del registro.                                                                        | Bitácora inmutable en base de datos con registro de marcas temporales, IP de origen y función de exportación a planilla CSV.                                                                                               |

---

## 3. Matriz de Requerimientos No Funcionales (RNF)

Estipulados formalmente según el documento de análisis del proyecto:

| Código     | Requisito No Funcional                                              | Descripción Oficial (Documento Base)                                                                                                                                                                                          | Especificación Técnica Implementada                                                                                                                                                                           |
| :--------- | :------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **RNF-01** | **Aislamiento y Segregación de Datos**                              | La base de datos del sistema debe estar aislada física o lógicamente de cualquier otro sistema o cliente, garantizando la privacidad, confidencialidad y consistencia del inventario institucional del SLEP Los Libertadores. | Base de datos relacional MySQL 8.0 aislada en la red interna privada `slep-net`, sin exposición de puertos hacia Internet y protegida con credenciales seguras.                                               |
| **RNF-02** | **Disponibilidad y Continuidad del Servicio (Alta Disponibilidad)** | El sistema deberá garantizar disponibilidad funcional durante las ventanas de evaluación del curso, conexión web estándar y ejecución de respaldos automatizados básicos para demostrar el procedimiento.                     | Clúster resiliente en Docker Compose con políticas de reinicio automático (`restart: unless-stopped`), healthchecks ampliados (`start_period: 60s`, `retries: 5`), balanceo y monitoreo en tiempo real.       |
| **RNF-03** | **Automatización de Respaldos de datos**                            | El sistema debe ejecutar respaldos automatizados y periódicos de las bases de datos y archivos almacenados que aseguren la integridad de la información ante contingencias.                                                   | Scripts automatizados de volcado (`scripts/backup/backup_db.sh`) y restauración (`scripts/restore/restore_db.sh`) con compresión gzip, rotación de archivos y datos semilla de emergencia (`seeds.sql`).      |
| **RNF-04** | **Compatibilidad y Estándar Web**                                   | La interfaz de usuario debe ser accesible a través de navegadores web modernos estándar (Google Chrome, Mozilla Firefox, Microsoft Edge) sin requerir la instalación de plugins o componentes propietarios en el cliente.     | Frontend SPA en Angular 22 LTS empaquetado sobre Nginx Alpine no privilegiado (~25 MB), optimizado para navegadores modernos con HTML5/CSS3 estándar, gzip y diseño responsivo.                               |
| **RNF-05** | **Tiempos de Respuesta y Rendimiento de consultas**                 | Las consultas de catálogos, Kardex y búsquedas de fichas de activos por código, custodio o dependencia no deben superar tiempos de respuesta de 2 a 3 segundos bajo carga operacional estándar.                               | Límites y reservas estrictas de CPU y RAM en Compose, OPcache activado en PHP 8.3 CLI, índices en tablas relacionales (`assets`, `kardexes`, `bitacora_transacciones`) y Keepalive upstream en Nginx Gateway. |

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

| Concepto de Licenciamiento             | Solución Propietaria Tradicional          | Solución SLEP Propuesta (Open Source) |   Ahorro Anual Estimado   |
| :------------------------------------- | :---------------------------------------- | :------------------------------------ | :-----------------------: |
| **Sistema Operativo Servidor**         | Windows Server Datacenter (~$600 USD)     | Ubuntu 24.04 LTS ($0)                 |         ~$600 USD         |
| **Motor de Base de Datos**             | MS SQL Server Standard (~$1.800 USD)      | MySQL 8.0 Community ($0)              |        ~$1.800 USD        |
| **Licencias de Acceso Cliente (CALs)** | 50 licencias nominales (~$2.500 USD)      | Sin límite de usuarios (Licencias $0) |        ~$2.500 USD        |
| **API Inferencia Inteligencia AI**     | Consumo por Tokens OpenAI (~$600 USD/año) | Ollama Local con Qwen 2.5 ($0)        |         ~$600 USD         |
| **Monitoreo y Orquestación**           | Software APM comercial (~$900 USD/año)    | Portainer CE + Nginx ($0)             |         ~$900 USD         |
| **TOTAL ANUAL EN LICENCIAS**           | **~$6.400 USD / año**                     | **$0 USD / año**                      |   **~$6.400 USD / año**   |
| **AHORRO ANUAL TOTAL ESTIMADO**        |                                           |                                       | **~$6.080.000 CLP / año** |

### 4.3. Conclusión Económica para la Licitación

La solución propuesta no solo cumple con las directrices de austeridad y eficiencia en el gasto público exigidas para los Servicios Locales de Educación, sino que además ofrece un **Costo de Operación (OPEX) inferior a $65.000 CLP mensuales**, eliminando el riesgo de aumentos imprevistos de costos por consumo de tokens de Inteligencia Artificial gracias al uso del modelo local.
