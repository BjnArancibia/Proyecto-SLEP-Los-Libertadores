#!/bin/bash
set -e

DB_USER="slep_user"
DB_PASS="slep1234"
DB_NAME="slep_db"
BACKUP_DIR="/var/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
FILE_NAME="backup_${DB_NAME}_${DATE}.sql"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Iniciando respaldo de la base de datos ${DB_NAME}..."

# Crear directorio de respaldos si no existe
mkdir -p "$BACKUP_DIR"

# Generar volcado lógico y comprimir
mysqldump -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" > "${BACKUP_DIR}/${FILE_NAME}"
gzip -f "${BACKUP_DIR}/${FILE_NAME}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Respaldo creado exitosamente: ${BACKUP_DIR}/${FILE_NAME}.gz"

# Política de retención: purgar respaldos con más de 7 días
find "$BACKUP_DIR" -type f -name "backup_${DB_NAME}_*.sql.gz" -mtime +7 -exec rm {} \;

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Limpieza completada (retención: 7 días)."