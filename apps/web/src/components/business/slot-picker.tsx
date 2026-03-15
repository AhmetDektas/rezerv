'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { format, addDays, isSameDay } from 'date-fns'
import { tr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@rezerv/utils'

type Slot = {
  id: string
  startTime: string
  endTime: string
  capacity: number
  booked: number
  available: number
  isFull: boolean
}

type Props = {
  business: {
    id: string
    name: string
    requiresDeposit: boolean
    depositType?: string
    depositAmount?: number
    depositPercent?: number
    category: string
  }
}

export function SlotPicker({ business }: Props) {
  const { token, user } = useAuthStore()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)

  const dateStr = format(selectedDate, 'yyyy-MM-dd')

  const { data, isLoading } = useQuery({
    queryKey: ['slots', business.id, dateStr],
    queryFn: () =>
      api.get<{ data: Slot[] }>(`/api/slots/business/${business.id}?date=${dateStr}`, token ?? undefined),
  })

  const slots = data?.data ?? []

  const reserveMutation = useMutation({
    mutationFn: (slotId: string) =>
      api.post(
        '/api/reservations',
        { businessId: business.id, slotId },
        token ?? undefined
      ),
    onSuccess: () => {
      setSelectedSlot(null)
      alert('Rezervasyonunuz oluşturuldu!')
    },
    onError: (err: Error) => {
      alert(err.message)
    },
  })

  // 7 günlük tarih seçici
  const days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), weekOffset * 7 + i))

  return (
    <div className="space-y-5">
      <h2 className="font-semibold text-gray-900">Rezervasyon Yap</h2>

      {/* Tarih Seçici */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setWeekOffset((p) => Math.max(0, p - 1))}
            disabled={weekOffset === 0}
            className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-500 font-medium">
            {format(days[0], 'MMMM yyyy', { locale: tr })}
          </span>
          <button
            onClick={() => setWeekOffset((p) => p + 1)}
            className="p-1.5 rounded-lg hover:bg-gray-100"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const isSelected = isSameDay(day, selectedDate)
            return (
              <button
                key={day.toISOString()}
                onClick={() => {
                  setSelectedDate(day)
                  setSelectedSlot(null)
                }}
                className={cn(
                  'flex flex-col items-center py-2 rounded-xl text-xs transition-colors',
                  isSelected
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'hover:bg-gray-100 text-gray-600'
                )}
              >
                <span className="uppercase">{format(day, 'EEE', { locale: tr })}</span>
                <span className="text-base font-bold mt-0.5">{format(day, 'd')}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Saat Slotları */}
      <div>
        {isLoading ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Bu tarih için müsait saat yok</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {slots.map((slot) => {
              const isSelected = selectedSlot?.id === slot.id
              return (
                <button
                  key={slot.id}
                  disabled={slot.isFull}
                  onClick={() => setSelectedSlot(isSelected ? null : slot)}
                  className={cn(
                    'flex flex-col items-center py-3 rounded-xl border text-sm font-medium transition-all',
                    slot.isFull
                      ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                      : isSelected
                        ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 text-gray-700'
                  )}
                >
                  <span>{slot.startTime}</span>
                  {!slot.isFull && slot.capacity > 1 && (
                    <span className={cn('text-xs mt-0.5', isSelected ? 'text-blue-100' : 'text-gray-400')}>
                      {slot.available} yer
                    </span>
                  )}
                  {slot.isFull && <span className="text-xs mt-0.5">Dolu</span>}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Rezervasyon Özeti ve Butonu */}
      {selectedSlot && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-3">
          <div className="text-sm space-y-1 text-gray-700">
            <div className="flex justify-between">
              <span className="text-gray-500">Tarih</span>
              <span className="font-medium">
                {format(selectedDate, 'd MMMM yyyy', { locale: tr })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Saat</span>
              <span className="font-medium">
                {selectedSlot.startTime} – {selectedSlot.endTime}
              </span>
            </div>
            {business.requiresDeposit && (
              <div className="flex justify-between">
                <span className="text-gray-500">Kaparo</span>
                <span className="font-semibold text-amber-700">
                  {business.depositType === 'FIXED' && business.depositAmount
                    ? formatCurrency(business.depositAmount)
                    : business.depositType === 'PERCENTAGE' && business.depositPercent
                      ? `%${business.depositPercent}`
                      : '—'}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              if (!user) {
                window.location.href = '/auth/login'
                return
              }
              reserveMutation.mutate(selectedSlot.id)
            }}
            disabled={reserveMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
          >
            {reserveMutation.isPending
              ? 'İşleniyor...'
              : business.requiresDeposit
                ? 'Kaparo Öde ve Rezerve Et'
                : 'Rezervasyonu Onayla'}
          </button>
        </div>
      )}
    </div>
  )
}
