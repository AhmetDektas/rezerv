import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '@rezerv/db'
import { businessOwnerMiddleware } from '../middleware/auth'

export const slotRoutes = new Hono()

// ─── İşletmenin Slotlarını Getir (tarihe göre) ───────────────────────────────
slotRoutes.get(
  '/business/:businessId',
  zValidator(
    'query',
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD formatı gerekli'),
    })
  ),
  async (c) => {
    const businessId = c.req.param('businessId')
    const { date } = c.req.valid('query')

    const slots = await prisma.timeSlot.findMany({
      where: {
        businessId,
        date: new Date(date),
        isBlocked: false,
      },
      orderBy: { startTime: 'asc' },
    })

    const slotsWithAvailability = slots.map((slot) => ({
      ...slot,
      available: slot.capacity - slot.booked,
      isFull: slot.booked >= slot.capacity,
    }))

    return c.json({ data: slotsWithAvailability })
  }
)

// ─── Slot Oluştur (işletme sahibi) ───────────────────────────────────────────
slotRoutes.post(
  '/',
  businessOwnerMiddleware,
  zValidator(
    'json',
    z.object({
      businessId: z.string(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      startTime: z.string().regex(/^\d{2}:\d{2}$/),
      endTime: z.string().regex(/^\d{2}:\d{2}$/),
      capacity: z.number().int().positive().default(1),
    })
  ),
  async (c) => {
    const { userId } = c.get('user')
    const body = c.req.valid('json')

    const business = await prisma.business.findFirst({
      where: { id: body.businessId, ownerId: userId },
    })

    if (!business) {
      return c.json({ error: 'İşletme bulunamadı veya yetkiniz yok' }, 404)
    }

    const slot = await prisma.timeSlot.create({
      data: { ...body, date: new Date(body.date) },
    })

    return c.json({ data: slot }, 201)
  }
)

// ─── Toplu Slot Oluştur ───────────────────────────────────────────────────────
slotRoutes.post(
  '/bulk',
  businessOwnerMiddleware,
  zValidator(
    'json',
    z.object({
      businessId: z.string(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      startHour: z.string().regex(/^\d{2}:\d{2}$/),
      endHour: z.string().regex(/^\d{2}:\d{2}$/),
      durationMinutes: z.number().int().positive().default(30),
      capacity: z.number().int().positive().default(1),
    })
  ),
  async (c) => {
    const { userId } = c.get('user')
    const body = c.req.valid('json')

    const business = await prisma.business.findFirst({
      where: { id: body.businessId, ownerId: userId },
    })

    if (!business) {
      return c.json({ error: 'İşletme bulunamadı veya yetkiniz yok' }, 404)
    }

    // Slotları hesapla
    const slots: Array<{ businessId: string; date: Date; startTime: string; endTime: string; capacity: number }> = []
    const [startH, startM] = body.startHour.split(':').map(Number)
    const [endH, endM] = body.endHour.split(':').map(Number)

    let currentMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    while (currentMinutes + body.durationMinutes <= endMinutes) {
      const startTime = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`
      const endMinute = currentMinutes + body.durationMinutes
      const endTime = `${String(Math.floor(endMinute / 60)).padStart(2, '0')}:${String(endMinute % 60).padStart(2, '0')}`

      slots.push({
        businessId: body.businessId,
        date: new Date(body.date),
        startTime,
        endTime,
        capacity: body.capacity,
      })

      currentMinutes += body.durationMinutes
    }

    await prisma.timeSlot.createMany({ data: slots, skipDuplicates: true })

    return c.json({ data: { created: slots.length } }, 201)
  }
)

// ─── Slot Engelle / Aç ────────────────────────────────────────────────────────
slotRoutes.patch(
  '/:id/block',
  businessOwnerMiddleware,
  zValidator('json', z.object({ isBlocked: z.boolean() })),
  async (c) => {
    const { userId } = c.get('user')
    const id = c.req.param('id')
    const { isBlocked } = c.req.valid('json')

    const slot = await prisma.timeSlot.findFirst({
      where: { id },
      include: { business: true },
    })

    if (!slot || slot.business.ownerId !== userId) {
      return c.json({ error: 'Slot bulunamadı veya yetkiniz yok' }, 404)
    }

    const updated = await prisma.timeSlot.update({
      where: { id },
      data: { isBlocked },
    })

    return c.json({ data: updated })
  }
)
