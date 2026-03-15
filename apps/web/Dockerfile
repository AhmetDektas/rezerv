FROM node:22-bookworm-slim

# NEXT_PUBLIC_* değişkenleri build zamanında bundle'a gömülür
ARG NEXT_PUBLIC_API_URL=http://89.167.19.1:4000
ARG NEXT_PUBLIC_GOOGLE_MAPS_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_GOOGLE_MAPS_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_KEY

RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

WORKDIR /app

# Bağımlılıkları önce yükle (cache için)
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.json ./
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

# Kaynak kodları kopyala
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

# Next.js production build
RUN pnpm --filter @rezerv/web build

# Güvenlik: root olmayan kullanıcı
RUN groupadd -r rezerv && useradd -r -g rezerv -m rezerv && \
    chown -R rezerv:rezerv /app

USER rezerv

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

WORKDIR /app/apps/web
CMD ["node", "/app/node_modules/.bin/next", "start"]
