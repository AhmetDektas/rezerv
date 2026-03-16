FROM node:22-bookworm-slim

ARG NEXT_PUBLIC_API_URL=http://89.167.19.1:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.json ./
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY apps/dashboard/package.json ./apps/dashboard/

RUN pnpm install --frozen-lockfile

COPY packages/ ./packages/
COPY apps/dashboard/ ./apps/dashboard/

RUN pnpm --filter @rezerv/dashboard build

RUN groupadd -r rezerv && useradd -r -g rezerv -m rezerv && chown -R rezerv:rezerv /app
USER rezerv

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

WORKDIR /app/apps/dashboard
CMD ["node_modules/.bin/next", "start"]
