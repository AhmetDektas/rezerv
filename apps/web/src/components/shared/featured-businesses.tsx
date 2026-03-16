import Link from 'next/link'
import { api } from '@/lib/api'
import { MapPin, Wallet, Clock } from 'lucide-react'
import { CATEGORIES } from '@rezerv/types'
import { formatCurrency } from '@rezerv/utils'

type Business = {
  id: string; name: string; slug: string; category: string
  description?: string; address: string; coverImage?: string
  logoUrl?: string; requiresDeposit: boolean
  depositType?: string; depositAmount?: number; depositPercent?: number
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
      <div className="text-center py-10 text-sm" style={{ color: '#a2a2a2' }}>
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
            className="bg-white rounded-2xl overflow-hidden block transition-all"
            className="card-shadow"
          >
            {/* Kapak Görseli */}
            <div className="h-32 relative overflow-hidden" style={{ backgroundColor: '#f3f0fe' }}>
              {b.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.coverImage} alt={b.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl opacity-40">
                  {category?.emoji}
                </div>
              )}
              <span
                className="absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: '#f2f0fa', color: '#5d3ebc' }}
              >
                {category?.label}
              </span>
            </div>

            {/* İçerik */}
            <div className="p-3 space-y-1.5">
              <h3 className="font-semibold text-sm truncate" style={{ color: '#5d3ebc' }}>
                {b.name}
              </h3>
              <div className="flex items-center gap-1 text-xs" style={{ color: '#6f6f6f' }}>
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{b.address}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs" style={{ color: '#6f6f6f' }}>
                  <Clock className="w-3 h-3" />
                  <span>~15 dk</span>
                </div>
                {b.requiresDeposit && (
                  <div className="flex items-center gap-1 text-xs" style={{ color: '#db471e' }}>
                    <Wallet className="w-3 h-3" />
                    <span>
                      {b.depositType === 'FIXED' && b.depositAmount
                        ? formatCurrency(b.depositAmount)
                        : b.depositType === 'PERCENTAGE' && b.depositPercent
                          ? `%${b.depositPercent} kaparo`
                          : 'Kaparo'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
