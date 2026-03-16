'use client'

import { useEffect, useState, useCallback } from 'react'
import { apiRequest } from '@/lib/api'
import { Calendar, RefreshCw } from 'lucide-react'

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

type TabKey = 'PENDING' | 'CONFIRMED' | 'ALL'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'PENDING', label: 'Bekliyor' },
  { key: 'CONFIRMED', label: 'Onaylandı' },
  { key: 'ALL', label: 'Tümü' },
]

const DateFilterField = ({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) => (
  <input
    type="date"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
  />
)

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<TabKey>('ALL')
  const [dateFilter, setDateFilter] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchReservations = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (activeTab !== 'ALL') params.set('status', activeTab)
      if (dateFilter) params.set('date', dateFilter)
      const query = params.toString() ? `?${params.toString()}` : ''
      const res = await apiRequest<{ reservations: Reservation[] }>(
        `/api/dashboard/reservations${query}`
      )
      setReservations(res.reservations ?? [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Veri yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [activeTab, dateFilter])

  useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

  async function updateStatus(id: string, status: string) {
    setActionLoading(id + status)
    try {
      await apiRequest(`/api/dashboard/reservations/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      await fetchReservations()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'İşlem başarısız')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-foreground">Rezervasyonlar</h1>
        <button
          onClick={fetchReservations}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-brand-purple transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {/* Tabs + date filter */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="flex bg-white border border-border rounded-xl overflow-hidden">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-brand-purple text-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <DateFilterField value={dateFilter} onChange={setDateFilter} />
        {dateFilter && (
          <button
            onClick={() => setDateFilter('')}
            className="text-sm text-brand-purple hover:underline"
          >
            Filtreyi temizle
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl card-shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <div className="text-muted-foreground text-sm">Rezervasyon bulunamadı</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Müşteri
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Tarih/Saat
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Hizmet
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Durum
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reservations.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground text-sm">{r.customerName}</div>
                      {r.customerPhone && (
                        <div className="text-xs text-muted-foreground">{r.customerPhone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-foreground">{r.date}</div>
                      <div className="text-xs text-muted-foreground">{r.time}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-foreground">{r.serviceName ?? '—'}</div>
                      {r.totalPrice != null && (
                        <div className="text-xs text-muted-foreground">
                          ₺{r.totalPrice.toLocaleString('tr-TR')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[r.status] ?? 'bg-gray-100 text-gray-700'}`}
                      >
                        {statusLabels[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        {r.status === 'PENDING' && (
                          <>
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
                          </>
                        )}
                        {r.status === 'CONFIRMED' && (
                          <>
                            <button
                              onClick={() => updateStatus(r.id, 'COMPLETED')}
                              disabled={actionLoading === r.id + 'COMPLETED'}
                              className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors disabled:opacity-60"
                            >
                              {actionLoading === r.id + 'COMPLETED' ? '...' : 'Tamamlandı'}
                            </button>
                            <button
                              onClick={() => updateStatus(r.id, 'NO_SHOW')}
                              disabled={actionLoading === r.id + 'NO_SHOW'}
                              className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-medium hover:bg-red-200 transition-colors disabled:opacity-60"
                            >
                              {actionLoading === r.id + 'NO_SHOW' ? '...' : 'Gelmedi'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
