'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { ArrowLeft, Check, Plus, X } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL

// ─── Field component defined OUTSIDE to prevent remount on every keystroke ───
function Field({
  label, value, onChange, type = 'text', placeholder, required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 text-gray-500">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors text-gray-900"
      />
    </div>
  )
}

function ImageUrlField({
  label, value, onChange, placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 text-gray-500">{label}</label>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'https://i.imgur.com/...'}
        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors text-gray-900"
      />
      {value && (
        <div className="mt-2 h-24 rounded-xl overflow-hidden bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="önizleme" className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }} />
        </div>
      )}
    </div>
  )
}

type FormData = {
  name: string; category: string; description: string
  address: string; lat: string; lng: string; phone: string; email: string
  coverImage: string; logoUrl: string
  requiresDeposit: boolean; depositType: string
  depositAmount: string; depositPercent: string
  ownerName: string; ownerEmail: string; ownerPhone: string; ownerPassword: string
}

const EMPTY: FormData = {
  name: '', category: 'FOOD_DRINK', description: '',
  address: '', lat: '', lng: '', phone: '', email: '',
  coverImage: '', logoUrl: '',
  requiresDeposit: false, depositType: 'FIXED',
  depositAmount: '', depositPercent: '',
  ownerName: '', ownerEmail: '', ownerPhone: '', ownerPassword: '',
}

