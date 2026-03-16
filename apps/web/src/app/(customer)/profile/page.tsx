'use client'

import { useState, useEffect } from 'react'
import { User, Mail, Phone, Edit3, LogOut, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'

export default function ProfilePage() {
  const { user, token, setAuth, logout } = useAuthStore()
  const router = useRouter()

  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login')
      return
    }
    setName(user.name)
    setPhone(user.phone)
  }, [user, router])

  if (!user) return null

  async function handleSave() {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await api.patch<{ data: typeof user }>(
        '/api/auth/profile',
        { name, phone },
        token ?? undefined
      )
      if (res.data && token) {
        setAuth(token, res.data as NonNullable<typeof user>)
      }
      setSuccess('Profil güncellendi.')
      setIsEditing(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Güncelleme başarısız')
    } finally {
      setSaving(false)
    }
  }

  function handleLogout() {
    logout()
    router.push('/')
  }

  return (
    <div className="max-w-lg mx-auto space-y-4 py-2">
      <h1 className="text-xl font-bold" style={{ color: '#191919' }}>Profilim</h1>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Avatar Kartı */}
      <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}>
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
            style={{ backgroundColor: '#5d3ebc' }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate" style={{ color: '#191919' }}>{user.name}</p>
            <p className="text-xs mt-0.5 truncate" style={{ color: '#a2a2a2' }}>{user.email}</p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="shrink-0 p-2 rounded-xl transition-colors"
              style={{ backgroundColor: '#f3f0fe', color: '#5d3ebc' }}
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Bilgi / Düzenleme Kartı */}
      <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}>
        {isEditing ? (
          <>
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: '#6f6f6f' }}>Ad Soyad</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#a2a2a2' }} />
                <input
                  className="w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl focus:outline-none transition-colors"
                  style={{ borderColor: '#e2e2e2', color: '#191919', fontFamily: 'inherit' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#5d3ebc')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e2e2')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: '#6f6f6f' }}>Telefon</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#a2a2a2' }} />
                <input
                  type="tel"
                  className="w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl focus:outline-none transition-colors"
                  style={{ borderColor: '#e2e2e2', color: '#191919', fontFamily: 'inherit' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#5d3ebc')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e2e2')}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl text-white transition-colors disabled:opacity-60"
                style={{ backgroundColor: '#5d3ebc' }}
              >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
              <button
                onClick={() => {
                  setName(user.name)
                  setPhone(user.phone)
                  setIsEditing(false)
                  setError('')
                }}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors"
                style={{ backgroundColor: '#f4f4f4', color: '#3e3e3e' }}
              >
                İptal
              </button>
            </div>
          </>
        ) : (
          <>
            {[
              { label: 'Ad Soyad', value: user.name, icon: User },
              { label: 'E-posta', value: user.email, icon: Mail },
              { label: 'Telefon', value: user.phone, icon: Phone },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#f3f0fe' }}>
                  <Icon className="w-4 h-4" style={{ color: '#5d3ebc' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs" style={{ color: '#a2a2a2' }}>{label}</p>
                  <p className="text-sm font-semibold truncate" style={{ color: '#191919' }}>{value}</p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Quick links */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}>
        <Link
          href="/my-bookings"
          className="flex items-center gap-3 px-5 py-4 border-b transition-colors hover:bg-gray-50"
          style={{ borderColor: '#f4f4f4' }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f3f0fe' }}>
            <Calendar className="w-4 h-4" style={{ color: '#5d3ebc' }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: '#191919' }}>Rezervasyonlarım</span>
          <span className="ml-auto text-xs" style={{ color: '#a2a2a2' }}>›</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-5 py-4 transition-colors hover:bg-red-50"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#fff1ee' }}>
            <LogOut className="w-4 h-4" style={{ color: '#db471e' }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: '#db471e' }}>Çıkış Yap</span>
        </button>
      </div>
    </div>
  )
}
