# ==============================================================================
# Dockerfile - Frontend Angular 22 (SLEP Los Libertadores)
# Compilación multietapa optimizada con imagen final Nginx no privilegiada.
# ==============================================================================

# ------------------------------------------------------------------------------
# Etapa 1: Compilación de la aplicación Angular con Node.js 22 LTS Alpine
# ------------------------------------------------------------------------------
FROM node:22.23.4-alpine3.23 AS builder

WORKDIR /app

# Desactivar advertencia de versión en CLI y asegurar compatibilidad
ENV NG_DISABLE_VERSION_CHECK=1

# Aprovechar caché de capas: copiar manifiestos de dependencias primero
COPY package.json package-lock.json ./

# Instalación reproducible y limpia de dependencias
RUN npm ci --no-audit --prefer-offline

# Copiar el código fuente completo
COPY . .

# Compilación de producción (genera bundles minificados en dist/slep-gestion-patrimonial/browser)
RUN npm run build -- --configuration production

# ------------------------------------------------------------------------------
# Etapa 2: Servidor estático con Nginx Unprivileged (sin privilegios de root)
# Tamaño final aproximado: ~25 MB (excluye Node.js, npm y node_modules)
# ------------------------------------------------------------------------------
FROM nginxinc/nginx-unprivileged:1.28-alpine3.23 AS runner

# Metadatos del artefacto
LABEL maintainer="Equipo SLEP Los Libertadores"
LABEL description="Frontend Angular 22 servido mediante Nginx no privilegiado"

# Configuración personalizada de Nginx para SPA (fallback a index.html y gzip)
COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf

# Copiar únicamente los archivos estáticos compilados desde la etapa de build
COPY --from=builder --chown=nginx:nginx /app/dist/slep-gestion-patrimonial/browser /usr/share/nginx/html

# Puerto de escucha del usuario no privilegiado (UID 101)
EXPOSE 8080

# Comprobación de salud interna
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:8080/healthz || exit 1

# Comando de ejecución estándar de Nginx
CMD ["nginx", "-g", "daemon off;"]
