import { Hono } from 'hono'
import { createMiddleware } from 'hono/factory'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '@rezerv/db'
import { verifyToken } from '../lib/jwt'

// ─── Types ────────────────────────────────────────────────────────────────────

type DashboardEnv = {
  Variables: {
    userId: string
    businessId: string
    staffRole: 'OWNER' | 'MANAGER' | 'STAFF'
  }
}

// ─── Dashboard Middleware ─────────────────────────────────────────────────────

const dashboardMiddleware = createMiddleware<DashboardEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Yetkilendirme gerekli' }, 401)
  }

  const token = authHeader.slice(7)

  let payload: { userId: string; role: string }
  try {
    payload = verifyToken(token)
  } catch {
    return c.json({ error: 'Geçersiz veya süresi dolmuş token' }, 401)
  }

  // /me endpoint doesn't need businessId
  const path = c.req.path
  if (path.endsWith('/me')) {
    c.set('userId', payload.userId)
    c.set('businessId', '')
    c.set('staffRole', 'STAFF')
    await next()
    return
  }

  // Get businessId from header or query param
  const businessId =
    c.req.header('X-Business-Id') ?? c.req.query('businessId')

  if (!businessId) {
    return c.json({ error: 'X-Business-Id header veya businessId query param gerekli' }, 400)
  }

  // Check if user is owner or staff for this business
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { ownerId: true },
  })

  if (!business) {
    return c.json({ error: 'İşletme bulunamadı' }, 404)
  }

  let staffRole: 'OWNER' | 'MANAGER' | 'STAFF'

  if (business.ownerId === payload.userId) {
    staffRole = 'OWNER'
  } else {
    const staffEntry = await prisma.businessStaff.findUnique({
      where: {
        businessId_userId: {
          businessId,
          userId: payload.userId,
        },
      },
    })

    if (!staffEntry) {
      return c.json({ error: 'Bu işletmeye erişim yetkiniz yok' }, 403)
    }

    staffRole = staffEntry.role as 'OWNER' | 'MANAGER' | 'STAFF'
  }

  c.set('userId', payload.userId)
  c.set('businessId', businessId)
  c.set('staffRole', staffRole)

  await next()
})

// ─── Role Helpers ─────────────────────────────────────────────────────────────

function isAtLeastManager(role: string) {
  return role === 'OWNER' || role === 'MANAGER'
}

function isOwner(role: string) {
  return role === 'OWNER'
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const dashboardRoutes = new Hono<DashboardEnv>()

dashboardRoutes.use('*', dashboardMiddleware)

// ─── /me ─────────────────────────────────────────────────────────────────────

dashboardRoutes.get('/me', async (c) => {
  const userId = c.get('userId')

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true, avatarUrl: true, role: true },
  })

  if (!user) return c.json({ error: 'Kullanıcı bulunamadı' }, 404)

  // Businesses as owner
  const ownedBusinesses = await prisma.business.findMany({
    where: { ownerId: userId },
    select: { id: true, name: true, category: true, isActive: true },
  })

  // Businesses as staff
  const staffEntries = await prisma.businessStaff.findMany({
    where: { userId },
    include: {
      business: { select: { id: true, name: true, category: true, isActive: true } },
    },
  })

  const businesses = [
    ...ownedBusinesses.map((b: { id: string; name: string; category: string; isActive: boolean }) => ({
      ...b,
      role: 'OWNER' as const,
    })),
    ...staffEntries.map(
      (s: { role: string; business: { id: string; name: string; category: string; isActive: boolean } }) => ({
        ...s.business,
        role: s.role,
      })
    ),
  ]

  return c.json({ data: { user, businesses } })
})

// ─── Profile ──────────────────────────────────────────────────────────────────

dashboardRoutes.get('/profile', async (c) => {
  const businessId = c.get('businessId')

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      hours: true,
      staff: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      subscription: { include: { plan: true } },
    },
  })

  if (!business) return c.json({ error: 'İşletme bulunamadı' }, 404)

  return c.json({ data: business })
})

