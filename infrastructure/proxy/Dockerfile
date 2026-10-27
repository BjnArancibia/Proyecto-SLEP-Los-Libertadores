# ==============================================================================
# Dockerfile - Gateway Perimetral Nginx (SLEP Los Libertadores)
# Proxy inverso ligero basado en Nginx Alpine oficial no privilegiado
# ==============================================================================
FROM nginxinc/nginx-unprivileged:1.28-alpine3.23

LABEL maintainer="Equipo SLEP Los Libertadores"
LABEL description="Gateway perimetral y proxy inverso unificado para API y Frontend"

# Reemplazar configuración por defecto con la topología del clúster de contenedores
COPY --chown=nginx:nginx gateway.conf /etc/nginx/conf.d/default.conf

# Puerto expuesto por defecto en la imagen no privilegiada
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
