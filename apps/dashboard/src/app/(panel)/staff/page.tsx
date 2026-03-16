'use client'

import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { Users, UserPlus, Trash2, RefreshCw } from 'lucide-react'

interface StaffMember {
  id: string
  name: string
  email: string
  role: string
}

const InviteEmailField = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="block text-sm font-semibold text-foreground mb-1">E-posta</label>
    <input
      type="email"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
      placeholder="personel@email.com"
    />
  </div>
)

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('STAFF')
  const [removingId, setRemovingId] = useState<string | null>(null)

  async function fetchStaff() {
    setLoading(true)
    setError('')
    try {
      const res = await apiRequest<{ staff: StaffMember[] }>('/api/dashboard/staff')
      setStaff(res.staff ?? [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    setError('')
    try {
      await apiRequest('/api/dashboard/staff/invite', {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      setInviteEmail('')
      await fetchStaff()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Davet gönderilemedi')
    } finally {
      setInviting(false)
    }
  }

  async function handleRemove(id: string) {
    if (!confirm('Bu personeli çıkarmak istediğinizden emin misiniz?')) return
    setRemovingId(id)
    try {
      await apiRequest(`/api/dashboard/staff/${id}`, { method: 'DELETE' })
      await fetchStaff()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'İşlem başarısız')
    } finally {
      setRemovingId(null)
    }
  }

  async function handleRoleChange(id: string, newRole: string) {
    try {
      await apiRequest(`/api/dashboard/staff/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      })
      await fetchStaff()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Rol güncellenemedi')
    }
  }

  const roleLabels: Record<string, string> = {
    OWNER: 'Sahip',
    MANAGER: 'Yönetici',
    STAFF: 'Personel',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-foreground">Personel</h1>
        <button
          onClick={fetchStaff}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-brand-purple transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Staff list */}
      <div className="bg-white rounded-xl card-shadow mb-6">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Mevcut Personel</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
          </div>
        ) : staff.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <div className="text-muted-foreground text-sm">Henüz personel eklenmemiş</div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {staff.map((s) => (
              <div key={s.id} className="px-6 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-purple-light flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-purple font-bold text-sm">
                    {s.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground text-sm">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.email}</div>
                </div>
                <select
                  value={s.role}
                  onChange={(e) => handleRoleChange(s.id, e.target.value)}
                  disabled={s.role === 'OWNER'}
                  className="px-2 py-1.5 border border-border rounded-lg text-xs bg-white focus:outline-none focus:border-brand-purple disabled:opacity-60 disabled:bg-muted"
                >
                  <option value="OWNER">Sahip</option>
                  <option value="MANAGER">Yönetici</option>
                  <option value="STAFF">Personel</option>
                </select>
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {roleLabels[s.role] ?? s.role}
                </span>
                {s.role !== 'OWNER' && (
                  <button
                    onClick={() => handleRemove(s.id)}
                    disabled={removingId === s.id}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
                    title="Personeli çıkar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite form */}
      <div className="bg-white rounded-xl card-shadow p-6">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-brand-purple" />
          Personel Davet Et
        </h2>
        <form onSubmit={handleInvite} className="space-y-4">
          <InviteEmailField value={inviteEmail} onChange={setInviteEmail} />
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">Rol</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
            >
              <option value="MANAGER">Yönetici</option>
              <option value="STAFF">Personel</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={inviting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-purple text-white text-sm font-semibold hover:bg-brand-purple-dark transition-colors disabled:opacity-60"
          >
            <UserPlus className="w-4 h-4" />
            {inviting ? 'Gönderiliyor...' : 'Davet Gönder'}
          </button>
        </form>
      </div>
    </div>
  )
}
