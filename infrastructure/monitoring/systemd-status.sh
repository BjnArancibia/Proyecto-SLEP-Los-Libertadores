#!/bin/bash
# ==============================================================
# Script de Observabilidad y Monitoreo del Clúster
# SLEP Los Libertadores - Unidad 1
# ==============================================================

FECHA=$(date '+%Y-%m-%d %H:%M:%S')
HOST_ACTUAL=$(hostname)
IP_PRIVADA=$(hostname -I | awk '{print $1}')

echo "=========================================================="
echo "   REPORTE DE OBSERVABILIDAD DEL SISTEMA"
echo "   Marca temporal : $FECHA"
echo "   Host auditor   : $HOST_ACTUAL ($IP_PRIVADA)"
echo "=========================================================="

echo -e "\n[1] MÉTRICAS DE RECURSOS DEL SISTEMA OPERATIVO:"
echo "----------------------------------------------------------"
# CPU Load Average
LOAD=$(uptime | awk -F'load average:' '{ print $2 }')
echo "Carga de CPU (1, 5, 15 min):$LOAD"

# Memoria RAM
echo -e "\nMemoria RAM:"
free -h | awk 'NR==1{printf "  %-10s %-10s %-10s %-10s\n", $1, $2, $3, $4} NR==2{printf "  %-10s %-10s %-10s %-10s (Uso: %.1f%%)\n", $1, $2, $3, $4, ($3/$2)*100}'

# Almacenamiento en Disco Persistente
echo -e "\nAlmacenamiento (/):"
df -h / | awk 'NR==1{printf "  %-12s %-8s %-8s %-8s %-6s\n", "Montaje", "Total", "Usado", "Libre", "Uso%"} NR==2{printf "  %-12s %-8s %-8s %-8s %-6s\n", $6, $2, $3, $4, $5}'

echo -e "\n[2] ESTADO DE SERVICIOS CRÍTICOS (systemd):"
echo "----------------------------------------------------------"
SERVICIOS=("nginx" "mysql" "ssh")

# Comprobar si existe el servicio laravel-backend en esta VM
if systemctl list-unit-files | grep -q "laravel-backend"; then
    SERVICIOS+=("laravel-backend")
fi

for srv in "${SERVICIOS[@]}"; do
    if systemctl is-active --quiet "$srv"; then
        printf "  [ ✔ ACTIVO ]  %-20s En ejecución\n" "$srv"
    else
        printf "  [ ✖ FALLA ]   %-20s Detenido / Error\n" "$srv"
    fi
done

echo -e "\n[3] OBSERVABILIDAD DE CONECTIVIDAD Y RÉPLICAS BACKEND:"
echo "----------------------------------------------------------"
# Chequeo local en VM 1
HTTP_LOCAL=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://127.0.0.1:8000/api/health || echo "000")
if [ "$HTTP_LOCAL" == "200" ]; then
    echo "  [ ✔ OK ] Réplica 1 (Local 127.0.0.1:8000): Saludable (HTTP 200)"
else
    echo "  [ ⚠ ALERTA ] Réplica 1 (Local 127.0.0.1:8000): No responde (HTTP $HTTP_LOCAL)"
fi

# Chequeo remoto hacia VM 2 por IP privada
IP_VM2="10.194.0.3"
if ping -c 1 -W 2 "$IP_VM2" > /dev/null 2>&1; then
    echo "  [ ✔ OK ] Enlace de red privada hacia VM 2 ($IP_VM2): Operativo"
    HTTP_VM2=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://"$IP_VM2":8000/api/health || echo "000")
    if [ "$HTTP_VM2" == "200" ]; then
        echo "  [ ✔ OK ] Réplica 2 ($IP_VM2:8000): Saludable (HTTP 200)"
    else
        echo "  [ ⚠ ALERTA ] Réplica 2 ($IP_VM2:8000): Sin respuesta en endpoint /api/health (HTTP $HTTP_VM2)"
    fi
else
    echo "  [ ✖ FALLA ] Sin conectividad ICMP hacia VM 2 ($IP_VM2)"
fi
echo "=========================================================="