dashboardRoutes.patch(
  '/profile',
  zValidator(
    'json',
    z.object({
      description: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      logoUrl: z.string().url().optional().nullable(),
      coverImage: z.string().url().optional().nullable(),
      images: z.array(z.string().url()).optional(),
      socialLinks: z
        .object({
          instagram: z.string().optional(),
          twitter: z.string().optional(),
          website: z.string().optional(),
          whatsapp: z.string().optional(),
        })
        .optional(),
    })
  ),
  async (c) => {
    const businessId = c.get('businessId')
    const staffRole = c.get('staffRole')
    const body = c.req.valid('json')

    if (!isAtLeastManager(staffRole)) {
      return c.json({ error: 'Bu işlem için yönetici yetkisi gerekli' }, 403)
    }

    const updated = await prisma.business.update({
      where: { id: businessId },
      data: body,
    })

    return c.json({ data: updated })
  }
)

dashboardRoutes.post(
  '/profile/change-request',
  zValidator(
    'json',
    z.object({
      field: z.enum(['name', 'category', 'address', 'lat', 'lng']),
      newValue: z.string(),
    })
  ),
  async (c) => {
    const businessId = c.get('businessId')
    const userId = c.get('userId')
    const staffRole = c.get('staffRole')
    const body = c.req.valid('json')

    if (!isAtLeastManager(staffRole)) {
      return c.json({ error: 'Bu işlem için yönetici yetkisi gerekli' }, 403)
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true, category: true, address: true, lat: true, lng: true },
    })

    if (!business) return c.json({ error: 'İşletme bulunamadı' }, 404)

    const oldValue = String(business[body.field as keyof typeof business] ?? '')

    const changeRequest = await prisma.changeRequest.create({
      data: {
        businessId,
        requestedBy: userId,
        field: body.field,
        oldValue,
        newValue: body.newValue,
      },
    })

    return c.json({ data: changeRequest }, 201)
  }
)

