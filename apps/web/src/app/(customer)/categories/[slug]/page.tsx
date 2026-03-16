import Link from 'next/link'

const SLUG_TO_CATEGORY: Record<string, string> = {
  food_drink: 'FOOD_DRINK',
  health: 'HEALTH',
  sports: 'SPORTS',
  veterinary: 'VETERINARY',
}

const CATEGORY_META: Record<string, { name: string; emoji: string; description: string }> = {
  FOOD_DRINK:  { name: 'Yeme-İçme',  emoji: '🍽️', description: 'Restoran, kafe ve bar rezervasyonları' },
  HEALTH:      { name: 'Sağlık',     emoji: '🏥', description: 'Klinik, diş ve psikoloji randevuları' },
  SPORTS:      { name: 'Spor',       emoji: '🏋️', description: 'PT, yoga ve pilates seansları' },
  VETERINARY:  { name: 'Veteriner',  emoji: '🐾', description: 'Muayene, tıraş ve konaklama' },
}

type Business = {
  id: string
  name: string
  slug: string
  category: string
  description: string | null
  address: string
  coverImage: string | null
  logoUrl: string | null
  requiresDeposit: boolean
  depositType: string | null
  depositAmount: number | null
  depositPercent: number | null
}

type Props = { params: Promise<{ slug: string }> }

async function getBusinesses(category: string): Promise<Business[]> {
  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/businesses?category=${category}&limit=50`
    const res = await fetch(url, { next: { revalidate: 60 } })
    if (!res.ok) return []
    const data = await res.json()
    return data.data ?? []
  } catch {
    return []
  }
}

function depositLabel(biz: Business): string | null {
  if (!biz.requiresDeposit) return null
  if (biz.depositType === 'FIXED' && biz.depositAmount) return `₺${biz.depositAmount} Kapora`
  if (biz.depositType === 'PERCENTAGE' && biz.depositPercent) return `%${biz.depositPercent} Kapora`
  return 'Kapora'
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params
  const categoryKey = SLUG_TO_CATEGORY[slug]
  const meta = categoryKey ? CATEGORY_META[categoryKey] : null

  if (!meta || !categoryKey) {
    return (
      <div className="text-center py-20">
        <p className="text-sm" style={{ color: '#a2a2a2' }}>Kategori bulunamadı.</p>
        <Link href="/" className="mt-4 inline-block text-sm font-semibold" style={{ color: '#5d3ebc' }}>
          Ana sayfaya dön
        </Link>
      </div>
    )
  }

  const businesses = await getBusinesses(categoryKey)
  const label = depositLabel

  return (
    <div className="space-y-5">
      {/* Başlık */}
      <div className="flex items-center gap-3">
        <span className="text-4xl">{meta.emoji}</span>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#191919' }}>{meta.name}</h1>
          <p className="text-xs mt-0.5" style={{ color: '#a2a2a2' }}>{meta.description}</p>
        </div>
      </div>

      {/* Boş durum */}
      {businesses.length === 0 && (
        <div className="py-16 text-center">
          <div className="text-5xl mb-4 opacity-20">{meta.emoji}</div>
          <p className="text-sm font-medium" style={{ color: '#6f6f6f' }}>Bu kategoride henüz işletme yok</p>
          <p className="text-xs mt-1" style={{ color: '#a2a2a2' }}>Yakında yeni işletmeler eklenecek</p>
        </div>
      )}

      {/* İşletme Kartları */}
      {businesses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {businesses.map((biz) => {
            const badge = label(biz)
            return (
              <Link
                key={biz.id}
                href={`/businesses/${biz.slug}`}
                className="block bg-white rounded-2xl overflow-hidden card-shadow"
              >
                {/* Kapak Görseli */}
                <div
                  className="relative h-36 overflow-hidden"
                  style={{ backgroundColor: '#f3f0fe' }}
                >
                  {biz.coverImage ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={biz.coverImage}
                      alt={biz.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl opacity-20">
                      {meta.emoji}
                    </div>
                  )}

                  {/* Logo — sağ alt */}
                  {biz.logoUrl && (
                    <div
                      className="absolute bottom-2 right-2 w-9 h-9 rounded-xl bg-white shadow overflow-hidden border-2 border-white"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={biz.logoUrl}
                        alt={`${biz.name} logo`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).parentElement!.style.display = 'none'
                        }}
                      />
                    </div>
                  )}

                  {/* Kapora badge — sol alt */}
                  {badge && (
                    <span className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow"
                      style={{ backgroundColor: '#16a34a' }}>
                      <span className="w-1.5 h-1.5 bg-white rounded-full opacity-80" />
                      {badge}
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <h2 className="font-semibold text-sm leading-tight" style={{ color: '#191919' }}>{biz.name}</h2>
                  {biz.description && (
                    <p className="text-xs mt-0.5 line-clamp-1" style={{ color: '#6f6f6f' }}>{biz.description}</p>
                  )}
                  <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: '#8d8d8d' }}>
                    <span>📍</span>
                    <span className="truncate">{biz.address}</span>
                  </p>
                  <div
                    className="mt-3 w-full text-center text-xs font-semibold py-2.5 rounded-xl"
                    style={{ backgroundColor: '#5d3ebc', color: '#ffffff' }}
                  >
                    Rezervasyon Yap
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
