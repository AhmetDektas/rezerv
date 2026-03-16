import Link from 'next/link'

const categoryData: Record<string, {
  name: string; emoji: string; description: string
  businesses: { id: string; name: string; rating: number; reviewCount: number; address: string }[]
}> = {
  food_drink: {
    name: 'Yeme-İçme', emoji: '🍽️', description: 'Restoran, kafe ve bar rezervasyonları',
    businesses: [
      { id: '1', name: 'Lezzet Durağı', rating: 4.8, reviewCount: 124, address: 'Kadıköy, İstanbul' },
      { id: '2', name: 'Cafe Bohem', rating: 4.5, reviewCount: 89, address: 'Beyoğlu, İstanbul' },
      { id: '3', name: 'Deniz Restaurant', rating: 4.7, reviewCount: 210, address: 'Beşiktaş, İstanbul' },
    ],
  },
  health: {
    name: 'Sağlık', emoji: '🏥', description: 'Klinik, diş ve psikoloji randevuları',
    businesses: [
      { id: '4', name: 'Sağlık Merkezi Plus', rating: 4.9, reviewCount: 312, address: 'Şişli, İstanbul' },
      { id: '5', name: 'Diş Kliniği Pro', rating: 4.6, reviewCount: 178, address: 'Üsküdar, İstanbul' },
    ],
  },
  sports: {
    name: 'Spor', emoji: '🏋️', description: 'PT, yoga ve pilates seansları',
    businesses: [
      { id: '6', name: 'FitZone Gym', rating: 4.7, reviewCount: 95, address: 'Bağcılar, İstanbul' },
      { id: '7', name: 'Yoga Studio Om', rating: 4.9, reviewCount: 67, address: 'Nişantaşı, İstanbul' },
    ],
  },
  veterinary: {
    name: 'Veteriner', emoji: '🐾', description: 'Muayene, tıraş ve konaklama',
    businesses: [
      { id: '8', name: 'PetVet Kliniği', rating: 4.8, reviewCount: 143, address: 'Maltepe, İstanbul' },
      { id: '9', name: 'Happy Paws', rating: 4.6, reviewCount: 88, address: 'Ataşehir, İstanbul' },
    ],
  },
}

type Props = { params: Promise<{ slug: string }> }

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params
  const category = categoryData[slug]

  if (!category) {
    return (
      <div className="text-center py-20">
        <p className="text-sm" style={{ color: '#a2a2a2' }}>Kategori bulunamadı.</p>
        <Link href="/" className="mt-4 inline-block text-sm font-semibold" style={{ color: '#5d3ebc' }}>
          Ana sayfaya dön
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Başlık */}
      <div className="flex items-center gap-3">
        <span className="text-4xl">{category.emoji}</span>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#191919' }}>{category.name}</h1>
          <p className="text-xs mt-0.5" style={{ color: '#a2a2a2' }}>{category.description}</p>
        </div>
      </div>

      {/* İşletme Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {category.businesses.map((biz) => (
          <Link
            key={biz.id}
            href={`/businesses/${biz.id}`}
            className="block bg-white rounded-2xl overflow-hidden card-shadow"
          >
            {/* Placeholder görseli */}
            <div className="h-28 flex items-center justify-center text-4xl opacity-30" style={{ backgroundColor: '#f3f0fe' }}>
              {category.emoji}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-sm leading-tight" style={{ color: '#5d3ebc' }}>{biz.name}</h2>
                <span
                  className="shrink-0 text-xs font-bold px-2 py-0.5 rounded"
                  style={{ backgroundColor: '#ffffff', color: '#5d3ebc', border: '1px solid #dbdbff' }}
                >
                  ⭐ {biz.rating}
                </span>
              </div>
              <p className="text-xs mt-1" style={{ color: '#6f6f6f' }}>{biz.address}</p>
              <p className="text-xs mt-1" style={{ color: '#8d8d8d' }}>{biz.reviewCount} değerlendirme</p>
              <div
                className="mt-3 w-full text-center text-xs font-semibold py-2.5 rounded-xl transition-colors"
                style={{ backgroundColor: '#5d3ebc', color: '#ffffff' }}
              >
                Rezervasyon Yap
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
