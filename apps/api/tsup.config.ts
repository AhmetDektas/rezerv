import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  target: 'node22',
  outDir: 'dist',
  clean: true,
  sourcemap: false,
  minify: false,
  // Workspace paketlerini bundle'a dahil et
  noExternal: ['@rezerv/db', '@rezerv/types', '@rezerv/utils'],
  // Node built-ins ve npm paketleri dışarıda kalsın
  external: [
    '@prisma/client',
    'hono',
    '@hono/node-server',
    '@hono/zod-validator',
    'bcryptjs',
    'jsonwebtoken',
    'zod',
    'better-auth',
  ],
})
