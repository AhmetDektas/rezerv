'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, User, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Ana Sayfa', icon: Home },
  { href: '/my-bookings', label: 'Rezervasyonlarım', icon: Calendar },
  { href: '/profile', label: 'Profil', icon: User },
]

export function CustomerNav() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop üst nav — koyu mor Getir tarzı */}
      <header className="hidden sm:flex items-center justify-between px-6 h-14 sticky top-0 z-50" style={{ backgroundColor: '#4c3398' }}>
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-white tracking-tight">
            Rezerv<span style={{ color: '#ffd300' }}>.</span>
          </span>
        </Link>
        <div className="flex items-center gap-1 text-sm text-white/80">
          <MapPin className="w-4 h-4" />
          <span className="font-semibold text-white">İstanbul</span>
        </div>
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors',
                pathname === item.href
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Mobil üst başlık */}
      <header className="sm:hidden flex items-center justify-between px-4 h-12 sticky top-0 z-50" style={{ backgroundColor: '#4c3398' }}>
        <Link href="/" className="text-lg font-bold text-white">
          Rezerv<span style={{ color: '#ffd300' }}>.</span>
        </Link>
        <div className="flex items-center gap-1 text-xs text-white/80">
          <MapPin className="w-3.5 h-3.5" />
          <span className="font-semibold text-white">İstanbul</span>
        </div>
      </header>

      {/* Mobil alt nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 px-5 py-1.5 rounded-xl transition-colors"
              >
                <item.icon
                  className="w-5 h-5"
                  style={{ color: isActive ? '#5d3ebc' : '#a2a2a2' }}
                />
                <span
                  className="text-xs font-semibold"
                  style={{ color: isActive ? '#5d3ebc' : '#a2a2a2' }}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
