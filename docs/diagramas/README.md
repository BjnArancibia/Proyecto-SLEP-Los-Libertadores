# Diagramas de Arquitectura y Flujos Operacionales — Unidad 2

**Proyecto:** Sistema de Gestión Patrimonial e Inventario  
**Mandante:** SLEP Los Libertadores (Licitación ID: `1305541-3-LE26`)

Este directorio contiene la documentación gráfica y esquemática de la arquitectura de contenedores, la seguridad perimetral y los flujos con segregación de funciones exigidos en la Unidad 2.

---

## Índice de Diagramas

1. [Topología del Clúster, Balanceadores y Proxy Inverso](./arquitectura-cluster.md)
   - Distribución de los 8 contenedores en la red privada `slep-net`.
   - Inclusión de los dos balanceadores de carga (perimetral e interno) y el proxy inverso.
   - Justificación teórica para la defensa y asignación de cuotas de CPU/RAM.

2. [Flujo de Solicitudes y Segregación de Funciones (RF-03 y RF-05)](./flujo-segregacion-roles.md)
   - Diagrama de secuencia entre Solicitante, Aprobador, Bodega y Bitácora Inmutable.
   - Restricción de auto-aprobación y auditoría de cambios.

3. [Seguridad Perimetral y Ruteo de Gateway](./seguridad-perimetral.md)
   - Proxy inverso Nginx Alpine no privilegiado.
   - Enrutamiento unificado de endpoints API, SPA Angular y panel Portainer CE.
