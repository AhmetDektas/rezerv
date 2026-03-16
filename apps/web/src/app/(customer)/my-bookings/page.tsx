'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'

type Reservation = {
  id: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
  notes: string | null
  createdAt: string
  business: { name: string; address: string; logoUrl: string | null; requiresDeposit: boolean }
  slot: { date: string; startTime: string; endTime: string }
  payment: { id: string; amount: number; status: string } | null
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  CONFIRMED:  { label: 'Onaylandı',  bg: '#f0fdf4', color: '#188977' },
  PENDING:    { label: 'Beklemede',  bg: '#fefce8', color: '#b45309' },
  COMPLETED:  { label: 'Tamamlandı', bg: '#f4f4f4', color: '#8d8d8d' },
  CANCELLED:  { label: 'İptal',      bg: '#fff1ee', color: '#db471e' },
  NO_SHOW:    { label: 'Gelmedi',    bg: '#fff1ee', color: '#db471e' },
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export default function MyBookingsPage() {
  const { token, user } = useAuthStore()
  const router = useRouter()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)

  function loadReservations() {
    setLoading(true)
    api
      .get<{ data: Reservation[] }>('/api/reservations/my', token ?? undefined)
      .then((res) => setReservations(res.data ?? []))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login')
      return
    }
    loadReservations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token, router])

  async function cancelReservation(id: string) {
    if (!confirm('Rezervasyonu iptal etmek istediğinize emin misiniz?')) return
    setActionId(id)
    try {
      await api.patch('/api/reservations/' + id + '/cancel', {}, token ?? undefined)
      loadReservations()
    } catch (err: Error | unknown) {
      alert(err instanceof Error ? err.message : 'İptal başarısız')
    } finally {
      setActionId(null)
    }
  }

  async function payDeposit(reservationId: string) {
    setActionId(reservationId)
    try {
      const res = await api.post<{ data: { paymentId: string; amount: number } }>(
        '/api/payments/initiate',
        { reservationId },
        token ?? undefined
      )
      // Mock confirm immediately for now
      await api.post('/api/payments/mock-confirm', { paymentId: res.data.paymentId }, token ?? undefined)
      loadReservations()
    } catch (err: Error | unknown) {
      alert(err instanceof Error ? err.message : 'Ödeme başarısız')
    } finally {
      setActionId(null)
    }
  }

  if (!user) return null

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold" style={{ color: '#191919' }}>Rezervasyonlarım</h1>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 h-20 animate-pulse" style={{ backgroundColor: '#f3f0fe' }} />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-10">
          <p className="text-sm" style={{ color: '#db471e' }}>{error}</p>
        </div>
      )}

      {!loading && !error && reservations.length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4 opacity-20">📅</div>
          <p className="text-sm font-medium" style={{ color: '#6f6f6f' }}>Henüz rezervasyonunuz yok.</p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-semibold"
            style={{ color: '#5d3ebc' }}
          >
            İşletme Keşfet
          </Link>
        </div>
      )}

      {!loading && !error && reservations.length > 0 && (
        <div className="space-y-3">
          {reservations.map((r) => {
            const s = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.PENDING
            return (
              <div
                key={r.id}
                className="bg-white rounded-2xl p-4 flex items-center justify-between"
                style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                    style={{ backgroundColor: '#f3f0fe' }}
                  >
                    {r.business.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.business.logoUrl}
                        alt={r.business.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">🗓️</span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#191919' }}>
                      {r.business.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#6f6f6f' }}>
                      {formatDate(r.slot.date)} · {r.slot.startTime}
                    </p>
                    {r.payment && (
                      <p className="text-xs mt-0.5" style={{ color: '#8d8d8d' }}>
                        ₺{r.payment.amount.toLocaleString('tr-TR')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className="text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap"
                    style={{ backgroundColor: s.bg, color: s.color }}
                  >
                    {s.label}
                  </span>
                  {/* Kapora öde butonu */}
                  {r.status === 'PENDING' && r.business.requiresDeposit && !r.payment && (
                    <button
                      disabled={actionId === r.id}
                      onClick={() => payDeposit(r.id)}
                      className="text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap transition-colors"
                      style={{ backgroundColor: '#fef3c7', color: '#b45309' }}
                    >
                      {actionId === r.id ? '...' : 'Kapora Öde'}
                    </button>
                  )}
                  {/* İptal butonu */}
                  {(r.status === 'PENDING' || r.status === 'CONFIRMED') && (
                    <button
                      disabled={actionId === r.id}
                      onClick={() => cancelReservation(r.id)}
                      className="text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap transition-colors"
                      style={{ backgroundColor: '#fff1ee', color: '#db471e' }}
                    >
                      {actionId === r.id ? '...' : 'İptal Et'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
