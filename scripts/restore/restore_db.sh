#!/usr/bin/env bash
set -e

if [ -z "$1" ]; then
    echo "Uso: $0 <archivo_backup.sql.gz o gs://bucket/archivo.sql.gz>"
    exit 1
fi

INPUT_FILE="$1"
ENV_FILE="/var/www/slep-app/services/backend/api-inventario/.env"

if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

TMP_FILE="/tmp/restore_db_temp.sql.gz"

if [[ "$INPUT_FILE" == gs://* ]]; then
    echo "Descargando respaldo desde Google Cloud Storage..."
    gcloud storage cp "$INPUT_FILE" "$TMP_FILE"
    TARGET="$TMP_FILE"
else
    TARGET="$INPUT_FILE"
fi

echo "Restaurando base de datos en Cloud SQL ($DB_HOST)..."
gunzip -c "$TARGET" | mysql -h "$DB_HOST" -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_DATABASE"

if [ -f "$TMP_FILE" ]; then
    rm -f "$TMP_FILE"
fi

echo "Base de datos restaurada exitosamente."