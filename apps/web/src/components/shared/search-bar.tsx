'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#a2a2a2' }} />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="İşletme veya kategori ara..."
        className="w-full pl-11 pr-4 py-3 bg-white border text-sm focus:outline-none transition-shadow"
        style={{
          borderColor: '#e2e2e2',
          borderRadius: '12px',
          boxShadow: 'rgba(93, 62, 188, 0.04) 0px 4px 16px 0px',
          color: '#191919',
          fontFamily: 'inherit',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#5d3ebc'
          e.currentTarget.style.boxShadow = 'rgba(93, 62, 188, 0.12) 0px 4px 16px 0px'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#e2e2e2'
          e.currentTarget.style.boxShadow = 'rgba(93, 62, 188, 0.04) 0px 4px 16px 0px'
        }}
      />
    </form>
  )
}
