#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Rezerv — Deployment Scripti
# Sunucuda çalıştır: bash scripts/deploy.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
die()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

APP_DIR="/opt/rezerv"
cd "$APP_DIR" || die "$APP_DIR bulunamadı"

[[ -f .env ]] || die ".env dosyası yok! cp .env.example .env && nano .env"

log "Kod güncelleniyor..."
git pull origin main

log "Docker image build ediliyor..."
docker compose build --no-cache api

log "Servisler yeniden başlatılıyor..."
docker compose up -d --force-recreate api nginx

log "Veritabanı migration çalıştırılıyor..."
docker compose exec -T api npx prisma migrate deploy 2>/dev/null || \
    warn "Migration atlandı (prisma komutuna erişilemiyor, manual çalıştır)"

log "Servis durumu:"
docker compose ps

echo ""
log "Deploy tamamlandı!"
