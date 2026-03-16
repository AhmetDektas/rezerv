import { CategoryGrid } from '@/components/shared/category-grid'
import { FeaturedBusinesses } from '@/components/shared/featured-businesses'
import { SearchBar } from '@/components/shared/search-bar'

export default function HomePage() {
  return (
    <div className="space-y-6 py-4">
      {/* Search */}
      <SearchBar />

      {/* Kategoriler */}
      <section>
        <h2 className="text-base font-bold mb-3" style={{ color: '#191919' }}>Kategoriler</h2>
        <CategoryGrid />
      </section>

      {/* Popüler İşletmeler */}
      <section>
        <h2 className="text-base font-bold mb-3" style={{ color: '#191919' }}>Popüler İşletmeler</h2>
        <FeaturedBusinesses />
      </section>
    </div>
  )
}
