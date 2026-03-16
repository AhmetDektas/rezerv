'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiRequest } from '@/lib/api'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

interface Category {
  id: string
  name: string
}

const NameField = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="block text-sm font-semibold text-foreground mb-1">
      Hizmet Adı <span className="text-red-500">*</span>
    </label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
      placeholder="Örn: Saç Kesimi"
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
      placeholder="Hizmet hakkında kısa açıklama..."
    />
  </div>
)

const PriceField = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="block text-sm font-semibold text-foreground mb-1">
      Fiyat (₺) <span className="text-red-500">*</span>
    </label>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
      min="0"
      step="0.01"
      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
      placeholder="0.00"
    />
  </div>
)

const DurationField = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="block text-sm font-semibold text-foreground mb-1">Süre (dakika)</label>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      min="5"
      step="5"
      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
      placeholder="30"
    />
  </div>
)

const ImageUrlField = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="block text-sm font-semibold text-foreground mb-1">Görsel URL</label>
    <input
      type="url"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
      placeholder="https://..."
    />
  </div>
)

const OrderField = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="block text-sm font-semibold text-foreground mb-1">Sıralama</label>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      min="0"
      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
      placeholder="0"
    />
  </div>
)

export default function NewServicePage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [duration, setDuration] = useState('30')
  const [imageUrl, setImageUrl] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [order, setOrder] = useState('0')

  useEffect(() => {
    apiRequest<{ categories: Category[] }>('/api/dashboard/categories')
      .then((res) => setCategories(res.categories ?? []))
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await apiRequest('/api/dashboard/services', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description: description || undefined,
          price: parseFloat(price),
          duration: parseInt(duration),
          imageUrl: imageUrl || undefined,
          categoryId: categoryId || undefined,
          order: parseInt(order),
        }),
      })
      router.push('/services')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kaydedilemedi')
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/services" className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">Yeni Hizmet</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl card-shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <NameField value={name} onChange={setName} />
          <DescriptionField value={description} onChange={setDescription} />
          <div className="grid grid-cols-2 gap-4">
            <PriceField value={price} onChange={setPrice} />
            <DurationField value={duration} onChange={setDuration} />
          </div>
          <ImageUrlField value={imageUrl} onChange={setImageUrl} />
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">Kategori</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
            >
              <option value="">Kategori seçin...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <OrderField value={order} onChange={setOrder} />
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-purple text-white text-sm font-semibold hover:bg-brand-purple-dark transition-colors disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <Link
              href="/services"
              className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              İptal
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
