'use client'

import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { Plus, Tag, RefreshCw } from 'lucide-react'

interface Campaign {
  id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  isActive: boolean
  discountType?: 'FIXED' | 'PERCENTAGE'
  discountAmount?: number
}

const TitleField = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="block text-sm font-semibold text-foreground mb-1">Başlık *</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
      placeholder="Kampanya başlığı"
    />
  </div>
)

const DescField = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="block text-sm font-semibold text-foreground mb-1">Açıklama</label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={2}
      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 resize-none"
      placeholder="Kampanya açıklaması..."
    />
  </div>
)

const StartDateField = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="block text-sm font-semibold text-foreground mb-1">Başlangıç *</label>
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
    />
  </div>
)

const EndDateField = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="block text-sm font-semibold text-foreground mb-1">Bitiş *</label>
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
    />
  </div>
)

const DiscountAmountField = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="block text-sm font-semibold text-foreground mb-1">İndirim Miktarı</label>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      min="0"
      step="0.01"
      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
      placeholder="0"
    />
  </div>
)

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENTAGE'>('FIXED')
  const [discountAmount, setDiscountAmount] = useState('')

  async function fetchCampaigns() {
    setLoading(true)
    setError('')
    try {
      const res = await apiRequest<{ campaigns: Campaign[] }>('/api/dashboard/campaigns')
      setCampaigns(res.campaigns ?? [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await apiRequest('/api/dashboard/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description: desc || undefined,
          startDate,
          endDate,
          discountType,
          discountAmount: discountAmount ? parseFloat(discountAmount) : undefined,
        }),
      })
      setTitle('')
      setDesc('')
      setStartDate('')
      setEndDate('')
      setDiscountAmount('')
      setShowForm(false)
      await fetchCampaigns()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-foreground">Kampanyalar</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchCampaigns}
            disabled={loading}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-brand-purple transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-purple text-white text-sm font-semibold hover:bg-brand-purple-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Yeni Kampanya
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-xl card-shadow p-6 mb-6">
          <h2 className="font-semibold text-foreground mb-4">Yeni Kampanya Oluştur</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <TitleField value={title} onChange={setTitle} />
            <DescField value={desc} onChange={setDesc} />
            <div className="grid grid-cols-2 gap-4">
              <StartDateField value={startDate} onChange={setStartDate} />
              <EndDateField value={endDate} onChange={setEndDate} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">
                  İndirim Tipi
                </label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as 'FIXED' | 'PERCENTAGE')}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
                >
                  <option value="FIXED">Sabit (₺)</option>
                  <option value="PERCENTAGE">Yüzde (%)</option>
                </select>
              </div>
              <DiscountAmountField value={discountAmount} onChange={setDiscountAmount} />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-purple text-white text-sm font-semibold hover:bg-brand-purple-dark transition-colors disabled:opacity-60"
              >
                {saving ? 'Kaydediliyor...' : 'Oluştur'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-xl card-shadow">
          <Tag className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <div className="text-muted-foreground text-sm">Henüz kampanya oluşturulmamış</div>
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((c) => {
            const now = new Date()
            const start = new Date(c.startDate)
            const end = new Date(c.endDate)
            const isActive = c.isActive && start <= now && end >= now
            return (
              <div key={c.id} className="bg-white rounded-xl card-shadow p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-brand-purple-light flex items-center justify-center flex-shrink-0">
                  <Tag className="w-5 h-5 text-brand-purple" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="font-semibold text-foreground text-sm">{c.title}</div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                  {c.description && (
                    <div className="text-xs text-muted-foreground mb-1">{c.description}</div>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {new Date(c.startDate).toLocaleDateString('tr-TR')} —{' '}
                      {new Date(c.endDate).toLocaleDateString('tr-TR')}
                    </span>
                    {c.discountAmount != null && (
                      <span className="font-medium text-brand-purple">
                        {c.discountType === 'PERCENTAGE'
                          ? `%${c.discountAmount}`
                          : `₺${c.discountAmount}`}{' '}
                        indirim
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
