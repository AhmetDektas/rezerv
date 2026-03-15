# Rezerv — Deployment Rehberi

## Mimari

```
[Kullanıcı]
    │
    ├── Web Browser → Vercel (Next.js)
    │                     │
    └── Mobil App  ───────┤
                          │
                    [Hono.js API]  ← VPS / Railway / Render
                          │
                    [PostgreSQL]   ← Supabase / Neon / VPS
```

---

## 1. Google Maps API Key Alma

1. https://console.cloud.google.com/ → Proje oluştur
2. **APIs & Services → Enable APIs** → şunları aktifleştir:
   - Maps JavaScript API
   - Maps Static API
   - Geocoding API (opsiyonel)
3. **Credentials → Create API Key**
4. API Key kısıtlaması:
   - Application restrictions: **HTTP referrers**
   - Website restrictions: `senin-domain.com/*` ve `www.senin-domain.com/*`
5. Key'i kopyala → `.env.local` içine ekle

```
NEXT_PUBLIC_GOOGLE_MAPS_KEY=AIza...
```

---

## 2. Veritabanı — Supabase (Ücretsiz)

1. https://supabase.com → Yeni proje
2. Settings → Database → Connection string → **URI** kopyala
3. `apps/api/.env` dosyasına ekle:
   ```
   DATABASE_URL=postgresql://postgres:[SIFRE]@db.[REF].supabase.co:5432/postgres
   ```
4. Prisma migration çalıştır:
   ```bash
   pnpm db:push
   ```

---

## 3. API Sunucusu — Railway (Önerilen)

```bash
# Railway CLI kur
npm install -g @railway/cli

# Login
railway login

# Proje oluştur
railway init

# Deploy
railway up
```

Railway Dashboard'da Environment Variables:
```
DATABASE_URL=...
JWT_SECRET=...   # openssl rand -base64 32
WEB_URL=https://rezerv.vercel.app
PORT=4000
IYZICO_API_KEY=...
IYZICO_SECRET_KEY=...
```

---

## 4. API Sunucusu — VPS (Docker ile)

```bash
# Sunucuya bağlan
ssh user@sunucu-ip

# Repoyu çek
git clone https://github.com/kullanici/rezerv.git
cd rezerv

# .env oluştur
cp .env.example .env
nano .env   # değerleri doldur

# Docker Compose ile başlat
docker compose up -d

# İlk çalıştırmada veritabanı migration
docker compose exec api node -e "
  const { execSync } = require('child_process');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
"
```

---

## 5. Web — Vercel

```bash
# Vercel CLI
npm install -g vercel

cd apps/web
vercel

# Veya GitHub'a push → Vercel otomatik deploy eder
```

Vercel Dashboard → Environment Variables:
```
NEXT_PUBLIC_API_URL=https://api.senin-domain.com
NEXT_PUBLIC_GOOGLE_MAPS_KEY=AIza...
```

---

## 6. Nginx (VPS için reverse proxy)

```nginx
server {
    listen 80;
    server_name api.senin-domain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

SSL:
```bash
certbot --nginx -d api.senin-domain.com
```

---

## Hızlı Kontrol Listesi

- [ ] Google Maps API key alındı ve kısıtlandı
- [ ] DATABASE_URL ayarlandı
- [ ] JWT_SECRET üretildi (openssl rand -base64 32)
- [ ] `pnpm db:push` çalıştırıldı
- [ ] API deploy edildi, `/health` endpoint'i çalışıyor
- [ ] Web deploy edildi, NEXT_PUBLIC_API_URL ayarlandı
- [ ] iyzico sandbox test edildi
