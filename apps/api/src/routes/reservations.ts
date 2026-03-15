import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '@rezerv/db'
import { authMiddleware, businessOwnerMiddleware } from '../middleware/auth'
import { getRefundPolicy } from '@rezerv/utils'

export const reservationRoutes = new Hono()

// ─── Rezervasyon Oluştur ──────────────────────────────────────────────────────
reservationRoutes.post(
  '/',
  authMiddleware,
  zValidator(
    'json',
    z.object({
      businessId: z.string(),
      slotId: z.string(),
      notes: z.string().optional(),
      petId: z.string().optional(),
    })
  ),
  async (c) => {
    const { userId } = c.get('user')
    const body = c.req.valid('json')

    // Slot ve işletmeyi kontrol et
    const slot = await prisma.timeSlot.findFirst({
      where: { id: body.slotId, businessId: body.businessId, isBlocked: false },
    })

    if (!slot) {
      return c.json({ error: 'Slot bulunamadı' }, 404)
    }

    if (slot.booked >= slot.capacity) {
      return c.json({ error: 'Bu slot dolu' }, 409)
    }

    // Aynı slota aynı kullanıcının tekrar rezervasyon yapmasını engelle
    const duplicate = await prisma.reservation.findFirst({
      where: {
        userId,
        slotId: body.slotId,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    })

    if (duplicate) {
      return c.json({ error: 'Bu slot için zaten rezervasyonunuz var' }, 409)
    }

    const business = await prisma.business.findUnique({ where: { id: body.businessId } })
    if (!business) {
      return c.json({ error: 'İşletme bulunamadı' }, 404)
    }

    // Veteriner kontrolü
    if (business.category === 'VETERINARY' && body.petId) {
      const pet = await prisma.pet.findFirst({ where: { id: body.petId, userId } })
      if (!pet) {
        return c.json({ error: 'Evcil hayvan bulunamadı' }, 404)
      }
    }

    const reservation = await prisma.$transaction(async (tx) => {
      const res = await tx.reservation.create({
        data: {
          userId,
          businessId: body.businessId,
          slotId: body.slotId,
          notes: body.notes,
          petId: body.petId ?? null,
          status: business.requiresDeposit ? 'PENDING' : 'CONFIRMED',
        },
        include: {
          business: { select: { name: true, address: true, requiresDeposit: true, depositType: true, depositAmount: true, depositPercent: true } },
          slot: true,
          pet: true,
        },
      })

      // Slot doluluk sayısını artır
      await tx.timeSlot.update({
        where: { id: body.slotId },
        data: { booked: { increment: 1 } },
      })

      return res
    })

    return c.json({ data: reservation }, 201)
  }
)

// ─── Kendi Rezervasyonlarım ───────────────────────────────────────────────────
reservationRoutes.get('/my', authMiddleware, async (c) => {
  const { userId } = c.get('user')

  const reservations = await prisma.reservation.findMany({
    where: { userId },
    include: {
      business: { select: { name: true, address: true, logoUrl: true, lat: true, lng: true } },
      slot: true,
      payment: true,
      pet: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return c.json({ data: reservations })
})

// ─── İşletmenin Rezervasyonları ───────────────────────────────────────────────
reservationRoutes.get(
  '/business/:businessId',
  businessOwnerMiddleware,
  zValidator(
    'query',
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'NO_SHOW', 'COMPLETED']).optional(),
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(50),
    })
  ),
  async (c) => {
    const { userId } = c.get('user')
    const businessId = c.req.param('businessId')
    const { date, status, page, limit } = c.req.valid('query')

    const business = await prisma.business.findFirst({ where: { id: businessId, ownerId: userId } })
    if (!business) {
      return c.json({ error: 'İşletme bulunamadı veya yetkiniz yok' }, 404)
    }

    const where = {
      businessId,
      ...(status && { status }),
      ...(date && { slot: { date: new Date(date) } }),
    }

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { name: true, phone: true, email: true } },
          slot: true,
          payment: true,
          pet: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.reservation.count({ where }),
    ])

    return c.json({ data: reservations, total, page, limit, hasMore: (page - 1) * limit + reservations.length < total })
  }
)

// ─── Rezervasyon İptal ────────────────────────────────────────────────────────
reservationRoutes.patch('/:id/cancel', authMiddleware, async (c) => {
  const { userId, role } = c.get('user')
  const id = c.req.param('id')

  const reservation = await prisma.reservation.findFirst({
    where: { id },
    include: { slot: true, business: true, payment: true },
  })

  if (!reservation) {
    return c.json({ error: 'Rezervasyon bulunamadı' }, 404)
  }

  // Sadece rezervasyonu yapan kişi veya işletme sahibi iptal edebilir
  const isOwner = reservation.userId === userId
  const isBusinessOwner = role === 'BUSINESS_OWNER' && reservation.business.ownerId === userId

  if (!isOwner && !isBusinessOwner) {
    return c.json({ error: 'Bu işlem için yetkiniz yok' }, 403)
  }

  if (['CANCELLED', 'COMPLETED'].includes(reservation.status)) {
    return c.json({ error: 'Bu rezervasyon zaten iptal edilmiş veya tamamlanmış' }, 400)
  }

  // İade politikasını hesapla
  const slotDateTime = new Date(`${reservation.slot.date.toISOString().split('T')[0]}T${reservation.slot.startTime}`)
  const refundPolicy = reservation.payment
    ? getRefundPolicy(slotDateTime, reservation.business.fullRefundBefore, reservation.business.halfRefundBefore)
    : null

  await prisma.$transaction(async (tx) => {
    await tx.reservation.update({ where: { id }, data: { status: 'CANCELLED' } })
    await tx.timeSlot.update({ where: { id: reservation.slotId }, data: { booked: { decrement: 1 } } })

    // Ödeme iade işlemi (gerçek iyzico entegrasyonu burada yapılacak)
    if (reservation.payment && refundPolicy !== 'NONE') {
      await tx.payment.update({
        where: { id: reservation.payment.id },
        data: { status: 'REFUNDED', refundedAt: new Date() },
      })
    }
  })

  return c.json({ data: { message: 'Rezervasyon iptal edildi', refundPolicy } })
})

// ─── Rezervasyon Durumu Güncelle (işletme) ────────────────────────────────────
reservationRoutes.patch(
  '/:id/status',
  businessOwnerMiddleware,
  zValidator('json', z.object({ status: z.enum(['CONFIRMED', 'NO_SHOW', 'COMPLETED']) })),
  async (c) => {
    const { userId } = c.get('user')
    const id = c.req.param('id')
    const { status } = c.req.valid('json')

    const reservation = await prisma.reservation.findFirst({
      where: { id },
      include: { business: true },
    })

    if (!reservation || reservation.business.ownerId !== userId) {
      return c.json({ error: 'Rezervasyon bulunamadı veya yetkiniz yok' }, 404)
    }

    const updated = await prisma.reservation.update({ where: { id }, data: { status } })

    return c.json({ data: updated })
  }
)
