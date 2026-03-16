import Link from 'next/link';

const categoryData: Record<string, {
  name: string;
  emoji: string;
  description: string;
  businesses: { id: string; name: string; rating: number; reviewCount: number; address: string }[];
}> = {
  food_drink: {
    name: 'Yeme-İçme',
    emoji: '🍽️',
    description: 'Restoran, kafe ve bar rezervasyonları',
    businesses: [
      { id: '1', name: 'Lezzet Durağı', rating: 4.8, reviewCount: 124, address: 'Kadıköy, İstanbul' },
      { id: '2', name: 'Cafe Bohem', rating: 4.5, reviewCount: 89, address: 'Beyoğlu, İstanbul' },
      { id: '3', name: 'Deniz Restaurant', rating: 4.7, reviewCount: 210, address: 'Beşiktaş, İstanbul' },
    ],
  },
  health: {
    name: 'Sağlık',
    emoji: '🏥',
    description: 'Klinik, diş ve psikoloji randevuları',
    businesses: [
      { id: '4', name: 'Sağlık Merkezi Plus', rating: 4.9, reviewCount: 312, address: 'Şişli, İstanbul' },
      { id: '5', name: 'Diş Kliniği Pro', rating: 4.6, reviewCount: 178, address: 'Üsküdar, İstanbul' },
    ],
  },
  sports: {
    name: 'Spor',
    emoji: '🏋️',
    description: 'PT, yoga ve pilates seansları',
    businesses: [
      { id: '6', name: 'FitZone Gym', rating: 4.7, reviewCount: 95, address: 'Bağcılar, İstanbul' },
      { id: '7', name: 'Yoga Studio Om', rating: 4.9, reviewCount: 67, address: 'Nişantaşı, İstanbul' },
    ],
  },
  veterinary: {
    name: 'Veteriner',
    emoji: '🐾',
    description: 'Muayene, tıraş ve konaklama',
    businesses: [
      { id: '8', name: 'PetVet Kliniği', rating: 4.8, reviewCount: 143, address: 'Maltepe, İstanbul' },
      { id: '9', name: 'Happy Paws', rating: 4.6, reviewCount: 88, address: 'Ataşehir, İstanbul' },
    ],
  },
};

type Props = { params: Promise<{ slug: string }> };

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = categoryData[slug];

  if (!category) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 text-lg">Kategori bulunamadı.</p>
        <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
          Ana sayfaya dön
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-4xl">{category.emoji}</span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{category.name}</h1>
          <p className="text-gray-500 text-sm">{category.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {category.businesses.map((biz) => (
          <Link
            key={biz.id}
            href={`/businesses/${biz.id}`}
            className="block bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-gray-800">{biz.name}</h2>
                <p className="text-xs text-gray-400 mt-1">{biz.address}</p>
              </div>
              <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2 py-1 rounded-lg">
                ⭐ {biz.rating}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-3">{biz.reviewCount} değerlendirme</p>
            <div className="mt-4 w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-xl text-center hover:bg-blue-700 transition-colors">
              Rezervasyon Yap
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
