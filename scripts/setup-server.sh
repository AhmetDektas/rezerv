#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Rezerv — Hetzner Sunucu Kurulum Scripti
# Çalıştır: bash setup-server.sh
# Ubuntu 22.04 / 24.04 üzerinde test edildi
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
die()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

[[ $EUID -eq 0 ]] || die "Root olarak çalıştır: sudo bash setup-server.sh"

# ─── 1. Sistem güncellemesi ───────────────────────────────────────────────────
log "Sistem güncelleniyor..."
apt-get update -qq && apt-get upgrade -y -qq

# ─── 2. Docker kurulumu ───────────────────────────────────────────────────────
if command -v docker &>/dev/null; then
    log "Docker zaten kurulu: $(docker --version)"
else
    log "Docker kuruluyor..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    log "Docker kuruldu."
fi

# ─── 3. Docker Compose v2 ─────────────────────────────────────────────────────
if docker compose version &>/dev/null; then
    log "Docker Compose zaten mevcut."
else
    log "Docker Compose plugin kuruluyor..."
    apt-get install -y -qq docker-compose-plugin
fi

# ─── 4. Git ───────────────────────────────────────────────────────────────────
command -v git &>/dev/null || apt-get install -y -qq git
log "Git: $(git --version)"

# ─── 5. Firewall (ufw) ───────────────────────────────────────────────────────
log "Firewall ayarlanıyor..."
apt-get install -y -qq ufw
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
log "Firewall aktif. Açık portlar: 22, 80, 443"

# ─── 6. Deploy kullanıcısı ────────────────────────────────────────────────────
if id "deploy" &>/dev/null; then
    log "deploy kullanıcısı zaten var."
else
    log "deploy kullanıcısı oluşturuluyor..."
    useradd -m -s /bin/bash deploy
    usermod -aG docker deploy
    mkdir -p /home/deploy/.ssh
    # SSH key'i kopyala
    if [[ -f /root/.ssh/authorized_keys ]]; then
        cp /root/.ssh/authorized_keys /home/deploy/.ssh/
        chown -R deploy:deploy /home/deploy/.ssh
        chmod 700 /home/deploy/.ssh
        chmod 600 /home/deploy/.ssh/authorized_keys
    fi
    log "deploy kullanıcısı oluşturuldu ve docker grubuna eklendi."
fi

# ─── 7. Uygulama dizini ───────────────────────────────────────────────────────
APP_DIR="/opt/rezerv"
mkdir -p "$APP_DIR"
chown deploy:deploy "$APP_DIR"
log "Uygulama dizini: $APP_DIR"

# ─── 8. Fail2ban (brute-force koruması) ──────────────────────────────────────
apt-get install -y -qq fail2ban
systemctl enable fail2ban
systemctl start fail2ban
log "Fail2ban aktif."

# ─── Özet ────────────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════"
log "Sunucu kurulumu tamamlandı!"
echo "════════════════════════════════════════"
echo ""
echo "Sonraki adımlar:"
echo "  1. GitHub reposunu deploy et:"
echo "     cd $APP_DIR"
echo "     git clone https://github.com/KULLANICI/rezerv.git ."
echo ""
echo "  2. .env dosyasını oluştur:"
echo "     cp .env.example .env && nano .env"
echo ""
echo "  3. nginx/conf.d/api.conf içindeki DOMAIN.COM'u değiştir"
echo ""
echo "  4. İlk çalıştırma:"
echo "     bash scripts/deploy.sh"
echo ""
echo "  5. SSL sertifikası al:"
echo "     bash scripts/ssl-init.sh senin-domain.com"
echo ""
