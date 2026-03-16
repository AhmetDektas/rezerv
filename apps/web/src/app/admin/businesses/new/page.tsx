'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL

type FormData = {
  name: string
  category: string
  description: string
  address: string
  lat: string
  lng: string
  phone: string
  email: string
  ownerName: string
  ownerEmail: string
  ownerPhone: string
}

const EMPTY: FormData = {
  name: '', category: 'FOOD_DRINK', description: '',
  address: '', lat: '', lng: '', phone: '', email: '',
  ownerName: '', ownerEmail: '', ownerPhone: '',
}

export default function NewBusinessPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const set = (k: keyof FormData, v: string) => setForm((f) => ({ ...f, [k]: v }))

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
    if (form.ownerEmail) {
      body.ownerEmail = form.ownerEmail
      if (form.ownerName) body.ownerName = form.ownerName
      if (form.ownerPhone) body.ownerPhone = form.ownerPhone
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
        setError(data.error ?? `Hata: ${res.status}`)
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

  const Field = ({
    label, field, type = 'text', placeholder, required,
  }: { label: string; field: keyof FormData; type?: string; placeholder?: string; required?: boolean }) => (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6f6f6f' }}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={form[field]}
        onChange={(e) => set(field, e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none transition-colors"
        style={{ borderColor: '#e2e2e2', color: '#191919' }}
        onFocus={(e) => (e.currentTarget.style.borderColor = '#5d3ebc')}
        onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e2e2')}
      />
    </div>
  )

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

          <Field label="İşletme Adı" field="name" placeholder="Örn: Lezzet Durağı" required />

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6f6f6f' }}>
              Kategori <span className="text-red-500">*</span>
            </label>
            <select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              className="w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none transition-colors bg-white"
              style={{ borderColor: '#e2e2e2', color: '#191919' }}
            >
              <option value="FOOD_DRINK">🍽️ Yeme-İçme</option>
              <option value="HEALTH">🏥 Sağlık</option>
              <option value="SPORTS">🏋️ Spor</option>
              <option value="VETERINARY">🐾 Veteriner</option>
            </select>
          </div>

          <Field label="Açıklama" field="description" placeholder="Kısa açıklama (opsiyonel)" />
          <Field label="Adres" field="address" placeholder="Tam adres" required />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Enlem (lat)" field="lat" placeholder="41.0082" />
            <Field label="Boylam (lng)" field="lng" placeholder="28.9784" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Telefon" field="phone" placeholder="05XX XXX XX XX" required />
            <Field label="E-posta" field="email" type="email" placeholder="isletme@email.com" required />
          </div>
        </div>

        {/* Sahip Bilgileri */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-4">
          <div>
            <h3 className="font-semibold text-sm text-gray-700">İşletme Sahibi</h3>
            <p className="text-xs text-gray-400 mt-0.5">Boş bırakırsanız sistem kullanıcısına atanır</p>
          </div>

          <Field label="Sahip Adı" field="ownerName" placeholder="Ad Soyad" />
          <Field label="Sahip E-postası" field="ownerEmail" type="email" placeholder="sahip@email.com" />
          <Field label="Sahip Telefonu" field="ownerPhone" placeholder="05XX XXX XX XX" />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 text-sm font-bold rounded-xl text-white transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#5d3ebc' }}
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
