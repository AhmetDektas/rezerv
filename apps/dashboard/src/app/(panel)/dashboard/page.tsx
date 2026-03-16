'use client'

import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { Calendar, CheckCircle, Clock, DollarSign, RefreshCw } from 'lucide-react'

interface Reservation {
  id: string
  customerName: string
  customerPhone?: string
  date: string
  time: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
  serviceName?: string
  totalPrice?: number
}

interface OverviewData {
  totalReservations: number
  completedReservations: number
  cancelledReservations: number
  totalRevenue: number
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-orange-100 text-orange-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  NO_SHOW: 'bg-red-100 text-red-700',
}

const statusLabels: Record<string, string> = {
  PENDING: 'Bekliyor',
  CONFIRMED: 'Onaylandı',
  CANCELLED: 'İptal',
  COMPLETED: 'Tamamlandı',
  NO_SHOW: 'Gelmedi',
}

export default function DashboardPage() {
  const [todayReservations, setTodayReservations] = useState<Reservation[]>([])
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function fetchData() {
    setLoading(true)
    setError('')
    try {
      const [todayRes, overviewRes] = await Promise.all([
        apiRequest<{ reservations: Reservation[] }>('/api/dashboard/reservations/today'),
        apiRequest<OverviewData>('/api/dashboard/reports/overview'),
      ])
      setTodayReservations(todayRes.reservations ?? [])
      setOverview(overviewRes)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Veri yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  async function updateStatus(id: string, status: string) {
    setActionLoading(id + status)
    try {
      await apiRequest(`/api/dashboard/reservations/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      await fetchData()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'İşlem başarısız')
    } finally {
      setActionLoading(null)
    }
  }

  const pending = todayReservations.filter((r) => r.status === 'PENDING').length
  const confirmed = todayReservations.filter((r) => r.status === 'CONFIRMED').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-brand-purple transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl card-shadow p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-purple-light flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-brand-purple" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{todayReservations.length}</div>
            <div className="text-xs text-muted-foreground">Bugünkü Rezervasyon</div>
          </div>
        </div>

        <div className="bg-white rounded-xl card-shadow p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{pending}</div>
            <div className="text-xs text-muted-foreground">Bekliyor</div>
          </div>
        </div>

        <div className="bg-white rounded-xl card-shadow p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{confirmed}</div>
            <div className="text-xs text-muted-foreground">Onaylandı</div>
          </div>
        </div>

        <div className="bg-white rounded-xl card-shadow p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-purple-light flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-5 h-5 text-brand-purple" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">
              {overview?.totalRevenue != null ? `₺${overview.totalRevenue.toLocaleString('tr-TR')}` : '—'}
            </div>
            <div className="text-xs text-muted-foreground">Toplam Gelir</div>
          </div>
        </div>
      </div>

      {/* Today's reservations */}
      <div className="bg-white rounded-xl card-shadow">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Bugünkü Rezervasyonlar</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
          </div>
        ) : todayReservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <div className="text-muted-foreground text-sm">Bugün rezervasyon bulunmuyor</div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {todayReservations.map((r) => (
              <div key={r.id} className="px-6 py-4 flex items-center gap-4">
                <div className="text-sm font-semibold text-brand-purple w-14 flex-shrink-0">
                  {r.time}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground text-sm truncate">
                    {r.customerName}
                  </div>
                  {r.serviceName && (
                    <div className="text-xs text-muted-foreground truncate">{r.serviceName}</div>
                  )}
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${statusColors[r.status] ?? 'bg-gray-100 text-gray-700'}`}
                >
                  {statusLabels[r.status] ?? r.status}
                </span>
                {r.status === 'PENDING' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => updateStatus(r.id, 'CONFIRMED')}
                      disabled={actionLoading === r.id + 'CONFIRMED'}
                      className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-60"
                    >
                      {actionLoading === r.id + 'CONFIRMED' ? '...' : 'Onayla'}
                    </button>
                    <button
                      onClick={() => updateStatus(r.id, 'CANCELLED')}
                      disabled={actionLoading === r.id + 'CANCELLED'}
                      className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-medium hover:bg-red-200 transition-colors disabled:opacity-60"
                    >
                      {actionLoading === r.id + 'CANCELLED' ? '...' : 'İptal'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