export default function NewBusinessPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(EMPTY)
  const [extraImages, setExtraImages] = useState<string[]>([''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const set = (k: keyof FormData, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const token = sessionStorage.getItem('admin_token') ?? ''

    const body: Record<string, unknown> = {
      name: form.name,
      category: form.category,
      address: form.address,
      lat: parseFloat(form.lat) || 41.0082,
      lng: parseFloat(form.lng) || 28.9784,
      phone: form.phone,
      email: form.email,
    }
    if (form.description) body.description = form.description
    if (form.coverImage) body.coverImage = form.coverImage
    if (form.logoUrl) body.logoUrl = form.logoUrl
    const validExtras = extraImages.filter((u) => u.trim())
    if (validExtras.length) body.images = validExtras

    if (form.requiresDeposit) {
      body.requiresDeposit = true
      body.depositType = form.depositType
      if (form.depositType === 'FIXED' && form.depositAmount)
        body.depositAmount = parseFloat(form.depositAmount)
      if (form.depositType === 'PERCENTAGE' && form.depositPercent)
        body.depositPercent = parseFloat(form.depositPercent)
    }

    if (form.ownerEmail) {
      body.ownerEmail = form.ownerEmail
      if (form.ownerName) body.ownerName = form.ownerName
      if (form.ownerPhone) body.ownerPhone = form.ownerPhone
      if (form.ownerPassword) body.ownerPassword = form.ownerPassword
    }

    try {
      const res = await fetch(`${API}/api/admin/businesses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
        body: JSON.stringify(body),
      })
      if (res.status === 401) { router.replace('/admin/login'); return }
      const data = await res.json()
      if (!res.ok) {
        const errMsg = typeof data.error === 'string'
          ? data.error
          : data.message ?? JSON.stringify(data.error ?? data)
        setError(errMsg)
      } else {
        setSuccess(true)
        setTimeout(() => router.push('/admin/businesses'), 1500)
      }
    } catch {
      setError('Sunucuya bağlanılamadı.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto">
            <Check className="w-7 h-7 text-green-600" />
          </div>
          <p className="font-semibold text-gray-900">İşletme oluşturuldu!</p>
          <p className="text-sm text-gray-500">Listeye yönlendiriliyorsunuz...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/businesses" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h2 className="text-lg font-bold text-gray-900">Yeni İşletme Ekle</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* İşletme Bilgileri */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-4">
          <h3 className="font-semibold text-sm text-gray-700">İşletme Bilgileri</h3>
          <Field label="İşletme Adı" value={form.name} onChange={(v) => set('name', v)} placeholder="Örn: Lezzet Durağı" required />

          <div>
            <label className="block text-xs font-semibold mb-1.5 text-gray-500">Kategori <span className="text-red-500">*</span></label>
            <select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors bg-white text-gray-900"
            >
              <option value="FOOD_DRINK">🍽️ Yeme-İçme</option>
              <option value="HEALTH">🏥 Sağlık</option>
              <option value="SPORTS">🏋️ Spor</option>
              <option value="VETERINARY">🐾 Veteriner</option>
            </select>
          </div>

          <Field label="Açıklama" value={form.description} onChange={(v) => set('description', v)} placeholder="Kısa açıklama (opsiyonel)" />
          <Field label="Adres" value={form.address} onChange={(v) => set('address', v)} placeholder="Tam adres" required />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Enlem (lat)" value={form.lat} onChange={(v) => set('lat', v)} placeholder="41.0082" />
            <Field label="Boylam (lng)" value={form.lng} onChange={(v) => set('lng', v)} placeholder="28.9784" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Telefon" value={form.phone} onChange={(v) => set('phone', v)} placeholder="05XX XXX XX XX" required />
            <Field label="E-posta" value={form.email} onChange={(v) => set('email', v)} type="email" placeholder="isletme@email.com" required />
          </div>
        </div>

        {/* Kapora Ayarları */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-4">
          <h3 className="font-semibold text-sm text-gray-700">Kapora Ayarları</h3>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => set('requiresDeposit', !form.requiresDeposit)}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${form.requiresDeposit ? 'bg-purple-600' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.requiresDeposit ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-700">Kapora al</div>
              <div className="text-xs text-gray-400">Rezervasyon onayı için ön ödeme istenir</div>
            </div>
          </label>

          {form.requiresDeposit && (
            <div className="space-y-3 pl-2 border-l-2 border-purple-100">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-500">Kapora Türü</label>
                <div className="flex gap-2">
                  {[
                    { value: 'FIXED', label: 'Sabit Tutar (₺)' },
                    { value: 'PERCENTAGE', label: 'Yüzde (%)' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set('depositType', opt.value)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                        form.depositType === opt.value
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {form.depositType === 'FIXED' ? (
                <Field
                  label="Kapora Tutarı (₺)"
                  value={form.depositAmount}
                  onChange={(v) => set('depositAmount', v)}
                  type="number"
                  placeholder="Örn: 100"
                />
              ) : (
                <Field
                  label="Kapora Oranı (%)"
                  value={form.depositPercent}
                  onChange={(v) => set('depositPercent', v)}
                  type="number"
                  placeholder="Örn: 20"
                />
              )}
            </div>
          )}
        </div>

        {/* Fotoğraflar */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-4">
          <div>
            <h3 className="font-semibold text-sm text-gray-700">Fotoğraflar</h3>
            <p className="text-xs text-gray-400 mt-0.5">Imgur veya başka bir servise yükleyip URL'yi yapıştırın</p>
          </div>
          <ImageUrlField label="Kapak Görseli URL" value={form.coverImage} onChange={(v) => set('coverImage', v)} />
          <ImageUrlField label="Logo URL" value={form.logoUrl} onChange={(v) => set('logoUrl', v)} />

          <div>
            <label className="block text-xs font-semibold mb-2 text-gray-500">Ek Fotoğraflar</label>
            <div className="space-y-2">
              {extraImages.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => {
                      const next = [...extraImages]
                      next[i] = e.target.value
                      setExtraImages(next)
                    }}
                    placeholder={`Fotoğraf ${i + 1} URL`}
                    className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors text-gray-900"
                  />
                  {extraImages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setExtraImages(extraImages.filter((_, j) => j !== i))}
                      className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {extraImages.length < 5 && (
              <button
                type="button"
                onClick={() => setExtraImages([...extraImages, ''])}
                className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-purple-600"
              >
                <Plus className="w-3.5 h-3.5" /> Fotoğraf Ekle
              </button>
            )}
          </div>
        </div>

        {/* Sahip Bilgileri */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-4">
          <div>
            <h3 className="font-semibold text-sm text-gray-700">İşletme Sahibi</h3>
            <p className="text-xs text-gray-400 mt-0.5">Boş bırakırsanız sistem kullanıcısına atanır</p>
          </div>
          <Field label="Sahip Adı" value={form.ownerName} onChange={(v) => set('ownerName', v)} placeholder="Ad Soyad" />
          <Field label="Sahip E-postası" value={form.ownerEmail} onChange={(v) => set('ownerEmail', v)} type="email" placeholder="sahip@email.com" />
          <Field label="Sahip Telefonu" value={form.ownerPhone} onChange={(v) => set('ownerPhone', v)} placeholder="05XX XXX XX XX" />
          <Field label="İşletme Paneli Şifresi" value={form.ownerPassword} onChange={(v) => set('ownerPassword', v)} type="password" placeholder="Boş bırakırsanız rastgele oluşturulur" />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 text-sm font-bold rounded-xl text-white bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Oluşturuluyor...' : 'İşletme Oluştur'}
          </button>
          <Link
            href="/admin/businesses"
            className="px-6 py-3 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            İptal
          </Link>
        </div>
      </form>
    </div>
  )
}
