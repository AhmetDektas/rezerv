'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Pencil, Power, Trash2, Building2, RefreshCw } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL

type Business = {
  id: string
  name: string
  category: string
  address: string
  phone: string
  email: string
  isActive: boolean
  createdAt: string
  owner: { id: string; name: string; email: string; phone: string } | null
  _count: { reservations: number }
}

const CATEGORY_MAP: Record<string, string> = {
  FOOD_DRINK: '🍽️ Yeme-İçme',
  HEALTH: '🏥 Sağlık',
  SPORTS: '🏋️ Spor',
  VETERINARY: '🐾 Veteriner',
}

export default function AdminBusinessesPage() {
  const router = useRouter()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Record<string, number>>({})

  const getToken = () => sessionStorage.getItem('admin_token') ?? ''

  const fetchData = useCallback(async () => {
    const token = getToken()
    if (!token) { router.replace('/admin/login'); return }

    setLoading(true)
    try {
      const [bizRes, statsRes] = await Promise.all([
        fetch(`${API}/api/admin/businesses`, { headers: { 'X-Admin-Token': token } }),
        fetch(`${API}/api/admin/stats`, { headers: { 'X-Admin-Token': token } }),
      ])

      if (bizRes.status === 401) { router.replace('/admin/login'); return }

      const bizData = await bizRes.json()
      const statsData = await statsRes.json()

      setBusinesses(bizData.data ?? [])
      setStats(statsData.data ?? {})
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { fetchData() }, [fetchData])

  const toggleBusiness = async (id: string) => {
    const token = getToken()
    await fetch(`${API}/api/admin/businesses/${id}/toggle`, {
      method: 'PATCH',
      headers: { 'X-Admin-Token': token },
    })
    fetchData()
  }

  const deleteBusiness = async (id: string, name: string) => {
    if (!confirm(`"${name}" işletmesini devre dışı bırakmak istediğinize emin misiniz?`)) return
    const token = getToken()
    await fetch(`${API}/api/admin/businesses/${id}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Token': token },
    })
    fetchData()
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Toplam İşletme', value: stats.businesses ?? 0, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Aktif İşletme', value: stats.activeBusinesses ?? 0, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Toplam Kullanıcı', value: stats.users ?? 0, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Toplam Rezervasyon', value: stats.reservations ?? 0, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">İşletmeler</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
          <Link
            href="/admin/businesses/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: '#5d3ebc' }}
          >
            <Plus className="w-4 h-4" />
            Yeni İşletme
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Yükleniyor...</div>
        ) : businesses.length === 0 ? (
          <div className="py-16 text-center">
            <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Henüz işletme yok</p>
            <Link
              href="/admin/businesses/new"
              className="mt-3 inline-block text-sm font-semibold"
              style={{ color: '#5d3ebc' }}
            >
              İlk işletmeyi ekle →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">İşletme</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Kategori</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Sahip</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">Rezervasyon</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Durum</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {businesses.map((biz) => (
                  <tr key={biz.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900">{biz.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[180px]">{biz.address}</div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell text-gray-500 text-xs">
                      {CATEGORY_MAP[biz.category] ?? biz.category}
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      {biz.owner ? (
                        <div>
                          <div className="text-gray-700 text-xs font-medium">{biz.owner.name}</div>
                          <div className="text-gray-400 text-xs">{biz.owner.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center hidden sm:table-cell">
                      <span className="text-gray-700 font-semibold">{biz._count.reservations}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                          biz.isActive
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {biz.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/businesses/${biz.id}/edit`}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                          title="Düzenle"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => toggleBusiness(biz.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          style={{ color: biz.isActive ? '#db471e' : '#188977' }}
                          title={biz.isActive ? 'Pasif yap' : 'Aktif yap'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteBusiness(biz.id, biz.name)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                          title="Sil (devre dışı bırak)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
