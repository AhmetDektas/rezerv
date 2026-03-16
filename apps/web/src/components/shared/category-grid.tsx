import Link from 'next/link'
import { CATEGORIES } from '@rezerv/types'

export function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {CATEGORIES.map((cat) => (
        <Link
          key={cat.id}
          href={`/categories/${cat.id.toLowerCase()}`}
          className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl cursor-pointer transition-all group"
          style={{
            boxShadow: 'rgba(93, 62, 188, 0.04) 0px 6px 24px 0px',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = 'rgba(93, 62, 188, 0.12) 0px 8px 32px 0px'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = 'rgba(93, 62, 188, 0.04) 0px 6px 24px 0px'
          }}
        >
          <span className="text-3xl">{cat.emoji}</span>
          <div className="text-center">
            <div className="font-semibold text-sm" style={{ color: '#5d3ebc' }}>{cat.label}</div>
            <div className="text-xs mt-0.5" style={{ color: '#a2a2a2' }}>{cat.description}</div>
          </div>
        </Link>
      ))}
    </div>
  )
}
