#!/usr/bin/env bash
# ==============================================================================
# Pipeline de Despliegue Automatizado - Unidad 2 (Docker Compose)
# SLEP Los Libertadores - Sistema de Gestión Patrimonial e Inventario
# ==============================================================================
set -euo pipefail

# Colores informativos
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # Sin color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ------------------------------------------------------------------------------
# 1. Determinar directorio del proyecto
# ------------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Si existe /var/www/slep-app y no estamos en él, usarlo como ruta estándar de VM
if [ -d "/var/www/slep-app" ] && [ "$PROJECT_DIR" != "/var/www/slep-app" ]; then
    log_info "Directorio de producción detectado en /var/www/slep-app."
    PROJECT_DIR="/var/www/slep-app"
fi

cd "$PROJECT_DIR"
log_info "Directorio de trabajo: $PROJECT_DIR"

# Rama objetivo (por defecto 'main', o la pasada como argumento)
TARGET_BRANCH="${1:-main}"

# ------------------------------------------------------------------------------
# 2. Verificación de dependencias (Docker y Docker Compose)
# ------------------------------------------------------------------------------
log_info "Verificando herramientas del sistema..."

if ! command -v git &>/dev/null; then
    log_error "Git no está instalado en el sistema."
    exit 1
fi

if ! command -v docker &>/dev/null; then
    log_error "Docker no está instalado en el sistema. Asegúrate de instalar Docker CE."
    exit 1
fi

if docker compose version &>/dev/null; then
    COMPOSE="docker compose"
elif command -v docker-compose &>/dev/null; then
    COMPOSE="docker-compose"
else
    log_error "No se encontró Docker Compose (ni plugin 'docker compose' ni binario 'docker-compose')."
    exit 1
fi

log_success "Docker y Docker Compose detectados: $($COMPOSE version)"

# ------------------------------------------------------------------------------
# 3. Liberar puerto 80 si Nginx nativo está activo en la VM (Herencia de U1)
# ------------------------------------------------------------------------------
if command -v systemctl &>/dev/null; then
    if systemctl is-active --quiet nginx; then
        log_warn "Nginx nativo del host está activo (ocupando el puerto 80). Deteniéndolo..."
        sudo systemctl stop nginx || true
        sudo systemctl disable nginx || true
        log_success "Nginx nativo detenido para permitir el enlace de slep-gateway."
    fi
fi

# ------------------------------------------------------------------------------
# 4. Actualización del código fuente desde GitHub
# ------------------------------------------------------------------------------
log_info "Actualizando código desde origin/$TARGET_BRANCH..."
git fetch origin "$TARGET_BRANCH"

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]; then
    log_info "Cambiando de rama '$CURRENT_BRANCH' a '$TARGET_BRANCH'..."
    git checkout "$TARGET_BRANCH"
fi

git pull origin "$TARGET_BRANCH"
COMMIT_HASH="$(git rev-parse --short HEAD)"
log_success "Código actualizado con éxito al commit $COMMIT_HASH."

# ------------------------------------------------------------------------------
# 5. Verificación de variables de entorno (.env)
# ------------------------------------------------------------------------------
if [ ! -f .env ]; then
    log_warn "Archivo .env no encontrado. Creando copia desde .env.example..."
    cp .env.example .env
    log_success "Archivo .env creado. Recuerda revisar las variables si se requieren claves personalizadas."
fi

# ------------------------------------------------------------------------------
# 6. Construcción y orquestación con Docker Compose
# ------------------------------------------------------------------------------
log_info "Construyendo imágenes de contenedores (Frontend Angular, Backend Laravel, Gateway)..."
$COMPOSE build --pull

log_info "Levantando el clúster de servicios (Gateway, Frontend, Backend, Database, Ollama)..."
$COMPOSE up -d --remove-orphans

# ------------------------------------------------------------------------------
# 7. Modelo de Inteligencia Artificial (Ollama)
# ------------------------------------------------------------------------------
OLLAMA_MODEL="${OLLAMA_MODEL:-qwen2.5:1.5b}"
log_info "Verificando disponibilidad del modelo de IA ($OLLAMA_MODEL)..."

# Esperar a que el contenedor de Ollama responda
max_wait=30
count=0
until $COMPOSE exec -T ollama ollama list >/dev/null 2>&1 || [ "$count" -ge "$max_wait" ]; do
    count=$((count + 1))
    sleep 1
done

if $COMPOSE exec -T ollama ollama list 2>/dev/null | grep -q "$OLLAMA_MODEL"; then
    log_success "Modelo de IA '$OLLAMA_MODEL' ya se encuentra descargado."
else
    log_info "Descargando modelo de IA '$OLLAMA_MODEL' dentro del contenedor Ollama (primera vez)..."
    $COMPOSE exec -T ollama ollama pull "$OLLAMA_MODEL"
    log_success "Modelo '$OLLAMA_MODEL' descargado exitosamente."
fi

# ------------------------------------------------------------------------------
# 8. Verificación de Salud del Clúster (Health Check)
# ------------------------------------------------------------------------------
log_info "Esperando que los servicios alcancen estado saludable..."
sleep 5

GATEWAY_PORT="${GATEWAY_PORT:-80}"
HEALTH_URL="http://127.0.0.1:${GATEWAY_PORT}/api/health"
GATEWAY_URL="http://127.0.0.1:${GATEWAY_PORT}/healthz"

max_retries=15
retry=0
healthy=false

while [ "$retry" -lt "$max_retries" ]; do
    retry=$((retry + 1))
    if curl -s -f "$GATEWAY_URL" >/dev/null 2>&1 && curl -s -f "$HEALTH_URL" >/dev/null 2>&1; then
        healthy=true
        break
    fi
    log_info "Verificando salud de la API ($retry/$max_retries)..."
    sleep 3
done

echo ""
echo "=============================================================================="
if [ "$healthy" = true ]; then
    log_success "¡Despliegue completado con éxito! Todos los servicios están operativos."
else
    log_warn "El despliegue finalizó, pero algunos servicios aún están inicializando."
fi
echo "=============================================================================="
echo ""

# Mostrar estado final de los contenedores
log_info "Estado actual del clúster de contenedores:"
$COMPOSE ps

echo ""
log_info "Endpoints disponibles:"
echo " - Aplicación Web (Frontend) : http://localhost:${GATEWAY_PORT}/"
echo " - Monitoreo de Salud API    : http://localhost:${GATEWAY_PORT}/api/health"
echo " - Estado Asistente IA       : http://localhost:${GATEWAY_PORT}/api/ia/estado"
echo " - Panel Monitoreo Portainer : http://localhost:${GATEWAY_PORT}/portainer/ (o puerto :${PORTAINER_PORT:-9000}/)"
echo ""
