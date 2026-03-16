'use client'

import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { Save, AlertCircle, Clock } from 'lucide-react'
import Link from 'next/link'

interface BusinessProfile {
  id: string
  name: string
  description?: string
  phone?: string
  email?: string
  address?: string
  logoUrl?: string
  coverImage?: string
}

interface ChangeRequest {
  id: string
  field: string
  currentValue?: string
  newValue: string
  status: string
  createdAt: string
}

const PhoneField = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="block text-sm font-semibold text-foreground mb-1">Telefon</label>
    <input
      type="tel"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
      placeholder="+90 555 000 00 00"
    />
  </div>
)

const EmailField = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="block text-sm font-semibold text-foreground mb-1">E-posta</label>
    <input
      type="email"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
      placeholder="isletme@email.com"
    />
  </div>
)

const LogoUrlField = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="block text-sm font-semibold text-foreground mb-1">Logo URL</label>
    <input
      type="url"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
      placeholder="https://..."
    />
  </div>
)

const CoverImageField = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="block text-sm font-semibold text-foreground mb-1">Kapak Görseli URL</label>
    <input
      type="url"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
      placeholder="https://..."
    />
  </div>
)

const DescriptionField = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="block text-sm font-semibold text-foreground mb-1">Açıklama</label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 resize-none"
      placeholder="İşletme hakkında kısa bir açıklama..."
    />
  </div>
)

const NewNameField = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="block text-sm font-semibold text-foreground mb-1">Yeni İşletme Adı</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
    />
  </div>
)

const NewAddressField = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="block text-sm font-semibold text-foreground mb-1">Yeni Adres</label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={2}
      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 resize-none"
    />
  </div>
)

export default function ProfilePage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [requestSaving, setRequestSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [description, setDescription] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [coverImage, setCoverImage] = useState('')

  const [newName, setNewName] = useState('')
  const [newAddress, setNewAddress] = useState('')

  async function fetchProfile() {
    setLoading(true)
    try {
      const [biz, crRes] = await Promise.all([
        apiRequest<BusinessProfile>('/api/dashboard/profile'),
        apiRequest<ChangeRequest[]>('/api/dashboard/profile/change-requests').catch(() => []),
      ])
      setProfile(biz)
      setPhone(biz.phone ?? '')
      setEmail(biz.email ?? '')
      setDescription(biz.description ?? '')
      setLogoUrl(biz.logoUrl ?? '')
      setCoverImage(biz.coverImage ?? '')
      setChangeRequests(Array.isArray(crRes) ? crRes : [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Profil yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  async function handleSaveInstant(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await apiRequest('/api/dashboard/profile', {
        method: 'PATCH',
        body: JSON.stringify({ phone, email, description, logoUrl, coverImage }),
      })
      setSuccess('Profil güncellendi.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Güncelleme başarısız')
    } finally {
      setSaving(false)
    }
  }

  async function handleChangeRequest(field: string, newValue: string) {
    if (!newValue.trim()) return
    setRequestSaving(true)
    setError('')
    try {
      await apiRequest('/api/dashboard/profile/change-request', {
        method: 'POST',
        body: JSON.stringify({ field, newValue }),
      })
      setSuccess('Değişiklik talebi gönderildi.')
      if (field === 'name') setNewName('')
      if (field === 'address') setNewAddress('')
      await fetchProfile()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Talep gönderilemedi')
    } finally {
      setRequestSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-foreground">İşletme Profili</h1>
        <Link
          href="/profile/hours"
          className="text-sm text-brand-purple hover:underline flex items-center gap-1"
        >
          <Clock className="w-4 h-4" />
          Çalışma Saatleri
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm mb-4">
          {success}
        </div>
      )}

      {/* Instant update section */}
      <div className="bg-white rounded-xl card-shadow p-6 mb-6">
        <h2 className="font-semibold text-foreground mb-1">Anlık Güncelleme</h2>
        <p className="text-xs text-muted-foreground mb-4">Bu alandaki değişiklikler hemen geçerli olur.</p>
        <form onSubmit={handleSaveInstant} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <PhoneField value={phone} onChange={setPhone} />
            <EmailField value={email} onChange={setEmail} />
          </div>
          <DescriptionField value={description} onChange={setDescription} />
          <LogoUrlField value={logoUrl} onChange={setLogoUrl} />
          <CoverImageField value={coverImage} onChange={setCoverImage} />
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-purple text-white text-sm font-semibold hover:bg-brand-purple-dark transition-colors disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </form>
      </div>

      {/* Change request section */}
      <div className="bg-white rounded-xl card-shadow p-6 mb-6">
        <h2 className="font-semibold text-foreground mb-1">Onay Gerektiren Değişiklikler</h2>
        <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2.5 mb-4">
          <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-orange-700">
            İşletme adı ve adres değişiklikleri admin onayı gerektirir. Talebiniz incelendikten sonra uygulanacaktır.
          </p>
        </div>
        <div className="space-y-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              Mevcut ad: <span className="font-medium text-foreground">{profile?.name}</span>
            </div>
            <NewNameField value={newName} onChange={setNewName} />
            <button
              onClick={() => handleChangeRequest('name', newName)}
              disabled={requestSaving || !newName.trim()}
              className="mt-2 px-4 py-2 rounded-lg bg-orange-100 text-orange-700 text-sm font-medium hover:bg-orange-200 transition-colors disabled:opacity-60"
            >
              Ad Değişikliği Talep Et
            </button>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              Mevcut adres:{' '}
              <span className="font-medium text-foreground">{profile?.address ?? '—'}</span>
            </div>
            <NewAddressField value={newAddress} onChange={setNewAddress} />
            <button
              onClick={() => handleChangeRequest('address', newAddress)}
              disabled={requestSaving || !newAddress.trim()}
              className="mt-2 px-4 py-2 rounded-lg bg-orange-100 text-orange-700 text-sm font-medium hover:bg-orange-200 transition-colors disabled:opacity-60"
            >
              Adres Değişikliği Talep Et
            </button>
          </div>
        </div>
      </div>

      {/* Pending requests */}
      {changeRequests.length > 0 && (
        <div className="bg-white rounded-xl card-shadow p-6">
          <h2 className="font-semibold text-foreground mb-4">Bekleyen Talepler</h2>
          <div className="space-y-3">
            {changeRequests.map((req) => (
              <div key={req.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <Clock className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground capitalize">{req.field}</div>
                  <div className="text-xs text-muted-foreground truncate">{req.newValue}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {new Date(req.createdAt).toLocaleDateString('tr-TR')}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700 flex-shrink-0">
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
