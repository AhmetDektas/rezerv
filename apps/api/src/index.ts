import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'

import { authRoutes } from './routes/auth'
import { businessRoutes } from './routes/businesses'
import { reservationRoutes } from './routes/reservations'
import { slotRoutes } from './routes/slots'
import { petRoutes } from './routes/pets'
import { paymentRoutes } from './routes/payments'
import { subscriptionRoutes } from './routes/subscriptions'
import { adminRoutes } from './routes/admin'

const app = new Hono()

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use('*', logger())
app.use('*', prettyJSON())
app.use(
  '*',
  cors({
    origin: (origin) => {
      const allowed = [
        process.env.WEB_URL ?? 'http://localhost:3000',
        process.env.MOBILE_URL ?? 'http://localhost:8081',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://89.167.19.1:3001',
        'http://89.167.19.1:3000',
      ]
      if (!origin || allowed.includes(origin)) return origin ?? '*'
      return null
    },
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization', 'X-Admin-Token'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
)

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (c) => c.json({ status: 'ok', service: 'rezerv-api', version: '1.0.0' }))
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// ─── Routes ───────────────────────────────────────────────────────────────────
app.route('/api/auth', authRoutes)
app.route('/api/businesses', businessRoutes)
app.route('/api/reservations', reservationRoutes)
app.route('/api/slots', slotRoutes)
app.route('/api/pets', petRoutes)
app.route('/api/payments', paymentRoutes)
app.route('/api/subscriptions', subscriptionRoutes)
app.route('/api/admin', adminRoutes)

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.notFound((c) => c.json({ error: 'Bulunamadı' }, 404))

// ─── Error Handler ────────────────────────────────────────────────────────────
app.onError((err, c) => {
  console.error('[API Error]', err)
  return c.json({ error: 'Sunucu hatası', message: err.message }, 500)
})

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT ?? 4000)

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`🚀 Rezerv API → http://localhost:${info.port}`)
})

export default app