dashboardRoutes.get('/profile/change-requests', async (c) => {
  const businessId = c.get('businessId')

  const changeRequests = await prisma.changeRequest.findMany({
    where: { businessId },
    include: {
      requester: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return c.json({ data: changeRequests })
})

// ─── Hours ────────────────────────────────────────────────────────────────────

dashboardRoutes.put(
  '/hours',
  zValidator(
    'json',
    z.object({
      hours: z.array(
        z.object({
          dayOfWeek: z.number().int().min(0).max(6),
          openTime: z.string().regex(/^\d{2}:\d{2}$/),
          closeTime: z.string().regex(/^\d{2}:\d{2}$/),
          isClosed: z.boolean().default(false),
        })
      ),
    })
  ),
  async (c) => {
    const businessId = c.get('businessId')
    const staffRole = c.get('staffRole')
    const { hours } = c.req.valid('json')

    if (!isAtLeastManager(staffRole)) {
      return c.json({ error: 'Bu işlem için yönetici yetkisi gerekli' }, 403)
    }

    // Delete all existing hours and recreate
    await prisma.businessHour.deleteMany({ where: { businessId } })

    const created = await prisma.businessHour.createMany({
      data: hours.map((h) => ({ ...h, businessId })),
    })

    const result = await prisma.businessHour.findMany({
      where: { businessId },
      orderBy: { dayOfWeek: 'asc' },
    })

    return c.json({ data: result })
  }
)

// ─── Services ─────────────────────────────────────────────────────────────────

dashboardRoutes.get('/services', async (c) => {
  const businessId = c.get('businessId')

  const services = await prisma.service.findMany({
    where: { businessId, isActive: true },
    include: { category: true },
    orderBy: [{ category: { order: 'asc' } }, { order: 'asc' }],
  })

  // Group by category
  const grouped: Record<string, typeof services> = {}
  for (const s of services) {
    const key = s.categoryId ?? '__uncategorized__'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(s)
  }

  return c.json({ data: { services, grouped } })
})

dashboardRoutes.post(
  '/services',
  zValidator(
    'json',
    z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      price: z.number().positive(),
      duration: z.number().int().positive().optional(),
      imageUrl: z.string().url().optional(),
      categoryId: z.string().optional(),
      order: z.number().int().default(0),
    })
  ),
  async (c) => {
    const businessId = c.get('businessId')
    const staffRole = c.get('staffRole')
    const body = c.req.valid('json')

    if (!isAtLeastManager(staffRole)) {
      return c.json({ error: 'Bu işlem için yönetici yetkisi gerekli' }, 403)
    }

    const service = await prisma.service.create({
      data: { ...body, businessId },
      include: { category: true },
    })

    return c.json({ data: service }, 201)
  }
)

dashboardRoutes.patch(
  '/services/:id',
  zValidator(
    'json',
    z.object({
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      price: z.number().positive().optional(),
      duration: z.number().int().positive().optional(),
      imageUrl: z.string().url().optional().nullable(),
      categoryId: z.string().optional().nullable(),
      order: z.number().int().optional(),
    })
  ),
  async (c) => {
    const businessId = c.get('businessId')
    const staffRole = c.get('staffRole')
    const id = c.req.param('id')
    const body = c.req.valid('json')

    if (!isAtLeastManager(staffRole)) {
      return c.json({ error: 'Bu işlem için yönetici yetkisi gerekli' }, 403)
    }

    const existing = await prisma.service.findFirst({ where: { id, businessId } })
    if (!existing) return c.json({ error: 'Hizmet bulunamadı' }, 404)

    const updated = await prisma.service.update({
      where: { id },
      data: body,
      include: { category: true },
    })

    return c.json({ data: updated })
  }
)

dashboardRoutes.delete('/services/:id', async (c) => {
  const businessId = c.get('businessId')
  const staffRole = c.get('staffRole')
  const id = c.req.param('id')

  if (!isAtLeastManager(staffRole)) {
    return c.json({ error: 'Bu işlem için yönetici yetkisi gerekli' }, 403)
  }

  const existing = await prisma.service.findFirst({ where: { id, businessId } })
  if (!existing) return c.json({ error: 'Hizmet bulunamadı' }, 404)

  // Soft delete
  await prisma.service.update({ where: { id }, data: { isActive: false } })

  return c.json({ data: { message: 'Hizmet devre dışı bırakıldı' } })
})

// ─── Service Categories ───────────────────────────────────────────────────────

dashboardRoutes.get('/service-categories', async (c) => {
  const businessId = c.get('businessId')

  const categories = await prisma.serviceCategory.findMany({
    where: { businessId, isActive: true },
    include: { _count: { select: { services: true } } },
    orderBy: { order: 'asc' },
  })

  return c.json({ data: categories })
})

dashboardRoutes.post(
  '/service-categories',
  zValidator(
    'json',
    z.object({
      name: z.string().min(1),
      order: z.number().int().default(0),
    })
  ),
  async (c) => {
    const businessId = c.get('businessId')
    const staffRole = c.get('staffRole')
    const body = c.req.valid('json')

    if (!isAtLeastManager(staffRole)) {
      return c.json({ error: 'Bu işlem için yönetici yetkisi gerekli' }, 403)
    }

    const category = await prisma.serviceCategory.create({
      data: { ...body, businessId },
    })

    return c.json({ data: category }, 201)
  }
)

dashboardRoutes.patch(
  '/service-categories/:id',
  zValidator(
    'json',
    z.object({
      name: z.string().min(1).optional(),
      order: z.number().int().optional(),
    })
  ),
  async (c) => {
    const businessId = c.get('businessId')
    const staffRole = c.get('staffRole')
    const id = c.req.param('id')
    const body = c.req.valid('json')

    if (!isAtLeastManager(staffRole)) {
      return c.json({ error: 'Bu işlem için yönetici yetkisi gerekli' }, 403)
    }

    const existing = await prisma.serviceCategory.findFirst({ where: { id, businessId } })
    if (!existing) return c.json({ error: 'Kategori bulunamadı' }, 404)

    const updated = await prisma.serviceCategory.update({ where: { id }, data: body })

    return c.json({ data: updated })
  }
)

dashboardRoutes.delete('/service-categories/:id', async (c) => {
  const businessId = c.get('businessId')
  const staffRole = c.get('staffRole')
  const id = c.req.param('id')

  if (!isAtLeastManager(staffRole)) {
    return c.json({ error: 'Bu işlem için yönetici yetkisi gerekli' }, 403)
  }

  const existing = await prisma.serviceCategory.findFirst({ where: { id, businessId } })
  if (!existing) return c.json({ error: 'Kategori bulunamadı' }, 404)

  const serviceCount = await prisma.service.count({
    where: { categoryId: id, isActive: true },
  })

  if (serviceCount > 0) {
    return c.json({ error: 'Bu kategoride aktif hizmetler var, önce hizmetleri kaldırın' }, 400)
  }

  await prisma.serviceCategory.delete({ where: { id } })

  return c.json({ data: { message: 'Kategori silindi' } })
})

// ─── Reservations ─────────────────────────────────────────────────────────────

dashboardRoutes.get('/reservations', async (c) => {
  const businessId = c.get('businessId')
  const status = c.req.query('status')
  const date = c.req.query('date')
  const page = Number(c.req.query('page') ?? '1')
  const limit = Number(c.req.query('limit') ?? '20')

  const where: Record<string, unknown> = { businessId }

  if (status) {
    where.status = status
  }

  if (date) {
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)
    where.slot = { date: { gte: dayStart, lte: dayEnd } }
  }

  const [reservations, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        slot: { select: { id: true, startTime: true, endTime: true, date: true } },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.reservation.count({ where }),
  ])

  return c.json({
    data: reservations,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  })
})

