<?php

/*
|--------------------------------------------------------------------------
| Catálogo de categorías de activos fijos patrimoniales
|--------------------------------------------------------------------------
|
| Fuente única de verdad para las categorías que la IA puede sugerir.
| El modelo de lenguaje SOLO puede devolver una de estas etiquetas: cualquier
| otra respuesta se rechaza en App\Services\Ia\SugerenciaCategoriaService.
|
| Formato "Categoría — Subcategoría", el mismo que ya utilizaba la interfaz
| de registro de activos ("Equipos computacionales — Notebooks y portátiles").
|
| IMPORTANTE: este catálogo es una propuesta inicial del equipo de desarrollo.
| Debe validarse con el clasificador patrimonial oficial del SLEP antes de
| usarse en producción. Para modificarlo basta con editar este archivo
| (y subir la versión); no requiere migraciones.
|
*/

return [

    'version' => '2026.10-propuesta',

    'categorias' => [
        'Equipos computacionales — Notebooks y portátiles' => 'Notebooks, laptops, ultrabooks y tablets con teclado.',
        'Equipos computacionales — Computadores de escritorio' => 'CPU, all-in-one, mini PC y estaciones de trabajo.',
        'Equipos computacionales — Monitores y periféricos' => 'Monitores, teclados, mouse, webcams, lectores de código.',
        'Equipos computacionales — Impresoras y escáneres' => 'Impresoras, multifuncionales, plotters y escáneres.',
        'Equipos computacionales — Servidores y almacenamiento' => 'Servidores, NAS, discos externos y UPS de sala de servidores.',
        'Equipos de redes y telecomunicaciones' => 'Switches, routers, access points, firewalls, teléfonos IP, radios.',
        'Equipos audiovisuales — Proyectores y pantallas' => 'Proyectores, pantallas interactivas, televisores, telones.',
        'Equipos audiovisuales — Audio y amplificación' => 'Parlantes, amplificadores, micrófonos, mesas de sonido.',
        'Mobiliario escolar — Mesas y sillas de estudiantes' => 'Pupitres, mesas y sillas de uso estudiantil.',
        'Mobiliario de oficina' => 'Escritorios, sillas de oficina, estantes, archivadores, lockers.',
        'Material didáctico y de laboratorio' => 'Microscopios, kits de ciencias, robótica educativa, instrumentos musicales.',
        'Equipamiento deportivo' => 'Arcos, mesas de ping-pong, máquinas de ejercicio, colchonetas.',
        'Electrodomésticos y equipos de cocina' => 'Refrigeradores, hornos, cocinas industriales, hervidores, microondas.',
        'Equipos de climatización' => 'Aires acondicionados, estufas, calefactores, ventiladores.',
        'Herramientas y equipos de mantención' => 'Taladros, escaleras, hidrolavadoras, herramientas eléctricas.',
        'Equipos de seguridad' => 'Cámaras CCTV, alarmas, extintores, grabadores DVR/NVR.',
        'Vehículos' => 'Vehículos motorizados de propiedad institucional.',
        'Otros bienes muebles' => 'Usar solo si ninguna otra categoría aplica razonablemente.',
    ],

];
