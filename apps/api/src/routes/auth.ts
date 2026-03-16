import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@rezerv/db'
import { signToken } from '../lib/jwt'
import { authMiddleware } from '../middleware/auth'

export const authRoutes = new Hono()

// ─── Müşteri Kaydı ────────────────────────────────────────────────────────────
authRoutes.post(
  '/register/customer',
  zValidator(
    'json',
    z.object({
      name: z.string().min(2),
      email: z.string().email(),
      phone: z.string().min(10),
      password: z.string().min(6),
    })
  ),
  async (c) => {
    const body = c.req.valid('json')

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: body.email }, { phone: body.phone }] },
    })

    if (existing) {
      return c.json({ error: 'Bu email veya telefon zaten kayıtlı' }, 409)
    }

    const hashedPassword = await bcrypt.hash(body.password, 12)

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        password: hashedPassword,
        role: 'CUSTOMER',
      },
    })

    const token = signToken({ userId: user.id, role: user.role })

    return c.json(
      {
        data: {
          token,
          user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, avatarUrl: user.avatarUrl },
        },
      },
      201
    )
  }
)

// ─── İşletme Sahibi Kaydı ─────────────────────────────────────────────────────
authRoutes.post(
  '/register/business',
  zValidator(
    'json',
    z.object({
      name: z.string().min(2),
      email: z.string().email(),
      phone: z.string().min(10),
      password: z.string().min(6),
    })
  ),
  async (c) => {
    const body = c.req.valid('json')

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: body.email }, { phone: body.phone }] },
    })

    if (existing) {
      return c.json({ error: 'Bu email veya telefon zaten kayıtlı' }, 409)
    }

    const hashedPassword = await bcrypt.hash(body.password, 12)

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        password: hashedPassword,
        role: 'BUSINESS_OWNER',
      },
    })

    const token = signToken({ userId: user.id, role: user.role })

    return c.json(
      {
        data: {
          token,
          user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, avatarUrl: user.avatarUrl },
        },
      },
      201
    )
  }
)

// ─── Müşteri Kaydı (kısa yol) ────────────────────────────────────────────────
authRoutes.post(
  '/register',
  zValidator(
    'json',
    z.object({
      name: z.string().min(2),
      email: z.string().email(),
      phone: z.string().min(10),
      password: z.string().min(6),
    })
  ),
  async (c) => {
    const body = c.req.valid('json')

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: body.email }, { phone: body.phone }] },
    })

    if (existing) {
      return c.json({ error: 'Bu email veya telefon zaten kayıtlı' }, 409)
    }

    const hashedPassword = await bcrypt.hash(body.password, 12)
    const user = await prisma.user.create({
      data: { name: body.name, email: body.email, phone: body.phone, password: hashedPassword, role: 'CUSTOMER' },
    })

    const token = signToken({ userId: user.id, role: user.role })
    return c.json({ data: { token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, avatarUrl: user.avatarUrl } } }, 201)
  }
)

// ─── Giriş ────────────────────────────────────────────────────────────────────
authRoutes.post(
  '/login',
  zValidator(
    'json',
    z.object({
      email: z.string().email(),
      password: z.string().min(1),
    })
  ),
  async (c) => {
    const { email, password } = c.req.valid('json')

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return c.json({ error: 'Email veya şifre hatalı' }, 401)
    }

    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      return c.json({ error: 'Email veya şifre hatalı' }, 401)
    }

    const token = signToken({ userId: user.id, role: user.role })

    return c.json({
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, avatarUrl: user.avatarUrl },
      },
    })
  }
)

// ─── Mevcut Kullanıcı ─────────────────────────────────────────────────────────
authRoutes.get('/me', authMiddleware, async (c) => {
  const { userId } = c.get('user')

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true, role: true, avatarUrl: true, createdAt: true },
  })

  if (!user) {
    return c.json({ error: 'Kullanıcı bulunamadı' }, 404)
  }

  return c.json({ data: user })
})

// ─── Şifre Güncelle ───────────────────────────────────────────────────────────
authRoutes.patch(
  '/password',
  authMiddleware,
  zValidator(
    'json',
    z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(6),
    })
  ),
  async (c) => {
    const { userId } = c.get('user')
    const { currentPassword, newPassword } = c.req.valid('json')

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return c.json({ error: 'Kullanıcı bulunamadı' }, 404)

    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) return c.json({ error: 'Mevcut şifre hatalı' }, 400)

    const hashed = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } })

    return c.json({ data: { message: 'Şifre güncellendi' } })
  }
)
