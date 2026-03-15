import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '@rezerv/db'
import { authMiddleware } from '../middleware/auth'
import { calculateDeposit } from '@rezerv/utils'

export const paymentRoutes = new Hono()

// ─── Kaparo Ödeme Başlat ──────────────────────────────────────────────────────
// NOT: Gerçek iyzico entegrasyonu için iyzico SDK eklenecek
paymentRoutes.post(
  '/initiate',
  authMiddleware,
  zValidator(
    'json',
    z.object({
      reservationId: z.string(),
    })
  ),
  async (c) => {
    const { userId } = c.get('user')
    const { reservationId } = c.req.valid('json')

    const reservation = await prisma.reservation.findFirst({
      where: { id: reservationId, userId },
      include: { business: true, payment: true },
    })

    if (!reservation) {
      return c.json({ error: 'Rezervasyon bulunamadı' }, 404)
    }

    if (reservation.payment) {
      return c.json({ error: 'Bu rezervasyon için ödeme zaten başlatıldı' }, 409)
    }

    const depositInfo = calculateDeposit(reservation.business)

    if (!depositInfo.required) {
      return c.json({ error: 'Bu işletme kaparo gerektirmiyor' }, 400)
    }

    // Ödeme kaydı oluştur (PENDING)
    const payment = await prisma.payment.create({
      data: {
        reservationId,
        amount: depositInfo.amount,
        status: 'PENDING',
        provider: 'iyzico',
      },
    })

    // TODO: Gerçek iyzico ödeme formu başlatma
    // const iyzicoResponse = await initiateIyzicoPayment({ ... })

    return c.json({
      data: {
        paymentId: payment.id,
        amount: depositInfo.amount,
        label: depositInfo.label,
        // checkoutFormContent: iyzicoResponse.checkoutFormContent,
        status: 'PENDING',
        message: 'iyzico entegrasyonu yakında aktif olacak',
      },
    })
  }
)

// ─── Ödeme Durumu Sorgula ─────────────────────────────────────────────────────
paymentRoutes.get('/:reservationId', authMiddleware, async (c) => {
  const { userId } = c.get('user')
  const reservationId = c.req.param('reservationId')

  const payment = await prisma.payment.findFirst({
    where: { reservationId, reservation: { userId } },
    include: { reservation: { select: { status: true } } },
  })

  if (!payment) {
    return c.json({ error: 'Ödeme bulunamadı' }, 404)
  }

  return c.json({ data: payment })
})

// ─── iyzico Webhook (Ödeme Sonucu) ───────────────────────────────────────────
paymentRoutes.post('/webhook/iyzico', async (c) => {
  // TODO: iyzico imza doğrulaması
  // const signature = c.req.header('x-iyz-signature')

  const body = await c.req.json()
  const { paymentId, status, transactionId } = body

  if (status === 'SUCCESS') {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } })
    if (!payment) return c.json({ ok: true })

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: { status: 'PAID', transactionId },
      })
      await tx.reservation.update({
        where: { id: payment.reservationId },
        data: { status: 'CONFIRMED' },
      })
    })
  }

  return c.json({ ok: true })
})
