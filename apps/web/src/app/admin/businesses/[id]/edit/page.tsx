'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { ArrowLeft, Check, Plus, X } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL

// ─── Field components defined OUTSIDE to prevent remount on every keystroke ───
function Field({
  label, value, onChange, type = 'text', placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 text-gray-500">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors text-gray-900"
      />
    </div>
  )
}

function ImageUrlField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 text-gray-500">{label}</label>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://i.imgur.com/..."
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
  name: string; description: string; address: string
  lat: string; lng: string; phone: string; email: string
  coverImage: string; logoUrl: string; isActive: boolean
  requiresDeposit: boolean; depositType: string
  depositAmount: string; depositPercent: string
}

export default function EditBusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [form, setForm] = useState<FormData | null>(null)
  const [extraImages, setExtraImages] = useState<string[]>([''])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const token = sessionStorage.getItem('admin_token') ?? ''
    if (!token) { router.replace('/admin/login'); return }

    fetch(`${API}/api/admin/businesses`, { headers: { 'X-Admin-Token': token } })
      .then((r) => r.json())
      .then((d) => {
        const biz = d.data?.find((b: { id: string }) => b.id === id)
        if (biz) {
          setForm({
            name: biz.name, description: biz.description ?? '',
            address: biz.address,
            lat: String(biz.lat ?? ''), lng: String(biz.lng ?? ''),
            phone: biz.phone, email: biz.email,
            coverImage: biz.coverImage ?? '', logoUrl: biz.logoUrl ?? '',
            isActive: biz.isActive,
            requiresDeposit: biz.requiresDeposit ?? false,
            depositType: biz.depositType ?? 'FIXED',
            depositAmount: String(biz.depositAmount ?? ''),
            depositPercent: String(biz.depositPercent ?? ''),
          })
          setExtraImages(biz.images?.length > 0 ? biz.images : [''])
        }
      })
      .catch(() => setError('Veri yüklenemedi'))
      .finally(() => setLoading(false))
  }, [id, router])

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm((f) => f ? { ...f, [k]: v } : f)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    setError('')
    const token = sessionStorage.getItem('admin_token') ?? ''
    const validExtras = extraImages.filter((u) => u.trim())

    const body: Record<string, unknown> = {
      name: form.name,
      description: form.description || undefined,
      address: form.address,
      lat: parseFloat(form.lat) || undefined,
      lng: parseFloat(form.lng) || undefined,
      phone: form.phone,
      email: form.email,
      coverImage: form.coverImage || null,
      logoUrl: form.logoUrl || null,
      images: validExtras,
      isActive: form.isActive,
      requiresDeposit: form.requiresDeposit,
    }

    if (form.requiresDeposit) {
      body.depositType = form.depositType
      if (form.depositType === 'FIXED' && form.depositAmount)
        body.depositAmount = parseFloat(form.depositAmount)
      if (form.depositType === 'PERCENTAGE' && form.depositPercent)
        body.depositPercent = parseFloat(form.depositPercent)
    }

    try {
      const res = await fetch(`${API}/api/admin/businesses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
        body: JSON.stringify(body),
      })
      if (res.status === 401) { router.replace('/admin/login'); return }
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? `Hata: ${res.status}`)
      } else {
        setSuccess(true)
        setTimeout(() => router.push('/admin/businesses'), 1500)
      }
    } catch {
      setError('Sunucuya bağlanılamadı.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="py-16 text-center text-gray-400 text-sm">Yükleniyor...</div>
  if (!form) return (
    <div className="py-16 text-center">
      <p className="text-gray-500 text-sm">İşletme bulunamadı.</p>
      <Link href="/admin/businesses" className="mt-3 inline-block text-sm font-semibold text-purple-600">Geri dön</Link>
    </div>
  )
  if (success) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto">
          <Check className="w-7 h-7 text-green-600" />
        </div>
        <p className="font-semibold text-gray-900">Güncellendi!</p>
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/businesses" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h2 className="text-lg font-bold text-gray-900">İşletme Düzenle</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Temel Bilgiler */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-4">
          <h3 className="font-semibold text-sm text-gray-700">Temel Bilgiler</h3>
          <Field label="İşletme Adı" value={form.name} onChange={(v) => set('name', v)} />
          <Field label="Açıklama" value={form.description} onChange={(v) => set('description', v)} />
          <Field label="Adres" value={form.address} onChange={(v) => set('address', v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Enlem" value={form.lat} onChange={(v) => set('lat', v)} />
            <Field label="Boylam" value={form.lng} onChange={(v) => set('lng', v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Telefon" value={form.phone} onChange={(v) => set('phone', v)} />
            <Field label="E-posta" value={form.email} onChange={(v) => set('email', v)} type="email" />
          </div>

          {/* isActive toggle */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <div className="text-sm font-semibold text-gray-700">Aktif Durum</div>
              <div className="text-xs text-gray-400 mt-0.5">Pasif işletmeler listede görünmez</div>
            </div>
            <button
              type="button"
              onClick={() => set('isActive', !form.isActive)}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.isActive ? 'bg-purple-600' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
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
            <p className="text-xs text-gray-400 mt-0.5">Imgur vb. servise yükleyip URL'yi yapıştırın</p>
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

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 text-sm font-bold rounded-xl text-white bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
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
