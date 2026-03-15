FROM node:22-bookworm-slim

# OpenSSL — Prisma engine için gerekli
RUN apt-get update -y && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

WORKDIR /app

# Bağımlılıkları önce yükle (cache için)
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile

# Kaynak kodları kopyala
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Prisma client üret ve API'yi derle
RUN pnpm --filter @rezerv/db generate && \
    pnpm --filter @rezerv/api build

# Güvenlik: root olmayan kullanıcı
RUN groupadd -r rezerv && useradd -r -g rezerv rezerv && \
    chown -R rezerv:rezerv /app

USER rezerv

ENV NODE_ENV=production

EXPOSE 4000

CMD ["node", "apps/api/dist/index.js"]
