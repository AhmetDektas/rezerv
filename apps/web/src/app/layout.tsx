import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/shared/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Rezerv — Kolay Rezervasyon',
    template: '%s | Rezerv',
  },
  description: 'Restoran, sağlık, spor ve veteriner rezervasyonlarınızı kolayca yapın.',
  keywords: ['rezervasyon', 'online randevu', 'restoran rezervasyonu', 'veteriner randevu'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
