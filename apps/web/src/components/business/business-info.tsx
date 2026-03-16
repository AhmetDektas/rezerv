import { MapPin, Phone, Clock, Wallet, Scissors } from 'lucide-react'
import { CATEGORIES } from '@rezerv/types'
import { formatCurrency } from '@rezerv/utils'

type Service = {
  id: string
  name: string
  description?: string | null
  price: number
  duration: number
}

type Props = {
  business: {
    name: string
    category: string
    description?: string
    address: string
    phone: string
    logoUrl?: string
    requiresDeposit: boolean
    depositType?: string
    depositAmount?: number
    depositPercent?: number
    hours?: Array<{ dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean }>
    services?: Service[]
  }
}

const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

export function BusinessInfo({ business }: Props) {
  const category = CATEGORIES.find((c) => c.id === business.category)
  const today = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
  const todayHours = business.hours?.find((h) => h.dayOfWeek === today)

  return (
    <div className="space-y-4">
      {/* Başlık */}
      <div className="flex items-start gap-3">
        {business.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={business.logoUrl}
            alt={business.name}
            className="w-14 h-14 rounded-xl object-cover border border-gray-100"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: '#f3f0fe' }}>
            {category?.emoji}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate" style={{ color: '#191919' }}>{business.name}</h1>
          <span className="text-sm font-medium" style={{ color: '#5d3ebc' }}>{category?.label}</span>
        </div>
      </div>

      {/* Açıklama */}
      {business.description && (
        <p className="text-sm leading-relaxed" style={{ color: '#6f6f6f' }}>{business.description}</p>
      )}

      {/* Adres + Telefon + Saat */}
      <div className="space-y-2">
        <div className="flex items-start gap-2 text-sm" style={{ color: '#6f6f6f' }}>
          <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#a2a2a2' }} />
          <span>{business.address}</span>
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: '#6f6f6f' }}>
          <Phone className="w-4 h-4 shrink-0" style={{ color: '#a2a2a2' }} />
          <a href={`tel:${business.phone}`} className="hover:underline" style={{ color: '#5d3ebc' }}>
            {business.phone}
          </a>
        </div>
        {todayHours && (
          <div className="flex items-center gap-2 text-sm" style={{ color: '#6f6f6f' }}>
            <Clock className="w-4 h-4 shrink-0" style={{ color: '#a2a2a2' }} />
            {todayHours.isClosed ? (
              <span className="text-red-500 font-medium text-xs">Bugün Kapalı</span>
            ) : (
              <>
                <span>Bugün {todayHours.openTime} – {todayHours.closeTime}</span>
                <span className="font-medium text-xs" style={{ color: '#16a34a' }}>Açık</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Kapora bilgisi */}
      {business.requiresDeposit && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <Wallet className="w-4 h-4 text-amber-600 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold text-amber-800">Kapora gerekli: </span>
            <span className="text-amber-700">
              {business.depositType === 'FIXED' && business.depositAmount
                ? formatCurrency(business.depositAmount)
                : business.depositType === 'PERCENTAGE' && business.depositPercent
                  ? `%${business.depositPercent}`
                  : '—'}
            </span>
          </div>
        </div>
      )}

      {/* Hizmetler */}
      {business.services && business.services.length > 0 && (
        <div>
          <h3 className="text-sm font-bold mb-2" style={{ color: '#191919' }}>Hizmetler</h3>
          <div className="space-y-2">
            {business.services.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl"
                style={{ backgroundColor: '#fafafa', border: '1px solid #f0f0f0' }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Scissors className="w-3.5 h-3.5 shrink-0" style={{ color: '#5d3ebc' }} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#191919' }}>{s.name}</p>
                    <p className="text-xs" style={{ color: '#a2a2a2' }}>{s.duration} dk</p>
                  </div>
                </div>
                <span className="text-sm font-bold shrink-0 ml-3" style={{ color: '#5d3ebc' }}>
                  {formatCurrency(s.price)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
