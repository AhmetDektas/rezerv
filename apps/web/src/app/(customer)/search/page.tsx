import Link from 'next/link'

const CATEGORY_EMOJI: Record<string, string> = {
  FOOD_DRINK: '🍽️', HEALTH: '🏥', SPORTS: '🏋️', VETERINARY: '🐾',
}

const CATEGORY_LABELS: Record<string, string> = {
  FOOD_DRINK: 'Yeme-İçme', HEALTH: 'Sağlık', SPORTS: 'Spor', VETERINARY: 'Veteriner',
}

type Business = {
  id: string
  name: string
  slug: string
  category: string
  description: string | null
  address: string
  coverImage: string | null
  requiresDeposit: boolean
  depositAmount: number | null
}

type Props = { searchParams: Promise<{ q?: string }> }

async function searchBusinesses(query: string): Promise<Business[]> {
  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/businesses?search=${encodeURIComponent(query)}&limit=50`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    return data.data ?? []
  } catch {
    return []
  }
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''
  const results = query ? await searchBusinesses(query) : []

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: '#191919' }}>
          {query ? `"${query}" için sonuçlar` : 'Arama'}
        </h1>
        {query && (
          <p className="text-sm mt-0.5" style={{ color: '#a2a2a2' }}>
            {results.length > 0
              ? `${results.length} işletme bulundu`
              : 'Sonuç bulunamadı'}
          </p>
        )}
      </div>

      {/* No query */}
      {!query && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4 opacity-20">🔍</div>
          <p className="text-sm font-medium" style={{ color: '#6f6f6f' }}>
            Aramak istediğiniz işletmeyi yazın
          </p>
        </div>
      )}

      {/* No results */}
      {query && results.length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4 opacity-20">😕</div>
          <p className="text-sm font-medium" style={{ color: '#6f6f6f' }}>
            &ldquo;{query}&rdquo; için sonuç bulunamadı
          </p>
          <p className="text-xs mt-1" style={{ color: '#a2a2a2' }}>
            Farklı bir kelime deneyin
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-semibold"
            style={{ color: '#5d3ebc' }}
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((biz) => (
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
                <span
                  className="absolute top-2 left-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: '#5d3ebc' }}
                >
                  {CATEGORY_LABELS[biz.category] ?? biz.category}
                </span>
                {biz.requiresDeposit && (
                  <span
                    className="absolute bottom-2 left-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: '#16a34a' }}
                  >
                    Kapora
                  </span>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm" style={{ color: '#191919' }}>{biz.name}</h3>
                {biz.description && (
                  <p className="text-xs mt-0.5 line-clamp-1" style={{ color: '#6f6f6f' }}>
                    {biz.description}
                  </p>
                )}
                <p className="text-xs mt-1 truncate" style={{ color: '#8d8d8d' }}>
                  📍 {biz.address}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
