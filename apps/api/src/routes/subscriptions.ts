import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '@rezerv/db'
import { businessOwnerMiddleware } from '../middleware/auth'
import { formatCurrency } from '@rezerv/utils'

export const subscriptionRoutes = new Hono()

// ─── Planları Listele ─────────────────────────────────────────────────────────
subscriptionRoutes.get('/plans', async (c) => {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { monthlyPrice: 'asc' },
  })

  return c.json({ data: plans })
})

// ─── İşletmenin Aktif Aboneliği ───────────────────────────────────────────────
subscriptionRoutes.get('/my/:businessId', businessOwnerMiddleware, async (c) => {
  const { userId } = c.get('user')
  const businessId = c.req.param('businessId')

  const business = await prisma.business.findFirst({ where: { id: businessId, ownerId: userId } })
  if (!business) {
    return c.json({ error: 'İşletme bulunamadı veya yetkiniz yok' }, 404)
  }

  const subscription = await prisma.businessSubscription.findUnique({
    where: { businessId },
    include: { plan: true, invoices: { orderBy: { createdAt: 'desc' }, take: 12 } },
  })

  if (!subscription) {
    return c.json({ data: null, message: 'Aktif abonelik yok' })
  }

  // Akıllı öneri: aboneliğe geçmek avantajlı mı?
  let recommendation: string | null = null
  if (subscription.plan.type === 'COMMISSION' && subscription.plan.monthlyPrice == null) {
    // Komisyon planındaysa aboneliğin daha avantajlı olup olmadığını kontrol et
    const subscriptionPlans = await prisma.subscriptionPlan.findMany({
      where: { type: 'SUBSCRIPTION', isActive: true },
    })

    for (const plan of subscriptionPlans) {
      if (plan.monthlyPrice && subscription.totalFee >= plan.monthlyPrice) {
        recommendation = `Bu ay ${formatCurrency(subscription.totalFee)} komisyon ödediniz. ${plan.name} aboneliğine geçerek ${formatCurrency(subscription.totalFee - plan.monthlyPrice)} tasarruf edebilirdiniz!`
        break
      }
    }
  }

  return c.json({ data: { ...subscription, recommendation } })
})

// ─── Plana Abone Ol ───────────────────────────────────────────────────────────
subscriptionRoutes.post(
  '/subscribe',
  businessOwnerMiddleware,
  zValidator(
    'json',
    z.object({
      businessId: z.string(),
      planId: z.string(),
      billingCycle: z.enum(['MONTHLY', 'YEARLY']).optional(),
    })
  ),
  async (c) => {
    const { userId } = c.get('user')
    const { businessId, planId, billingCycle } = c.req.valid('json')

    const business = await prisma.business.findFirst({ where: { id: businessId, ownerId: userId } })
    if (!business) {
      return c.json({ error: 'İşletme bulunamadı veya yetkiniz yok' }, 404)
    }

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } })
    if (!plan || !plan.isActive) {
      return c.json({ error: 'Plan bulunamadı' }, 404)
    }

    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 14)

    const endDate =
      plan.type === 'SUBSCRIPTION' && billingCycle
        ? (() => {
            const d = new Date()
            if (billingCycle === 'MONTHLY') d.setMonth(d.getMonth() + 1)
            else d.setFullYear(d.getFullYear() + 1)
            return d
          })()
        : null

    const subscription = await prisma.businessSubscription.upsert({
      where: { businessId },
      create: {
        businessId,
        planId,
        status: 'TRIAL',
        billingCycle: billingCycle ?? null,
        startDate: new Date(),
        endDate,
        trialEndDate,
      },
      update: {
        planId,
        status: 'TRIAL',
        billingCycle: billingCycle ?? null,
        startDate: new Date(),
        endDate,
        trialEndDate,
      },
      include: { plan: true },
    })

    return c.json({ data: subscription }, 201)
  }
)

// ─── Abonelik İptal ───────────────────────────────────────────────────────────
subscriptionRoutes.delete('/cancel/:businessId', businessOwnerMiddleware, async (c) => {
  const { userId } = c.get('user')
  const businessId = c.req.param('businessId')

  const business = await prisma.business.findFirst({ where: { id: businessId, ownerId: userId } })
  if (!business) {
    return c.json({ error: 'İşletme bulunamadı veya yetkiniz yok' }, 404)
  }

  await prisma.businessSubscription.update({
    where: { businessId },
    data: { status: 'CANCELLED' },
  })

  return c.json({ data: { message: 'Abonelik iptal edildi' } })
})