dashboardRoutes.get('/reservations/today', async (c) => {
  const businessId = c.get('businessId')

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const reservations = await prisma.reservation.findMany({
    where: {
      businessId,
      slot: { date: { gte: todayStart, lte: todayEnd } },
    },
    include: {
      user: { select: { id: true, name: true, phone: true, email: true } },
      slot: { select: { id: true, startTime: true, endTime: true, date: true } },
      payment: true,
    },
    orderBy: { slot: { startTime: 'asc' } },
  })

  return c.json({ data: reservations })
})

dashboardRoutes.patch(
  '/reservations/:id/status',
  zValidator(
    'json',
    z.object({
      status: z.enum(['CONFIRMED', 'CANCELLED', 'NO_SHOW', 'COMPLETED']),
      note: z.string().optional(),
    })
  ),
  async (c) => {
    const businessId = c.get('businessId')
    const id = c.req.param('id')
    const body = c.req.valid('json')

    const existing = await prisma.reservation.findFirst({
      where: { id, businessId },
    })

    if (!existing) return c.json({ error: 'Rezervasyon bulunamadı' }, 404)

    const updated = await prisma.reservation.update({
      where: { id },
      data: {
        status: body.status,
        notes: body.note ?? existing.notes,
      },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        slot: { select: { id: true, startTime: true, endTime: true, date: true } },
      },
    })

    return c.json({ data: updated })
  }
)

// ─── Slots ────────────────────────────────────────────────────────────────────

dashboardRoutes.get('/slots', async (c) => {
  const businessId = c.get('businessId')
  const date = c.req.query('date')

  const where: Record<string, unknown> = { businessId }

  if (date) {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    const dEnd = new Date(date)
    dEnd.setHours(23, 59, 59, 999)
    where.date = { gte: d, lte: dEnd }
  }

  const slots = await prisma.timeSlot.findMany({
    where,
    include: { _count: { select: { reservations: true } } },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  })

  return c.json({ data: slots })
})

