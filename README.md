# Rezerv — Rezervasyon Uygulaması

Getir tarzı, çok kategorili online rezervasyon platformu.

## Kategoriler
- 🍽️ **Yeme-İçme** — Restoran, kafe, bar
- 🏥 **Sağlık** — Klinik, diş, psikoloji
- 🏋️ **Spor** — PT, yoga, pilates, kuaför
- 🐾 **Veteriner** — Muayene, tıraş, konaklama (+ Pixel Art Pet!)

## Mimari

```
rezerv/ (Turborepo monorepo)
├── apps/
│   ├── api/        → Hono.js REST API (port 4000)
│   ├── web/        → Next.js 15 (müşteri + işletme paneli) (port 3000)
│   └── mobile/     → Expo (React Native) (iOS & Android)
└── packages/
    ├── db/         → Prisma ORM + PostgreSQL şeması
    ├── types/      → Ortak TypeScript tipleri
    └── utils/      → Ortak yardımcı fonksiyonlar
```

## Kurulum

### Gereksinimler
- Node.js 20+
- pnpm 10+
- PostgreSQL (Supabase, Neon veya local)

### 1. Bağımlılıkları yükle
```bash
pnpm install
```

### 2. Environment değişkenlerini ayarla
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env
```

### 3. Veritabanını hazırla
`.env` dosyasında `DATABASE_URL` ayarlandıktan sonra:
```bash
pnpm db:push        # Şemayı oluştur
pnpm db:generate    # Prisma client oluştur
```

### 4. Geliştirme ortamını başlat
```bash
pnpm dev            # API + Web birlikte çalışır
```

Mobil için:
```bash
pnpm --filter @rezerv/mobile start
```

## Özellikler

| Özellik | Durum |
|---|---|
| Kategori bazlı işletme listesi | ✅ |
| Google Maps işletme konumu | ✅ |
| Saat slotu rezervasyonu | ✅ |
| Kaparo ödeme sistemi (iyzico) | 🔄 (entegrasyon hazır) |
| İşletme yönetim paneli | ✅ |
| Pixel Art Evcil Hayvan | ✅ |
| Abonelik + Komisyon modeli | ✅ |
| Akıllı plan önerisi | ✅ |
| iOS & Android mobil uygulama | ✅ |

## Monetizasyon

- **Abonelik:** İşletme sabit aylık/yıllık ücret öder, komisyon yok
- **Komisyon:** Aylık ücret yok, her kaparo işleminden % kesinti
- **14 gün ücretsiz trial:** Tüm yeni işletmeler için

## Tech Stack
- **API:** Hono.js + Prisma + PostgreSQL
- **Web:** Next.js 15 + Tailwind CSS
- **Mobil:** Expo (React Native) + react-native-maps
- **State:** Zustand + TanStack Query
- **Auth:** JWT (bcrypt)
- **Ödeme:** iyzico
- **Deploy:** Vercel (web) + Cloudflare Workers (api) + Expo EAS (mobil)
