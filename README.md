# Sistema de Inventario - SLEP Los Libertadores

## Descripcion General
Plataforma desarrollada para la administracion de activos, control de inventario y flujo de solicitudes del Servicio Local de Educacion Publica (SLEP) Los Libertadores. El sistema permite gestionar los movimientos internos de equipos, mantener un registro centralizado y aplicar un flujo electronico de aprobaciones para garantizar el control y seguimiento de los recursos.

## Arquitectura y Estructura del Proyecto
El proyecto se basa en una arquitectura cliente-servidor dividida en los siguientes componentes principales ubicados en la carpeta `services`:

- **Frontend:** Construido con Angular 22.
- **Backend:** API REST desarrollada en Laravel 11, utilizando PostgreSQL como motor de base de datos.

## Avances y Funcionalidades Implementadas

### Modulo Frontend
- **Autenticacion y Acceso:** Sistema de inicio de sesion con validacion de credenciales y control de acceso basado en los roles del usuario.
- **Interfaz y Navegacion:** Sidebar interactivo y unificacion de la navegacion, ajustando las pantallas para soportar despliegue de datos masivos.
- **Flujos Electronicos:** Implementacion del modulo de movimientos con segregacion de funciones, permitiendo gestionar traslados y bajas de activos.
- **Control de Stock:** Modulo Kardex para visualizacion del estado actual del inventario, stock disponible e historial.
- **Generacion de Etiquetas:** Modal especifico para consultar e imprimir etiquetas de activos, integrando generacion de codigos QR y codigos de barras.

### Modulo Backend
- **Base de Datos y Modelos:** Estructura en PostgreSQL para gestionar tablas de activos, usuarios, kardex y bitacora de movimientos.
- **Seguridad:** Implementacion de tokens de autorizacion y asignacion de permisos por roles (Solicitante, Aprobador, Encargado de Bodega y Administrador).
- **API Endpoints:** Rutas seguras para manejar la autenticacion, listado y creacion de activos, flujo de aprobaciones de movimientos y registros del kardex.
- **Datos Iniciales (Seeders):** Configuracion de usuarios predeterminados para realizar pruebas locales sin necesidad de registros manuales.

## Instrucciones de Instalacion
Para ejecutar el proyecto en un entorno local, se deben seguir las instrucciones detalladas en cada servicio.

- **Backend (API Inventario):** Revisar el archivo [README del Backend](./services/backend/api-inventario/README.md) para levantar los servicios, ejecutar las migraciones y probar las rutas.
- **Frontend (Interfaz Web):** Revisar la carpeta de frontend en `./services/frontend/` para la instalacion de dependencias y ejecucion del entorno de desarrollo.