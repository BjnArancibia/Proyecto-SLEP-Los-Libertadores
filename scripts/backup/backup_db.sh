#!/usr/bin/env bash
set -e

FECHA=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/slep"
BUCKET_NAME="slep-backups-proyectoadminderedes"
ENV_FILE="/var/www/slep-app/services/backend/api-inventario/.env"

if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

mkdir -p "$BACKUP_DIR"

echo "=== [1/4] Respaldando Base de Datos Cloud SQL ($DB_DATABASE) ==="
mysqldump -h "$DB_HOST" -u "$DB_USERNAME" -p"$DB_PASSWORD" \
    --set-gtid-purged=OFF \
    --single-transaction \
    --quick "$DB_DATABASE" | gzip > "$BACKUP_DIR/db_${FECHA}.sql.gz"

echo "=== [2/4] Respaldando Backend (Storage y Variables de Entorno) ==="
tar -czf "$BACKUP_DIR/backend_${FECHA}.tar.gz" \
    -C /var/www/slep-app/services/backend/api-inventario \
    storage/app/public .env

echo "=== [3/4] Respaldando Frontend (Artefactos de build) ==="
if [ -d "/var/www/slep-app/services/frontend/dist" ]; then
    tar -czf "$BACKUP_DIR/frontend_${FECHA}.tar.gz" \
        -C /var/www/slep-app/services/frontend dist
fi

echo "=== [4/4] Sincronizando copias con Google Cloud Storage ==="
gcloud storage cp "$BACKUP_DIR"/*_${FECHA}* "gs://$BUCKET_NAME/"

echo "=== Limpieza local: conservando últimos 3 días ==="
find "$BACKUP_DIR" -type f -mtime +3 -delete

echo "Proceso de respaldo finalizado con éxito: $FECHA"