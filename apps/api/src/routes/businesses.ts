import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '@rezerv/db'
import { slugify } from '@rezerv/utils'
import { authMiddleware, businessOwnerMiddleware } from '../middleware/auth'

export const businessRoutes = new Hono()

// ─── İşletme Listele (Kategori + Arama) ──────────────────────────────────────
businessRoutes.get(
  '/',
  zValidator(
    'query',
    z.object({
      category: z.enum(['FOOD_DRINK', 'HEALTH', 'SPORTS', 'VETERINARY']).optional(),
      search: z.string().optional(),
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(20),
      lat: z.coerce.number().optional(),
      lng: z.coerce.number().optional(),
    })
  ),
  async (c) => {
    const { category, search, page, limit } = c.req.valid('query')
    const skip = (page - 1) * limit

    const where = {
      isActive: true,
      ...(category && { category }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
          { address: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          description: true,
          address: true,
          lat: true,
          lng: true,
          phone: true,
          coverImage: true,
          logoUrl: true,
          requiresDeposit: true,
          depositType: true,
          depositAmount: true,
          depositPercent: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.business.count({ where }),
    ])

    return c.json({
      data: businesses,
      total,
      page,
      limit,
      hasMore: skip + businesses.length < total,
    })
  }
)

// ─── İşletme Detay (slug ile) ─────────────────────────────────────────────────
businessRoutes.get('/:slug', async (c) => {
  const slug = c.req.param('slug')

  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      hours: { orderBy: { dayOfWeek: 'asc' } },
      owner: { select: { name: true } },
    },
  })

  if (!business) {
    return c.json({ error: 'İşletme bulunamadı' }, 404)
  }

  return c.json({ data: business })
})

// ─── İşletme Oluştur ──────────────────────────────────────────────────────────
businessRoutes.post(
  '/',
  businessOwnerMiddleware,
  zValidator(
    'json',
    z.object({
      name: z.string().min(2),
      category: z.enum(['FOOD_DRINK', 'HEALTH', 'SPORTS', 'VETERINARY']),
      description: z.string().optional(),
      address: z.string().min(5),
      lat: z.number(),
      lng: z.number(),
      phone: z.string().min(10),
      email: z.string().email(),
    })
  ),
  async (c) => {
    const { userId } = c.get('user')
    const body = c.req.valid('json')

    let slug = slugify(body.name)
    const existing = await prisma.business.findUnique({ where: { slug } })
    if (existing) {
      slug = `${slug}-${Date.now()}`
    }

    const business = await prisma.business.create({
      data: { ...body, slug, ownerId: userId },
    })

    // Varsayılan çalışma saatlerini oluştur (Pzt-Cuma 09:00-18:00)
    await prisma.businessHour.createMany({
      data: Array.from({ length: 7 }, (_, i) => ({
        businessId: business.id,
        dayOfWeek: i,
        openTime: '09:00',
        closeTime: '18:00',
        isClosed: i === 5 || i === 6, // Cumartesi-Pazar kapalı
      })),
    })

    return c.json({ data: business }, 201)
  }
)

// ─── İşletme Güncelle ─────────────────────────────────────────────────────────
businessRoutes.patch(
  '/:id',
  businessOwnerMiddleware,
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
      coverImage: z.string().optional(),
      logoUrl: z.string().optional(),
      requiresDeposit: z.boolean().optional(),
      depositType: z.enum(['FIXED', 'PERCENTAGE']).optional(),
      depositAmount: z.number().positive().optional(),
      depositPercent: z.number().min(1).max(100).optional(),
      fullRefundBefore: z.number().int().positive().optional(),
      halfRefundBefore: z.number().int().positive().optional(),
    })
  ),
  async (c) => {
    const { userId } = c.get('user')
    const id = c.req.param('id')
    const body = c.req.valid('json')

    const business = await prisma.business.findFirst({ where: { id, ownerId: userId } })
    if (!business) {
      return c.json({ error: 'İşletme bulunamadı veya yetkiniz yok' }, 404)
    }

    const updated = await prisma.business.update({ where: { id }, data: body })

    return c.json({ data: updated })
  }
)

// ─── Çalışma Saatleri Güncelle ────────────────────────────────────────────────
businessRoutes.put(
  '/:id/hours',
  businessOwnerMiddleware,
  zValidator(
    'json',
    z.object({
      hours: z.array(
        z.object({
          dayOfWeek: z.number().int().min(0).max(6),
          openTime: z.string().regex(/^\d{2}:\d{2}$/),
          closeTime: z.string().regex(/^\d{2}:\d{2}$/),
          isClosed: z.boolean(),
        })
      ),
    })
  ),
  async (c) => {
    const { userId } = c.get('user')
    const id = c.req.param('id')
    const { hours } = c.req.valid('json')

    const business = await prisma.business.findFirst({ where: { id, ownerId: userId } })
    if (!business) {
      return c.json({ error: 'İşletme bulunamadı veya yetkiniz yok' }, 404)
    }

    await prisma.$transaction(
      hours.map((h) =>
        prisma.businessHour.upsert({
          where: { businessId_dayOfWeek: { businessId: id, dayOfWeek: h.dayOfWeek } },
          create: { businessId: id, ...h },
          update: h,
        })
      )
    )

    const updated = await prisma.businessHour.findMany({
      where: { businessId: id },
      orderBy: { dayOfWeek: 'asc' },
    })

    return c.json({ data: updated })
  }
)

// ─── Kendi İşletmelerini Listele ──────────────────────────────────────────────
businessRoutes.get('/my/list', businessOwnerMiddleware, async (c) => {
  const { userId } = c.get('user')

  const businesses = await prisma.business.findMany({
    where: { ownerId: userId },
    include: {
      subscription: { include: { plan: true } },
      _count: { select: { reservations: true } },
    },
  })

  return c.json({ data: businesses })
})
