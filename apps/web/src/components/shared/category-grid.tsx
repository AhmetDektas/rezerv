import Link from 'next/link'
import { CATEGORIES } from '@rezerv/types'

export function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {CATEGORIES.map((cat) => (
        <Link
          key={cat.id}
          href={`/categories/${cat.id.toLowerCase()}`}
          className="flex flex-col items-center gap-3 p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group"
        >
          <span className="text-4xl">{cat.emoji}</span>
          <div className="text-center">
            <div className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
              {cat.label}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{cat.description}</div>
          </div>
        </Link>
      ))}
    </div>
  )
}
