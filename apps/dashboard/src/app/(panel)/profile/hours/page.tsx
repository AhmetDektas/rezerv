'use client'

import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface DayHours {
  day: string
  dayLabel: string
  isClosed: boolean
  openTime: string
  closeTime: string
}

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Pazartesi',
  TUESDAY: 'Salı',
  WEDNESDAY: 'Çarşamba',
  THURSDAY: 'Perşembe',
  FRIDAY: 'Cuma',
  SATURDAY: 'Cumartesi',
  SUNDAY: 'Pazar',
}

const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

function defaultHours(): DayHours[] {
  return DAY_ORDER.map((day) => ({
    day,
    dayLabel: DAY_LABELS[day],
    isClosed: day === 'SUNDAY',
    openTime: '09:00',
    closeTime: '18:00',
  }))
}

export default function HoursPage() {
  const [hours, setHours] = useState<DayHours[]>(defaultHours())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function fetchHours() {
      setLoading(true)
      try {
        const res = await apiRequest<{ hours?: Record<string, { isClosed?: boolean; openTime?: string; closeTime?: string }> }>(
          '/api/dashboard/profile'
        )
        if (res.hours) {
          setHours(
            DAY_ORDER.map((day) => ({
              day,
              dayLabel: DAY_LABELS[day],
              isClosed: res.hours?.[day]?.isClosed ?? (day === 'SUNDAY'),
              openTime: res.hours?.[day]?.openTime ?? '09:00',
              closeTime: res.hours?.[day]?.closeTime ?? '18:00',
            }))
          )
        }
      } catch {
        // keep defaults
      } finally {
        setLoading(false)
      }
    }
    fetchHours()
  }, [])

  function updateDay(index: number, field: keyof DayHours, value: string | boolean) {
    setHours((prev) =>
      prev.map((h, i) => (i === index ? { ...h, [field]: value } : h))
    )
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const body: Record<string, { isClosed: boolean; openTime: string; closeTime: string }> = {}
      hours.forEach((h) => {
        body[h.day] = { isClosed: h.isClosed, openTime: h.openTime, closeTime: h.closeTime }
      })
      await apiRequest('/api/dashboard/hours', {
        method: 'PUT',
        body: JSON.stringify(body),
      })
      setSuccess('Çalışma saatleri güncellendi.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Güncelleme başarısız')
    } finally {
      setSaving(false)
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
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/profile"
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">Çalışma Saatleri</h1>
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

      <form onSubmit={handleSave}>
        <div className="bg-white rounded-xl card-shadow overflow-hidden mb-4">
          <div className="px-6 py-3 bg-muted/30 border-b border-border grid grid-cols-12 gap-4">
            <div className="col-span-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Gün</div>
            <div className="col-span-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kapalı</div>
            <div className="col-span-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Açılış</div>
            <div className="col-span-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kapanış</div>
          </div>
          <div className="divide-y divide-border">
            {hours.map((h, i) => (
              <div key={h.day} className="px-6 py-3 grid grid-cols-12 gap-4 items-center">
                <div className="col-span-3 font-medium text-foreground text-sm">{h.dayLabel}</div>
                <div className="col-span-2">
                  <button
                    type="button"
                    onClick={() => updateDay(i, 'isClosed', !h.isClosed)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      h.isClosed ? 'bg-red-400' : 'bg-brand-purple'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                        h.isClosed ? 'translate-x-1' : 'translate-x-4'
                      }`}
                    />
                  </button>
                </div>
                <div className="col-span-3">
                  <input
                    type="time"
                    value={h.openTime}
                    onChange={(e) => updateDay(i, 'openTime', e.target.value)}
                    disabled={h.isClosed}
                    className="w-full px-2 py-1.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 disabled:opacity-40 disabled:bg-muted"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="time"
                    value={h.closeTime}
                    onChange={(e) => updateDay(i, 'closeTime', e.target.value)}
                    disabled={h.isClosed}
                    className="w-full px-2 py-1.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 disabled:opacity-40 disabled:bg-muted"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

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
  )
}
