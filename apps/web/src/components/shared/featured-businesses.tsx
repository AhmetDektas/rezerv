import Link from 'next/link'
import { api } from '@/lib/api'
import { MapPin, Wallet } from 'lucide-react'
import { CATEGORIES } from '@rezerv/types'
import { formatCurrency } from '@rezerv/utils'

type Business = {
  id: string
  name: string
  slug: string
  category: string
  description?: string
  address: string
  coverImage?: string
  logoUrl?: string
  requiresDeposit: boolean
  depositType?: string
  depositAmount?: number
  depositPercent?: number
}

export async function FeaturedBusinesses() {
  let businesses: Business[] = []
  try {
    const res = await api.get<{ data: Business[] }>('/api/businesses?limit=8')
    businesses = res.data
  } catch {
    return null
  }

  if (businesses.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm">
        Henüz kayıtlı işletme bulunmuyor.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {businesses.map((b) => {
        const category = CATEGORIES.find((c) => c.id === b.category)
        return (
          <Link
            key={b.id}
            href={`/businesses/${b.slug}`}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group"
          >
            {/* Kapak Görseli */}
            <div className="h-36 bg-gradient-to-br from-blue-50 to-blue-100 relative overflow-hidden">
              {b.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.coverImage} alt={b.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl opacity-30">
                  {category?.emoji}
                </div>
              )}
              <span className="absolute top-2 left-2 bg-white/90 text-xs font-semibold px-2 py-0.5 rounded-full text-gray-600">
                {category?.label}
              </span>
            </div>

            {/* İçerik */}
            <div className="p-3 space-y-1.5">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                {b.name}
              </h3>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{b.address}</span>
              </div>
              {b.requiresDeposit && (
                <div className="flex items-center gap-1 text-xs text-amber-600">
                  <Wallet className="w-3 h-3" />
                  <span>
                    Kaparo:{' '}
                    {b.depositType === 'FIXED' && b.depositAmount
                      ? formatCurrency(b.depositAmount)
                      : b.depositType === 'PERCENTAGE' && b.depositPercent
                        ? `%${b.depositPercent}`
                        : '—'}
                  </span>
                </div>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
