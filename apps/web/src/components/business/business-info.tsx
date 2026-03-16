import { MapPin, Phone, Clock, Wallet } from 'lucide-react'
import { CATEGORIES } from '@rezerv/types'
import { formatCurrency } from '@rezerv/utils'

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
          <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">
            {category?.emoji}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{business.name}</h1>
          <span className="text-sm text-blue-600 font-medium">{category?.label}</span>
        </div>
      </div>

      {/* Açıklama */}
      {business.description && (
        <p className="text-sm text-gray-600 leading-relaxed">{business.description}</p>
      )}

      {/* Adres + Telefon */}
      <div className="space-y-2">
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
          <span>{business.address}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone className="w-4 h-4 text-gray-400 shrink-0" />
          <a href={`tel:${business.phone}`} className="hover:text-blue-600">
            {business.phone}
          </a>
        </div>
        {todayHours && !todayHours.isClosed && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-gray-400 shrink-0" />
            <span>
              Bugün {todayHours.openTime} – {todayHours.closeTime}
            </span>
            <span className="text-green-600 font-medium text-xs">Açık</span>
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
    </div>
  )
}
