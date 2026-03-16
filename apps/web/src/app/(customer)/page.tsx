import { CategoryGrid } from '@/components/shared/category-grid'
import { SearchBar } from '@/components/shared/search-bar'
import { PromoBanner } from '@/components/shared/promo-banner'

export default function HomePage() {
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
    </div>
  )
}
