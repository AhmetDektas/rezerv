import Link from 'next/link'
import { CategoryGrid } from '@/components/shared/category-grid'
import { SearchBar } from '@/components/shared/search-bar'
import { PromoBanner } from '@/components/shared/promo-banner'

const CATEGORY_EMOJI: Record<string, string> = {
  FOOD_DRINK: '🍽️', HEALTH: '🏥', SPORTS: '🏋️', VETERINARY: '🐾',
}

type Business = {
  id: string; name: string; slug: string; category: string
  description: string | null; address: string
  coverImage: string | null; logoUrl: string | null
  requiresDeposit: boolean; depositType: string | null; depositAmount: number | null
}

async function getFeaturedBusinesses(): Promise<Business[]> {
  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/businesses?limit=8`
    const res = await fetch(url, { next: { revalidate: 60 } })
    if (!res.ok) return []
    const data = await res.json()
    return data.data ?? []
  } catch {
    return []
  }
}

export default async function HomePage() {
  const featured = await getFeaturedBusinesses()

  return (
    <div className="py-4 space-y-5">
      {/* Arama */}
      <SearchBar />

      {/* Promosyon Banner */}
      <PromoBanner />

      {/* Kategoriler */}
      <section className="pt-2">
        <h2 className="text-base font-bold mb-3" style={{ color: '#191919' }}>Kategoriler</h2>
        <CategoryGrid />
      </section>

      {/* Popüler İşletmeler */}
      {featured.length > 0 && (
        <section>
          <h2 className="text-base font-bold mb-3" style={{ color: '#191919' }}>Popüler İşletmeler</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((biz) => (
              <Link
                key={biz.id}
                href={`/businesses/${biz.slug}`}
                className="block bg-white rounded-2xl overflow-hidden"
                style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}
              >
                {/* Cover */}
                <div className="h-32 overflow-hidden relative" style={{ backgroundColor: '#f3f0fe' }}>
                  {biz.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={biz.coverImage} alt={biz.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl opacity-20">
                      {CATEGORY_EMOJI[biz.category] ?? '🏪'}
                    </div>
                  )}
                  {biz.requiresDeposit && (
                    <span className="absolute bottom-2 left-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: '#16a34a' }}>
                      Kapora
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm" style={{ color: '#191919' }}>{biz.name}</h3>
                  {biz.description && (
                    <p className="text-xs mt-0.5 line-clamp-1" style={{ color: '#6f6f6f' }}>{biz.description}</p>
                  )}
                  <p className="text-xs mt-1 truncate" style={{ color: '#8d8d8d' }}>📍 {biz.address}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
