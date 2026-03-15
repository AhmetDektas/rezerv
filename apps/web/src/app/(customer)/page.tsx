import { CategoryGrid } from '@/components/shared/category-grid'
import { FeaturedBusinesses } from '@/components/shared/featured-businesses'
import { SearchBar } from '@/components/shared/search-bar'

export default function HomePage() {
  return (
    <div className="space-y-8 py-6">
      {/* Hero */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-gray-900">
          Rezerv<span className="text-blue-600">.</span>
        </h1>
        <p className="text-gray-500 text-lg">Kolay rezervasyon, sıfır bekleme</p>
        <SearchBar />
      </div>

      {/* Kategoriler */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Kategoriler</h2>
        <CategoryGrid />
      </section>

      {/* Öne Çıkan İşletmeler */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Popüler İşletmeler</h2>
        <FeaturedBusinesses />
      </section>
    </div>
  )
}
