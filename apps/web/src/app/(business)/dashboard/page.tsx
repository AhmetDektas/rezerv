'use client'

import { useQuery } from '@tanstack/react-query'
import { Calendar, TrendingUp, Users, Wallet, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@rezerv/utils'

export default function DashboardPage() {
  const { token } = useAuthStore()

  const { data: businesses } = useQuery({
    queryKey: ['my-businesses'],
    queryFn: () => api.get<{ data: any[] }>('/api/businesses/my/list', token ?? undefined),
    enabled: !!token,
  })

  const business = businesses?.data?.[0]

  const { data: reservationsData } = useQuery({
    queryKey: ['today-reservations', business?.id],
    queryFn: () =>
      api.get<{ data: any[]; total: number }>(
        `/api/reservations/business/${business?.id}?date=${new Date().toISOString().split('T')[0]}&limit=10`,
        token ?? undefined
      ),
    enabled: !!business?.id,
  })

  if (!business) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-gray-500">Henüz bir işletmeniz yok</p>
          <a
            href="/settings"
            className="inline-block bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-700"
          >
            İşletme Oluştur
          </a>
        </div>
      </div>
    )
  }

  const todayReservations = reservationsData?.data ?? []
  const subscription = business.subscription

  const stats = [
    {
      label: 'Bugün Rezervasyon',
      value: reservationsData?.total ?? 0,
      icon: Calendar,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Toplam Rezervasyon',
      value: business._count?.reservations ?? 0,
      icon: Users,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Komisyon Ödendi',
      value: formatCurrency(subscription?.totalFee ?? 0),
      icon: TrendingUp,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      label: 'Net Gelir',
      value: formatCurrency(subscription?.totalRevenue ?? 0),
      icon: Wallet,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {formatDate(new Date())} — Hoş geldiniz
        </p>
      </div>

      {/* Abonelik Uyarısı */}
      {subscription?.recommendation && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-amber-800">Tasarruf Fırsatı</div>
            <div className="text-sm text-amber-700 mt-0.5">{subscription.recommendation}</div>
            <a
              href="/subscription"
              className="text-xs font-semibold text-amber-800 underline mt-1 inline-block"
            >
              Planları İncele →
            </a>
          </div>
        </div>
      )}

      {/* İstatistikler */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className={`w-9 h-9 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Bugünkü Rezervasyonlar */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900">Bugünkü Rezervasyonlar</h2>
        </div>
        {todayReservations.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">
            Bugün için rezervasyon yok
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {todayReservations.map((res: any) => (
              <div key={res.id} className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-sm font-bold text-blue-600">
                    {res.slot.startTime.slice(0, 5)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{res.user.name}</div>
                    <div className="text-xs text-gray-400">{res.user.phone}</div>
                  </div>
                </div>
                <StatusBadge status={res.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    PENDING: { label: 'Bekliyor', className: 'bg-yellow-50 text-yellow-700' },
    CONFIRMED: { label: 'Onaylı', className: 'bg-green-50 text-green-700' },
    CANCELLED: { label: 'İptal', className: 'bg-red-50 text-red-600' },
    NO_SHOW: { label: 'Gelmedi', className: 'bg-gray-100 text-gray-500' },
    COMPLETED: { label: 'Tamamlandı', className: 'bg-blue-50 text-blue-600' },
  }
  const { label, className } = map[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${className}`}>{label}</span>
  )
}
