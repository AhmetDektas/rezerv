'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, User } from 'lucide-react'
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
      {/* Desktop üst nav */}
      <header className="hidden sm:flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100 sticky top-0 z-50">
        <Link href="/" className="text-xl font-bold text-gray-900">
          Rezerv<span className="text-blue-600">.</span>
        </Link>
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                pathname === item.href
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Mobil alt nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 safe-area-bottom">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-5 py-1.5 rounded-xl transition-colors',
                  isActive ? 'text-blue-600' : 'text-gray-400'
                )}
              >
                <item.icon className={cn('w-5 h-5', isActive && 'fill-blue-100')} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
