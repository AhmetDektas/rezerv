import { createMiddleware } from 'hono/factory'
import { verifyToken, type JwtPayload } from '../lib/jwt'

type AuthEnv = {
  Variables: {
    user: JwtPayload
  }
}

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Yetkilendirme gerekli' }, 401)
  }

  const token = authHeader.slice(7)

  try {
    const payload = verifyToken(token)
    c.set('user', payload)
    await next()
  } catch {
    return c.json({ error: 'Geçersiz veya süresi dolmuş token' }, 401)
  }
})

export const businessOwnerMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Yetkilendirme gerekli' }, 401)
  }

  const token = authHeader.slice(7)

  try {
    const payload = verifyToken(token)
    if (payload.role !== 'BUSINESS_OWNER' && payload.role !== 'ADMIN') {
      return c.json({ error: 'Bu işlem için işletme hesabı gerekli' }, 403)
    }
    c.set('user', payload)
    await next()
  } catch {
    return c.json({ error: 'Geçersiz veya süresi dolmuş token' }, 401)
  }
})
