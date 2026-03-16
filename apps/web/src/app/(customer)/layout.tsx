import { CustomerNav } from '@/components/shared/customer-nav'

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      <CustomerNav />
      <main className="max-w-7xl mx-auto px-4 pb-24 pt-4 sm:pb-6">{children}</main>
    </div>
  )
}
