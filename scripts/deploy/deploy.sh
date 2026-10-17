#!/usr/bin/env bash
set -e

APP_DIR="/var/www/slep-app"

echo "=== Actualizando repositorio ==="
cd "$APP_DIR"
git pull origin main

echo "=== Desplegando Backend (Laravel) ==="
cd "$APP_DIR/services/backend/api-inventario"
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache

echo "=== Desplegando Frontend (Angular) ==="
cd "$APP_DIR/services/frontend"
npm install
npm run build -- --configuration production

echo "=== Ajustando permisos y recargando servicios ==="
sudo chown -R www-data:www-data "$APP_DIR/services/backend/api-inventario/storage" "$APP_DIR/services/backend/api-inventario/bootstrap/cache"
sudo chmod -R 775 "$APP_DIR/services/backend/api-inventario/storage" "$APP_DIR/services/backend/api-inventario/bootstrap/cache"
sudo chmod -R 755 "$APP_DIR/services/frontend/dist"

sudo systemctl restart php8.3-fpm
sudo systemctl reload nginx

echo "Despliegue completado con éxito."