#!/usr/bin/env bash
set -e

echo "=== 1. Instalando Nginx y PHP 8.3 ==="
sudo apt update
sudo apt install -y nginx git curl unzip ufw \
    php8.3-fpm php8.3-mysql php8.3-mbstring php8.3-xml php8.3-curl php8.3-zip

echo "=== 2. Instalando Node.js 22 LTS ==="
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

echo "=== 3. Instalando Composer ==="
if ! command -v composer &> /dev/null; then
    php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
    sudo php composer-setup.php --install-dir=/usr/local/bin --filename=composer
    rm composer-setup.php
fi

echo "=== 4. Configurando Firewall UFW ==="
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw --force enable

echo "Aprovisionamiento de VM finalizado con éxito."