dashboardRoutes.post(
  '/slots/bulk',
  zValidator(
    'json',
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      startHour: z.number().int().min(0).max(23),
      endHour: z.number().int().min(1).max(24),
      durationMinutes: z.number().int().min(5),
      capacity: z.number().int().min(1).default(1),
    })
  ),
  async (c) => {
    const businessId = c.get('businessId')
    const staffRole = c.get('staffRole')
    const body = c.req.valid('json')

    if (!isAtLeastManager(staffRole)) {
      return c.json({ error: 'Bu işlem için yönetici yetkisi gerekli' }, 403)
    }

    const { date, startHour, endHour, durationMinutes, capacity } = body

    const slots: { businessId: string; date: Date; startTime: string; endTime: string; capacity: number }[] = []
    const slotDate = new Date(date)
    slotDate.setHours(0, 0, 0, 0)

    let currentMinutes = startHour * 60
    const endMinutes = endHour * 60

    while (currentMinutes + durationMinutes <= endMinutes) {
      const startH = Math.floor(currentMinutes / 60)
      const startM = currentMinutes % 60
      const endMin = currentMinutes + durationMinutes
      const endH = Math.floor(endMin / 60)
      const endMm = endMin % 60

      const startTime = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`
      const endTime = `${String(endH).padStart(2, '0')}:${String(endMm).padStart(2, '0')}`

      slots.push({ businessId, date: slotDate, startTime, endTime, capacity })
      currentMinutes += durationMinutes
    }

    // Delete existing slots for this date that haven't been booked
    await prisma.timeSlot.deleteMany({
      where: {
        businessId,
        date: { gte: slotDate, lte: new Date(slotDate.getTime() + 86400000 - 1) },
        booked: 0,
      },
    })

    await prisma.timeSlot.createMany({ data: slots, skipDuplicates: true })

    const created = await prisma.timeSlot.findMany({
      where: {
        businessId,
        date: { gte: slotDate, lte: new Date(slotDate.getTime() + 86400000 - 1) },
      },
      orderBy: { startTime: 'asc' },
    })

    return c.json({ data: created }, 201)
  }
)

dashboardRoutes.patch('/slots/:id/toggle', async (c) => {
  const businessId = c.get('businessId')
  const staffRole = c.get('staffRole')
  const id = c.req.param('id')

  if (!isAtLeastManager(staffRole)) {
    return c.json({ error: 'Bu işlem için yönetici yetkisi gerekli' }, 403)
  }

  const existing = await prisma.timeSlot.findFirst({ where: { id, businessId } })
  if (!existing) return c.json({ error: 'Slot bulunamadı' }, 404)

  const updated = await prisma.timeSlot.update({
    where: { id },
    data: { isBlocked: !existing.isBlocked },
  })

  return c.json({ data: updated })
})

// ─── Campaigns ────────────────────────────────────────────────────────────────

dashboardRoutes.get('/campaigns', async (c) => {
  const businessId = c.get('businessId')

  const campaigns = await prisma.campaign.findMany({
    where: { businessId },
    orderBy: { startDate: 'desc' },
  })

  return c.json({ data: campaigns })
})

dashboardRoutes.post(
  '/campaigns',
  zValidator(
    'json',
    z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      bannerUrl: z.string().url().optional(),
      discountType: z.enum(['FIXED', 'PERCENTAGE']).optional(),
      discountAmount: z.number().positive().optional(),
      startDate: z.string().datetime(),
      endDate: z.string().datetime(),
    })
  ),
  async (c) => {
    const businessId = c.get('businessId')
    const staffRole = c.get('staffRole')
    const body = c.req.valid('json')

    if (!isAtLeastManager(staffRole)) {
      return c.json({ error: 'Bu işlem için yönetici yetkisi gerekli' }, 403)
    }

    const campaign = await prisma.campaign.create({
      data: {
        ...body,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        businessId,
      },
    })

    return c.json({ data: campaign }, 201)
  }
)

dashboardRoutes.patch(
  '/campaigns/:id',
  zValidator(
    'json',
    z.object({
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      bannerUrl: z.string().url().optional().nullable(),
      discountType: z.enum(['FIXED', 'PERCENTAGE']).optional(),
      discountAmount: z.number().positive().optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      isActive: z.boolean().optional(),
    })
  ),
  async (c) => {
    const businessId = c.get('businessId')
    const staffRole = c.get('staffRole')
    const id = c.req.param('id')
    const body = c.req.valid('json')

    if (!isAtLeastManager(staffRole)) {
      return c.json({ error: 'Bu işlem için yönetici yetkisi gerekli' }, 403)
    }

    const existing = await prisma.campaign.findFirst({ where: { id, businessId } })
    if (!existing) return c.json({ error: 'Kampanya bulunamadı' }, 404)

    const data: Record<string, unknown> = { ...body }
    if (body.startDate) data.startDate = new Date(body.startDate)
    if (body.endDate) data.endDate = new Date(body.endDate)

    const updated = await prisma.campaign.update({ where: { id }, data })

    return c.json({ data: updated })
  }
)

dashboardRoutes.delete('/campaigns/:id', async (c) => {
  const businessId = c.get('businessId')
  const staffRole = c.get('staffRole')
  const id = c.req.param('id')

  if (!isAtLeastManager(staffRole)) {
    return c.json({ error: 'Bu işlem için yönetici yetkisi gerekli' }, 403)
  }

  const existing = await prisma.campaign.findFirst({ where: { id, businessId } })
  if (!existing) return c.json({ error: 'Kampanya bulunamadı' }, 404)

  await prisma.campaign.delete({ where: { id } })

  return c.json({ data: { message: 'Kampanya silindi' } })
})

// ─── Staff ────────────────────────────────────────────────────────────────────

dashboardRoutes.get('/staff', async (c) => {
  const businessId = c.get('businessId')

  const staff = await prisma.businessStaff.findMany({
    where: { businessId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
    },
    orderBy: { invitedAt: 'asc' },
  })

  return c.json({ data: staff })
})

dashboardRoutes.post(
  '/staff/invite',
  zValidator(
    'json',
    z.object({
      email: z.string().email(),
      role: z.enum(['MANAGER', 'STAFF']),
    })
  ),
  async (c) => {
    const businessId = c.get('businessId')
    const staffRole = c.get('staffRole')
    const body = c.req.valid('json')

    if (!isOwner(staffRole) && staffRole !== 'MANAGER') {
      return c.json({ error: 'Bu işlem için yönetici yetkisi gerekli' }, 403)
    }

    // MANAGER can only invite STAFF, not other MANAGERs
    if (staffRole === 'MANAGER' && body.role === 'MANAGER') {
      return c.json({ error: 'Yöneticiler sadece personel davet edebilir' }, 403)
    }

    const user = await prisma.user.findUnique({ where: { email: body.email } })
    if (!user) return c.json({ error: 'Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı' }, 404)

    const existing = await prisma.businessStaff.findUnique({
      where: { businessId_userId: { businessId, userId: user.id } },
    })

    if (existing) {
      return c.json({ error: 'Bu kullanıcı zaten personel listesinde' }, 409)
    }

    const staffEntry = await prisma.businessStaff.create({
      data: {
        businessId,
        userId: user.id,
        role: body.role,
        acceptedAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    return c.json({ data: staffEntry }, 201)
  }
)

dashboardRoutes.patch(
  '/staff/:id/role',
  zValidator(
    'json',
    z.object({
      role: z.enum(['MANAGER', 'STAFF']),
    })
  ),
  async (c) => {
    const businessId = c.get('businessId')
    const staffRole = c.get('staffRole')
    const id = c.req.param('id')
    const body = c.req.valid('json')

    if (!isOwner(staffRole)) {
      return c.json({ error: 'Personel rolü değiştirmek için işletme sahibi yetkisi gerekli' }, 403)
    }

    const existing = await prisma.businessStaff.findFirst({
      where: { id, businessId },
    })

    if (!existing) return c.json({ error: 'Personel bulunamadı' }, 404)

    if (existing.role === 'OWNER') {
      return c.json({ error: 'İşletme sahibinin rolü değiştirilemez' }, 400)
    }

    const updated = await prisma.businessStaff.update({
      where: { id },
      data: { role: body.role },
      include: { user: { select: { id: true, name: true, email: true } } },
    })

    return c.json({ data: updated })
  }
)

dashboardRoutes.delete('/staff/:id', async (c) => {
  const businessId = c.get('businessId')
  const staffRole = c.get('staffRole')
  const id = c.req.param('id')

  if (!isOwner(staffRole) && staffRole !== 'MANAGER') {
    return c.json({ error: 'Bu işlem için yönetici yetkisi gerekli' }, 403)
  }

  const existing = await prisma.businessStaff.findFirst({
    where: { id, businessId },
  })

  if (!existing) return c.json({ error: 'Personel bulunamadı' }, 404)

  if (existing.role === 'OWNER') {
    return c.json({ error: 'İşletme sahibi personel listesinden çıkarılamaz' }, 400)
  }

  // MANAGER can only remove STAFF
  if (staffRole === 'MANAGER' && existing.role === 'MANAGER') {
    return c.json({ error: 'Yöneticiler başka yöneticileri çıkaramaz' }, 403)
  }

  await prisma.businessStaff.delete({ where: { id } })

  return c.json({ data: { message: 'Personel çıkarıldı' } })
})

// ─── Reports ──────────────────────────────────────────────────────────────────

dashboardRoutes.get('/reports/overview', async (c) => {
  const businessId = c.get('businessId')

  const [totalReservations, confirmedReservations, cancelledReservations, completedReservations] =
    await Promise.all([
      prisma.reservation.count({ where: { businessId } }),
      prisma.reservation.count({ where: { businessId, status: 'CONFIRMED' } }),
      prisma.reservation.count({ where: { businessId, status: 'CANCELLED' } }),
      prisma.reservation.count({ where: { businessId, status: 'COMPLETED' } }),
    ])

  // Sum revenue from confirmed/completed payments
  const revenueResult = await prisma.payment.aggregate({
    where: {
      reservation: { businessId },
      status: { in: ['PAID', 'CAPTURED'] },
    },
    _sum: { amount: true },
  })

  return c.json({
    data: {
      totalReservations,
      confirmedReservations,
      cancelledReservations,
      completedReservations,
      revenue: revenueResult._sum.amount ?? 0,
    },
  })
})

dashboardRoutes.get('/reports/daily', async (c) => {
  const businessId = c.get('businessId')
  const from = c.req.query('from')
  const to = c.req.query('to')

  if (!from || !to) {
    return c.json({ error: 'from ve to parametreleri gerekli (YYYY-MM-DD)' }, 400)
  }

  const fromDate = new Date(from)
  fromDate.setHours(0, 0, 0, 0)
  const toDate = new Date(to)
  toDate.setHours(23, 59, 59, 999)

  const reservations = await prisma.reservation.findMany({
    where: {
      businessId,
      createdAt: { gte: fromDate, lte: toDate },
    },
    select: { createdAt: true, status: true },
  })

  // Group by date
  const dayMap: Record<string, { date: string; reservations: number; confirmed: number; cancelled: number }> = {}

  for (const r of reservations) {
    const dateKey = r.createdAt.toISOString().slice(0, 10)
    if (!dayMap[dateKey]) {
      dayMap[dateKey] = { date: dateKey, reservations: 0, confirmed: 0, cancelled: 0 }
    }
    dayMap[dateKey].reservations++
    if (r.status === 'CONFIRMED') dayMap[dateKey].confirmed++
    if (r.status === 'CANCELLED') dayMap[dateKey].cancelled++
  }

  const result = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date))

  return c.json({ data: result })
})

dashboardRoutes.get('/reports/top-services', async (c) => {
  const businessId = c.get('businessId')

  // Placeholder: return services sorted by order
  const services = await prisma.service.findMany({
    where: { businessId, isActive: true },
    include: { category: { select: { id: true, name: true } } },
    orderBy: { order: 'asc' },
  })

  return c.json({ data: services })
})
