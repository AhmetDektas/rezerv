#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Rezerv — Let's Encrypt SSL Sertifikası
# Kullanım: bash scripts/ssl-init.sh api.senin-domain.com email@senin-domain.com
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DOMAIN="${1:?Domain gerekli: bash ssl-init.sh api.domain.com email@domain.com}"
EMAIL="${2:?Email gerekli}"
APP_DIR="/opt/rezerv"

cd "$APP_DIR"

echo "[1/3] Nginx HTTP modunda başlatılıyor (SSL öncesi doğrulama için)..."
docker compose up -d nginx

echo "[2/3] Sertifika alınıyor..."
docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN"

echo "[3/3] nginx/conf.d/api.conf güncelleniyor..."
sed -i "s/DOMAIN\.COM/$DOMAIN/g" nginx/conf.d/api.conf

echo "Nginx yeniden başlatılıyor..."
docker compose exec nginx nginx -s reload

echo ""
echo "SSL sertifikası alındı: $DOMAIN"
echo "Sertifika yenileme (crontab'a ekle):"
echo "  0 3 * * * cd $APP_DIR && docker compose run --rm certbot renew && docker compose exec nginx nginx -s reload"
