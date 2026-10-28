#!/bin/sh
set -e

# ==============================================================================
# Entrypoint seguro para el Backend Laravel (SLEP Los Libertadores)
# ==============================================================================

# Asegurar directorios de almacenamiento y caché en tiempo de ejecución
mkdir -p \
    /var/www/html/storage/app/public \
    /var/www/html/storage/framework/cache/data \
    /var/www/html/storage/framework/sessions \
    /var/www/html/storage/framework/views \
    /var/www/html/storage/logs \
    /var/www/html/bootstrap/cache

# Si se pasa flag de migración automática y la base de datos está disponible
if [ "$AUTO_MIGRATE" = "true" ]; then
    max_reintentos=30
    contador=0
    until php artisan db:show >/dev/null 2>&1 || [ "$contador" -ge "$max_reintentos" ]; do
        contador=$((contador + 1))
        echo "[backend] Base de datos no disponible aún, reintentando ($contador/$max_reintentos)..."
        sleep 2
    done

    if [ "$contador" -lt "$max_reintentos" ]; then
        echo "[backend] Base de datos conectada. Ejecutando migraciones pendientes..."
        php artisan migrate --force --no-interaction
    else
        echo "[backend] AVISO: Tiempo de espera agotado para conectar a base de datos. Saltando auto-migrate."
    fi
fi

# Optimización opcional de rutas y configuración si estamos en producción
if [ "$APP_ENV" = "production" ]; then
    php artisan config:cache --no-interaction || true
    php artisan route:cache --no-interaction || true
fi

# Ejecutar el comando principal del contenedor (ej. php artisan serve)
exec "$@"
