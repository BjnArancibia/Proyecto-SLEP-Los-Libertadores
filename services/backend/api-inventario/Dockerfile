# ==============================================================================
# Dockerfile - Backend Laravel 11/12 (SLEP Los Libertadores)
# Compilación multietapa optimizada sobre PHP 8.3 Alpine ligero
# ==============================================================================

# ------------------------------------------------------------------------------
# Etapa 1: Instalación de dependencias de Composer sin herramientas dev
# ------------------------------------------------------------------------------
FROM composer:2.9.5 AS composer_builder

WORKDIR /app

# Copiar manifiestos de dependencias primero para maximizar caché de capas
COPY composer.json composer.lock ./

# Instalación sin dependencias de desarrollo y con autoloader optimizado
RUN composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader \
    --no-scripts

# ------------------------------------------------------------------------------
# Etapa 2: Imagen final de producción basada en PHP 8.3 CLI Alpine
# Tamaño reducido, extensiones estrictas y ejecución como usuario no-root
# ------------------------------------------------------------------------------
FROM php:8.3.35-cli-alpine3.23 AS runner

LABEL maintainer="Equipo SLEP Los Libertadores"
LABEL description="Microservicio de Inventario, Kardex e IA (RF-02/RF-04) - PHP 8.3 Alpine"

# Instalar extensiones necesarias (PostgreSQL, MySQL, OPcache, PCNTL)
# y eliminar paquetes de compilación para reducir la superficie de la imagen
RUN apk update && apk upgrade --no-cache \
    && apk add --no-cache \
        libpq \
        ca-certificates \
    && apk add --no-cache --virtual .build-deps \
        postgresql-dev \
    && docker-php-ext-install -j$(nproc) \
        pdo_pgsql \
        pdo_mysql \
        opcache \
        pcntl \
    && apk del .build-deps \
    && rm -rf /tmp/* /var/cache/apk/*

# Configuración de producción para PHP
RUN { \
        echo 'expose_php = Off'; \
        echo 'memory_limit = 256M'; \
        echo 'upload_max_filesize = 20M'; \
        echo 'post_max_size = 25M'; \
        echo 'opcache.enable = 1'; \
        echo 'opcache.enable_cli = 1'; \
        echo 'opcache.memory_consumption = 128'; \
        echo 'opcache.interned_strings_buffer = 8'; \
        echo 'opcache.max_accelerated_files = 10000'; \
        echo 'opcache.revalidate_freq = 0'; \
        echo 'opcache.validate_timestamps = 0'; \
    } > /usr/local/etc/php/conf.d/production.ini

WORKDIR /var/www/html

# Copiar el código fuente completo excluyendo lo listado en .dockerignore
COPY --chown=www-data:www-data . .

# Copiar la carpeta vendor desde la etapa de construcción de Composer
COPY --from=composer_builder --chown=www-data:www-data /app/vendor /var/www/html/vendor

# Copiar y asegurar permisos del script de inicio
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Ejecutar el contenedor bajo el usuario no privilegiado www-data (UID 82 en Alpine)
USER www-data

# Puerto del servidor de aplicación
EXPOSE 8000

# Comprobación de salud mediante el endpoint de monitoreo formal (RNF-07)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:8000/api/health || exit 1

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
