import Link from 'next/link'

export function PromoBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl" style={{ background: 'linear-gradient(135deg, #5d3ebc 0%, #7849f7 60%, #4c3398 100%)' }}>
      {/* Dekoratif daireler */}
      <div
        className="absolute -right-8 -top-8 w-36 h-36 rounded-full opacity-20"
        style={{ backgroundColor: '#ffffff' }}
      />
      <div
        className="absolute -right-2 bottom-0 w-24 h-24 rounded-full opacity-10"
        style={{ backgroundColor: '#ffd300' }}
      />

      <div className="relative px-5 py-5 flex items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div
            className="inline-block text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: '#ffd300', color: '#191919' }}
          >
            🎉 YENİ
          </div>
          <h2 className="text-lg font-bold text-white leading-tight">
            Rezervasyon artık<br />çok kolay!
          </h2>
          <p className="text-xs text-white/70">
            Restoran, sağlık, spor ve daha fazlası
          </p>
        </div>

        <div className="shrink-0 flex flex-col items-center gap-2">
          <div className="text-4xl">📅</div>
          <Link
            href="/categories/food_drink"
            className="text-xs font-bold px-4 py-2 rounded-xl whitespace-nowrap"
            style={{ backgroundColor: '#ffffff', color: '#5d3ebc' }}
          >
            Hemen Keşfet
          </Link>
        </div>
      </div>
    </div>
  )
}
