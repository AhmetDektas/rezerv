'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Users } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL

type User = {
  id: string
  name: string
  email: string
  phone: string
  role: string
  createdAt: string
  _count: { businesses: number; reservations: number }
}

const ROLE_MAP: Record<string, { label: string; className: string }> = {
  CUSTOMER: { label: 'Müşteri', className: 'bg-blue-50 text-blue-700' },
  BUSINESS_OWNER: { label: 'İşletme Sahibi', className: 'bg-purple-50 text-purple-700' },
  ADMIN: { label: 'Admin', className: 'bg-red-50 text-red-700' },
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = useCallback(async () => {
    const token = sessionStorage.getItem('admin_token') ?? ''
    if (!token) { router.replace('/admin/login'); return }

    setLoading(true)
    try {
      const res = await fetch(`${API}/api/admin/users`, {
        headers: { 'X-Admin-Token': token },
      })
      if (res.status === 401) { router.replace('/admin/login'); return }
      const data = await res.json()
      setUsers(data.data ?? [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Kullanıcılar</h2>
        <button
          onClick={fetchUsers}
          className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Yükleniyor...</div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Kullanıcı yok</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Kullanıcı</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">Telefon</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Rol</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">İşletme</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Rezervasyon</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Kayıt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => {
                  const role = ROLE_MAP[u.role] ?? { label: u.role, className: 'bg-gray-100 text-gray-600' }
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900">{u.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{u.email}</div>
                      </td>
                      <td className="px-4 py-4 text-gray-500 text-xs hidden sm:table-cell">{u.phone}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${role.className}`}>
                          {role.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-gray-700 font-semibold hidden md:table-cell">
                        {u._count.businesses}
                      </td>
                      <td className="px-4 py-4 text-center text-gray-700 font-semibold hidden md:table-cell">
                        {u._count.reservations}
                      </td>
                      <td className="px-5 py-4 text-right text-xs text-gray-400 hidden lg:table-cell">
                        {new Date(u.createdAt).toLocaleDateString('tr-TR')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
