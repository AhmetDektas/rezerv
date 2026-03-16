'use client'

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

function depositLabel(biz: Business): string | null {
  if (!biz.requiresDeposit) return null
  if (biz.depositType === 'FIXED' && biz.depositAmount) return `₺${biz.depositAmount} Kapora`
  if (biz.depositType === 'PERCENTAGE' && biz.depositPercent) return `%${biz.depositPercent} Kapora`
  return 'Kapora'
}

export function BusinessCardCover({
  biz,
  emoji,
}: {
  biz: Business
  emoji: string
}) {
  const badge = depositLabel(biz)

  return (
    <div
      className="relative h-36 overflow-hidden"
      style={{ backgroundColor: '#f3f0fe' }}
    >
      {biz.coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={biz.coverImage}
          alt={biz.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-5xl opacity-20">
          {emoji}
        </div>
      )}

      {/* Logo — sağ alt */}
      {biz.logoUrl && (
        <div className="absolute bottom-2 right-2 w-9 h-9 rounded-xl bg-white shadow overflow-hidden border-2 border-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={biz.logoUrl}
            alt={`${biz.name} logo`}
            className="w-full h-full object-cover"
            onError={(e) => {
              ;(e.target as HTMLImageElement).parentElement!.style.display = 'none'
            }}
          />
        </div>
      )}

      {/* Kapora badge — sol alt */}
      {badge && (
        <span
          className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow"
          style={{ backgroundColor: '#16a34a' }}
        >
          <span className="w-1.5 h-1.5 bg-white rounded-full opacity-80" />
          {badge}
        </span>
      )}
    </div>
  )
}
