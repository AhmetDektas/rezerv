import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '@rezerv/db'
import { authMiddleware } from '../middleware/auth'

export const petRoutes = new Hono()

// ─── Evcil Hayvanlarımı Listele ───────────────────────────────────────────────
petRoutes.get('/', authMiddleware, async (c) => {
  const { userId } = c.get('user')

  const pets = await prisma.pet.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  return c.json({ data: pets })
})

// ─── Evcil Hayvan Ekle ────────────────────────────────────────────────────────
petRoutes.post(
  '/',
  authMiddleware,
  zValidator(
    'json',
    z.object({
      name: z.string().min(1),
      type: z.enum(['DOG', 'CAT', 'BIRD', 'RABBIT', 'OTHER']),
      breed: z.string().optional(),
      age: z.number().int().positive().optional(),
      weight: z.number().positive().optional(),
      notes: z.string().optional(),
      pixelArt: z.array(z.string()).length(256).optional(), // 16x16 grid
    })
  ),
  async (c) => {
    const { userId } = c.get('user')
    const body = c.req.valid('json')

    const pet = await prisma.pet.create({
      data: { ...body, userId },
    })

    return c.json({ data: pet }, 201)
  }
)

// ─── Evcil Hayvan Güncelle ────────────────────────────────────────────────────
petRoutes.patch(
  '/:id',
  authMiddleware,
  zValidator(
    'json',
    z.object({
      name: z.string().min(1).optional(),
      breed: z.string().optional(),
      age: z.number().int().positive().optional(),
      weight: z.number().positive().optional(),
      notes: z.string().optional(),
      pixelArt: z.array(z.string()).length(256).optional(),
    })
  ),
  async (c) => {
    const { userId } = c.get('user')
    const id = c.req.param('id')
    const body = c.req.valid('json')

    const pet = await prisma.pet.findFirst({ where: { id, userId } })
    if (!pet) {
      return c.json({ error: 'Evcil hayvan bulunamadı' }, 404)
    }

    const updated = await prisma.pet.update({ where: { id }, data: body })

    return c.json({ data: updated })
  }
)

// ─── Pixel Art Kaydet ─────────────────────────────────────────────────────────
petRoutes.put(
  '/:id/pixel-art',
  authMiddleware,
  zValidator(
    'json',
    z.object({
      pixelArt: z.array(z.string()).length(256),
    })
  ),
  async (c) => {
    const { userId } = c.get('user')
    const id = c.req.param('id')
    const { pixelArt } = c.req.valid('json')

    const pet = await prisma.pet.findFirst({ where: { id, userId } })
    if (!pet) {
      return c.json({ error: 'Evcil hayvan bulunamadı' }, 404)
    }

    const updated = await prisma.pet.update({ where: { id }, data: { pixelArt } })

    return c.json({ data: updated })
  }
)

// ─── Evcil Hayvan Sil ─────────────────────────────────────────────────────────
petRoutes.delete('/:id', authMiddleware, async (c) => {
  const { userId } = c.get('user')
  const id = c.req.param('id')

  const pet = await prisma.pet.findFirst({ where: { id, userId } })
  if (!pet) {
    return c.json({ error: 'Evcil hayvan bulunamadı' }, 404)
  }

  await prisma.pet.delete({ where: { id } })

  return c.json({ data: { message: 'Evcil hayvan silindi' } })
})
