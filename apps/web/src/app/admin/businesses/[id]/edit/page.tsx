'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL

type FormData = {
  name: string
  description: string
  address: string
  lat: string
  lng: string
  phone: string
  email: string
  isActive: boolean
}

export default function EditBusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [form, setForm] = useState<FormData | null>(null)
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
            name: biz.name,
            description: biz.description ?? '',
            address: biz.address,
            lat: String(biz.lat ?? ''),
            lng: String(biz.lng ?? ''),
            phone: biz.phone,
            email: biz.email,
            isActive: biz.isActive,
          })
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

    const body: Record<string, unknown> = {
      name: form.name,
      description: form.description || undefined,
      address: form.address,
      lat: parseFloat(form.lat) || undefined,
      lng: parseFloat(form.lng) || undefined,
      phone: form.phone,
      email: form.email,
      isActive: form.isActive,
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

  if (loading) {
    return <div className="py-16 text-center text-gray-400 text-sm">Yükleniyor...</div>
  }

  if (!form) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-500 text-sm">İşletme bulunamadı.</p>
        <Link href="/admin/businesses" className="mt-3 inline-block text-sm font-semibold" style={{ color: '#5d3ebc' }}>
          Geri dön
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto">
            <Check className="w-7 h-7 text-green-600" />
          </div>
          <p className="font-semibold text-gray-900">Güncellendi!</p>
        </div>
      </div>
    )
  }

  const Field = ({
    label, field, type = 'text', placeholder,
  }: { label: string; field: keyof Omit<FormData, 'isActive'>; type?: string; placeholder?: string }) => (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6f6f6f' }}>{label}</label>
      <input
        type={type}
        value={form[field] as string}
        onChange={(e) => set(field, e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none transition-colors"
        style={{ borderColor: '#e2e2e2', color: '#191919' }}
        onFocus={(e) => (e.currentTarget.style.borderColor = '#5d3ebc')}
        onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e2e2')}
      />
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
        <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-4">
          <Field label="İşletme Adı" field="name" />
          <Field label="Açıklama" field="description" />
          <Field label="Adres" field="address" />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Enlem" field="lat" />
            <Field label="Boylam" field="lng" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Telefon" field="phone" />
            <Field label="E-posta" field="email" type="email" />
          </div>

          {/* isActive toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm font-semibold text-gray-700">Aktif Durum</div>
              <div className="text-xs text-gray-400 mt-0.5">Pasif işletmeler listede görünmez</div>
            </div>
            <button
              type="button"
              onClick={() => set('isActive', !form.isActive)}
              className={`relative w-12 h-6 rounded-full transition-colors ${form.isActive ? '' : 'bg-gray-200'}`}
              style={form.isActive ? { backgroundColor: '#5d3ebc' } : {}}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-7' : 'translate-x-1'}`}
              />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 text-sm font-bold rounded-xl text-white transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#5d3ebc' }}
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
