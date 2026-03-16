'use client'

import { useEffect, useState, useCallback } from 'react'
import { apiRequest } from '@/lib/api'
import { BarChart2, Calendar, CheckCircle, XCircle, DollarSign, RefreshCw } from 'lucide-react'

interface ReportData {
  totalReservations: number
  completedReservations: number
  cancelledReservations: number
  pendingReservations?: number
  totalRevenue: number
  averageOrderValue?: number
}

const StartDateField = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="block text-xs font-semibold text-muted-foreground mb-1">Başlangıç</label>
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
    />
  </div>
)

const EndDateField = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="block text-xs font-semibold text-muted-foreground mb-1">Bitiş</label>
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
    />
  </div>
)

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const today = new Date()
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const [startDate, setStartDate] = useState(firstOfMonth.toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0])

  const fetchReports = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
      const query = params.toString() ? `?${params.toString()}` : ''
      const res = await apiRequest<ReportData>(`/api/dashboard/reports/overview${query}`)
      setData(res)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Raporlar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const completionRate =
    data && data.totalReservations > 0
      ? Math.round((data.completedReservations / data.totalReservations) * 100)
      : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-foreground">Raporlar</h1>
        <button
          onClick={fetchReports}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-brand-purple transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {/* Date range filter */}
      <div className="flex items-end gap-4 mb-6 flex-wrap">
        <StartDateField value={startDate} onChange={setStartDate} />
        <EndDateField value={endDate} onChange={setEndDate} />
        <button
          onClick={fetchReports}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-brand-purple text-white text-sm font-medium hover:bg-brand-purple-dark transition-colors disabled:opacity-60"
        >
          Filtrele
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data ? (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl card-shadow p-5 flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-brand-purple-light flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-brand-purple" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{data.totalReservations}</div>
                <div className="text-xs text-muted-foreground">Toplam Rezervasyon</div>
              </div>
            </div>

            <div className="bg-white rounded-xl card-shadow p-5 flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{data.completedReservations}</div>
                <div className="text-xs text-muted-foreground">Tamamlanan</div>
              </div>
            </div>

            <div className="bg-white rounded-xl card-shadow p-5 flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{data.cancelledReservations}</div>
                <div className="text-xs text-muted-foreground">İptal Edilen</div>
              </div>
            </div>

            <div className="bg-white rounded-xl card-shadow p-5 flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-brand-purple-light flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-brand-purple" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  ₺{(data.totalRevenue ?? 0).toLocaleString('tr-TR')}
                </div>
                <div className="text-xs text-muted-foreground">Toplam Gelir</div>
              </div>
            </div>
          </div>

          {/* Summary card */}
          <div className="bg-white rounded-xl card-shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart2 className="w-5 h-5 text-brand-purple" />
              <h2 className="font-semibold text-foreground">Özet</h2>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Tamamlanma Oranı</span>
                  <span className="font-semibold text-foreground">{completionRate}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>

              {data.averageOrderValue != null && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Ortalama Sipariş Değeri</span>
                  <span className="font-semibold text-foreground">
                    ₺{data.averageOrderValue.toLocaleString('tr-TR')}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">İptal Oranı</span>
                <span className="font-semibold text-foreground">
                  {data.totalReservations > 0
                    ? Math.round((data.cancelledReservations / data.totalReservations) * 100)
                    : 0}
                  %
                </span>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Dönem</span>
                <span className="font-medium text-foreground">
                  {startDate && new Date(startDate).toLocaleDateString('tr-TR')} —{' '}
                  {endDate && new Date(endDate).toLocaleDateString('tr-TR')}
                </span>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
