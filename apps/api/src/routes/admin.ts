import { Hono } from 'hono'
import { createMiddleware } from 'hono/factory'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@rezerv/db'
import { slugify } from '@rezerv/utils'

// ─── Admin Auth Middleware ────────────────────────────────────────────────────
const adminMiddleware = createMiddleware(async (c, next) => {
  const token = c.req.header('X-Admin-Token')
  const secret = process.env.ADMIN_SECRET

  if (!secret) {
    return c.json({ error: 'Admin özelliği yapılandırılmamış' }, 503)
  }

  if (token !== secret) {
    return c.json({ error: 'Geçersiz admin token' }, 401)
  }

  await next()
})

export const adminRoutes = new Hono()

// Tüm admin rotalarına middleware uygula
adminRoutes.use('*', adminMiddleware)

// ─── Genel İstatistikler ─────────────────────────────────────────────────────
adminRoutes.get('/stats', async (c) => {
  const [businesses, users, reservations] = await Promise.all([
    prisma.business.count(),
    prisma.user.count(),
    prisma.reservation.count(),
  ])

  const activeBusinesses = await prisma.business.count({ where: { isActive: true } })
  const todayReservations = await prisma.reservation.count({
    where: {
      createdAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
  })

  return c.json({
    data: {
      businesses,
      activeBusinesses,
      users,
      reservations,
      todayReservations,
    },
  })
})

// ─── Tüm İşletmeleri Listele ─────────────────────────────────────────────────
adminRoutes.get('/businesses', async (c) => {
  const businesses = await prisma.business.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      owner: { select: { id: true, name: true, email: true, phone: true } },
      _count: { select: { reservations: true } },
    },
  })

  return c.json({ data: businesses })
})

// ─── İşletme Oluştur ─────────────────────────────────────────────────────────
adminRoutes.post(
  '/businesses',
  zValidator(
    'json',
    z.object({
      // İşletme bilgileri
      name: z.string().min(2),
      category: z.enum(['FOOD_DRINK', 'HEALTH', 'SPORTS', 'VETERINARY']),
      description: z.string().optional(),
      address: z.string().min(5),
      lat: z.number(),
      lng: z.number(),
      phone: z.string().min(10),
      email: z.string().email(),
      // Görseller
      coverImage: z.string().url().optional(),
      logoUrl: z.string().url().optional(),
      images: z.array(z.string().url()).optional(),
      // İşletme sahibi (opsiyonel — verilirse kullanıcı oluşturulur/bulunur)
      ownerName: z.string().min(2).optional(),
      ownerEmail: z.string().email().optional(),
      ownerPhone: z.string().min(10).optional(),
    })
  ),
  async (c) => {
    const body = c.req.valid('json')

    // Slug oluştur
    let slug = slugify(body.name)
    const existing = await prisma.business.findUnique({ where: { slug } })
    if (existing) slug = `${slug}-${Date.now()}`

    // Sahibi bul ya da oluştur
    let ownerId: string

    if (body.ownerEmail) {
      let owner = await prisma.user.findUnique({ where: { email: body.ownerEmail } })

      if (!owner) {
        const tempPassword = Math.random().toString(36).slice(-10)
        const hashedPassword = await bcrypt.hash(tempPassword, 12)

        owner = await prisma.user.create({
          data: {
            name: body.ownerName ?? body.name,
            email: body.ownerEmail,
            phone: body.ownerPhone ?? body.phone,
            password: hashedPassword,
            role: 'BUSINESS_OWNER',
          },
        })
      } else if (owner.role === 'CUSTOMER') {
        // Müşteri hesabını işletme sahibine yükselt
        owner = await prisma.user.update({
          where: { id: owner.id },
          data: { role: 'BUSINESS_OWNER' },
        })
      }

      ownerId = owner.id
    } else {
      // Admin tarafından oluşturulan, sahipsiz işletme için sistem kullanıcısı
      let systemUser = await prisma.user.findUnique({
        where: { email: 'system@rezerv.app' },
      })

      if (!systemUser) {
        systemUser = await prisma.user.create({
          data: {
            name: 'Sistem',
            email: 'system@rezerv.app',
            phone: `0500${Date.now().toString().slice(-7)}`,
            password: await bcrypt.hash(Math.random().toString(36), 12),
            role: 'BUSINESS_OWNER',
          },
        })
      }

      ownerId = systemUser.id
    }

    // İşletmeyi oluştur
    const business = await prisma.business.create({
      data: {
        name: body.name,
        slug,
        category: body.category,
        description: body.description,
        address: body.address,
        lat: body.lat,
        lng: body.lng,
        phone: body.phone,
        email: body.email,
        coverImage: body.coverImage,
        logoUrl: body.logoUrl,
        images: body.images ?? [],
        ownerId,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    })

    // Varsayılan çalışma saatlerini oluştur (Pzt-Cuma 09:00-18:00)
    await prisma.businessHour.createMany({
      data: Array.from({ length: 7 }, (_, i) => ({
        businessId: business.id,
        dayOfWeek: i,
        openTime: '09:00',
        closeTime: '18:00',
        isClosed: i === 0 || i === 6, // Pazar-Cumartesi kapalı
      })),
    })

    return c.json({ data: business }, 201)
  }
)

// ─── İşletme Güncelle ────────────────────────────────────────────────────────
adminRoutes.patch(
  '/businesses/:id',
  zValidator(
    'json',
    z.object({
      name: z.string().min(2).optional(),
      description: z.string().optional(),
      address: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      coverImage: z.string().url().optional().nullable(),
      logoUrl: z.string().url().optional().nullable(),
      images: z.array(z.string().url()).optional(),
      isActive: z.boolean().optional(),
      requiresDeposit: z.boolean().optional(),
      depositType: z.enum(['FIXED', 'PERCENTAGE']).optional(),
      depositAmount: z.number().positive().optional(),
      depositPercent: z.number().min(1).max(100).optional(),
    })
  ),
  async (c) => {
    const id = c.req.param('id')
    const body = c.req.valid('json')

    const business = await prisma.business.findUnique({ where: { id } })
    if (!business) return c.json({ error: 'İşletme bulunamadı' }, 404)

    const updated = await prisma.business.update({
      where: { id },
      data: body,
      include: { owner: { select: { id: true, name: true, email: true } } },
    })

    return c.json({ data: updated })
  }
)

// ─── İşletme Aktif/Pasif Değiştir ────────────────────────────────────────────
adminRoutes.patch('/businesses/:id/toggle', async (c) => {
  const id = c.req.param('id')

  const business = await prisma.business.findUnique({ where: { id } })
  if (!business) return c.json({ error: 'İşletme bulunamadı' }, 404)

  const updated = await prisma.business.update({
    where: { id },
    data: { isActive: !business.isActive },
  })

  return c.json({ data: updated })
})

// ─── İşletme Sil ─────────────────────────────────────────────────────────────
adminRoutes.delete('/businesses/:id', async (c) => {
  const id = c.req.param('id')

  const business = await prisma.business.findUnique({ where: { id } })
  if (!business) return c.json({ error: 'İşletme bulunamadı' }, 404)

  // Soft delete — sadece pasif yap, gerçek silme yapma
  await prisma.business.update({ where: { id }, data: { isActive: false } })

  return c.json({ data: { message: 'İşletme devre dışı bırakıldı' } })
})

// ─── Kullanıcıları Listele ────────────────────────────────────────────────────
adminRoutes.get('/users', async (c) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      _count: { select: { businesses: true, reservations: true } },
    },
  })

  return c.json({ data: users })
})
