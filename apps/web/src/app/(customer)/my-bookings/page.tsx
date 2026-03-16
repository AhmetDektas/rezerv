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
  business: { name: string; address: string; logoUrl: string | null }
  slot: { date: string; startTime: string; endTime: string }
  payment: { amount: number } | null
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

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login')
      return
    }
    api
      .get<{ data: Reservation[] }>('/api/reservations/my', token ?? undefined)
      .then((res) => setReservations(res.data ?? []))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [user, token, router])

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
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap"
                  style={{ backgroundColor: s.bg, color: s.color }}
                >
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
