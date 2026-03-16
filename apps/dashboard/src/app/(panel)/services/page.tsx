'use client'

import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { Plus, Scissors, ToggleLeft, ToggleRight } from 'lucide-react'
import Link from 'next/link'

interface Service {
  id: string
  name: string
  description?: string
  price: number
  duration: number
  isActive: boolean
  category?: { name: string }
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [togglingId, setTogglingId] = useState<string | null>(null)

  async function fetchServices() {
    setLoading(true)
    setError('')
    try {
      const res = await apiRequest<{ services: Service[] }>('/api/dashboard/services')
      setServices(res.services ?? [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  async function toggleActive(service: Service) {
    setTogglingId(service.id)
    try {
      await apiRequest(`/api/dashboard/services/${service.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !service.isActive }),
      })
      await fetchServices()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'İşlem başarısız')
    } finally {
      setTogglingId(null)
    }
  }

  // Group by category
  const grouped: Record<string, Service[]> = {}
  services.forEach((s) => {
    const cat = s.category?.name ?? 'Diğer'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(s)
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-foreground">Hizmetler</h1>
        <Link
          href="/services/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-purple text-white text-sm font-semibold hover:bg-brand-purple-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Hizmet
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
        </div>
      ) : services.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-xl card-shadow">
          <Scissors className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <div className="text-muted-foreground text-sm mb-4">Henüz hizmet eklenmemiş</div>
          <Link
            href="/services/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-purple text-white text-sm font-semibold hover:bg-brand-purple-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            İlk Hizmeti Ekle
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {cat}
              </h2>
              <div className="bg-white rounded-xl card-shadow overflow-hidden">
                <div className="divide-y divide-border">
                  {items.map((s) => (
                    <div
                      key={s.id}
                      className={`px-6 py-4 flex items-center gap-4 ${!s.isActive ? 'opacity-50' : ''}`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-brand-purple-light flex items-center justify-center flex-shrink-0">
                        <Scissors className="w-5 h-5 text-brand-purple" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground text-sm">{s.name}</div>
                        {s.description && (
                          <div className="text-xs text-muted-foreground truncate">{s.description}</div>
                        )}
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {s.duration} dk
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-brand-purple">
                        ₺{s.price.toLocaleString('tr-TR')}
                      </div>
                      <button
                        onClick={() => toggleActive(s)}
                        disabled={togglingId === s.id}
                        className="transition-colors disabled:opacity-60"
                        title={s.isActive ? 'Pasif yap' : 'Aktif yap'}
                      >
                        {s.isActive ? (
                          <ToggleRight className="w-6 h-6 text-brand-purple" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
