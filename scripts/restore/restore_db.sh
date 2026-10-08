#!/bin/bash
set -e

DB_USER="slep_user"
DB_PASS="slep1234"
DB_NAME="slep_db"
BACKUP_DIR="/var/backups/mysql"

# Determinar archivo a restaurar: parámetro manual ($1) o el más reciente
if [ -n "$1" ]; then
    BACKUP_FILE="$1"
else
    BACKUP_FILE=$(ls -t ${BACKUP_DIR}/backup_${DB_NAME}_*.sql.gz 2>/dev/null | head -n 1)
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: No se encontró ningún archivo de respaldo en: $BACKUP_FILE"
    exit 1
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Iniciando restauración desde: $BACKUP_FILE hacia la base de datos ${DB_NAME}..."

# Descomprimir al vuelo e inyectar en MySQL
gunzip -c "$BACKUP_FILE" | mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ¡Restauración completada con éxito!"