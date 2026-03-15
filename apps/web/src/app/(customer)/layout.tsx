import { CustomerNav } from '@/components/shared/customer-nav'

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNav />
      <main className="max-w-7xl mx-auto px-4 pb-24 pt-4 sm:pb-4">{children}</main>
    </div>
  )
}
