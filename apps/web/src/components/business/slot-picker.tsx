'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, addDays, isSameDay } from 'date-fns'
import { tr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Clock, CreditCard, CheckCircle } from 'lucide-react'
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
  const queryClient = useQueryClient()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [pendingPayment, setPendingPayment] = useState<{ paymentId: string; amount: number; label: string } | null>(null)
  const [payConfirming, setPayConfirming] = useState(false)

  const dateStr = format(selectedDate, 'yyyy-MM-dd')

  const { data, isLoading } = useQuery({
    queryKey: ['slots', business.id, dateStr],
    queryFn: () =>
      api.get<{ data: Slot[] }>(`/api/slots/business/${business.id}?date=${dateStr}`, token ?? undefined),
  })

  const slots = data?.data ?? []

  const reserveMutation = useMutation({
    mutationFn: (slotId: string) =>
      api.post<{ data: { id: string; status: string } }>(
        '/api/reservations',
        { businessId: business.id, slotId },
        token ?? undefined
      ),
    onSuccess: async (res) => {
      const reservation = res.data
      setSelectedSlot(null)
      setErrorMsg('')
      // Slotları yenile — dolu olan slot UI'da hemen güncellenir
      queryClient.invalidateQueries({ queryKey: ['slots', business.id, dateStr] })
      // If deposit required, initiate payment
      if (business.requiresDeposit && reservation.status === 'PENDING') {
        try {
          const payRes = await api.post<{ data: { paymentId: string; amount: number; label: string } }>(
            '/api/payments/initiate',
            { reservationId: reservation.id },
            token ?? undefined
          )
          setPendingPayment(payRes.data)
        } catch {
          setSuccessMsg('Rezervasyonunuz alındı! Kapora ödeme bağlantısı yakında gelecek.')
        }
      } else {
        setSuccessMsg('Rezervasyonunuz onaylandı! 🎉')
        setTimeout(() => setSuccessMsg(''), 6000)
      }
    },
    onError: (err: Error) => {
      setErrorMsg(err.message || 'Rezervasyon oluşturulamadı')
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
                    ? 'text-white font-semibold'
                    : 'hover:bg-gray-100 text-gray-600'
                )}
                style={isSelected ? { backgroundColor: '#5d3ebc' } : {}}
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
                        ? 'text-white shadow-md border-transparent'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50'
                  )}
                  style={!slot.isFull && isSelected ? { backgroundColor: '#5d3ebc' } : {}}
                >
                  <span>{slot.startTime}</span>
                  {!slot.isFull && slot.capacity > 1 && (
                    <span className={cn('text-xs mt-0.5', isSelected ? 'text-purple-100' : 'text-gray-400')}>
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

      {/* Kapora Ödeme Adımı */}
      {pendingPayment && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-600" />
            <span className="font-semibold text-amber-800 text-sm">Kapora Ödemesi Gerekli</span>
          </div>
          <div className="flex justify-between text-sm text-amber-700">
            <span>Kapora Tutarı</span>
            <span className="font-bold">₺{pendingPayment.amount.toLocaleString('tr-TR')}</span>
          </div>
          <p className="text-xs text-amber-600">
            Rezervasyonunuzu onaylamak için kapora ödemesi yapmanız gerekmektedir.
          </p>
          <button
            disabled={payConfirming}
            onClick={async () => {
              setPayConfirming(true)
              try {
                await api.post('/api/payments/mock-confirm', { paymentId: pendingPayment.paymentId }, token ?? undefined)
                setPendingPayment(null)
                setSuccessMsg('Ödeme alındı! Rezervasyonunuz onaylandı. 🎉')
                setTimeout(() => setSuccessMsg(''), 6000)
              } catch (err: Error | unknown) {
                setErrorMsg(err instanceof Error ? err.message : 'Ödeme başarısız')
              } finally {
                setPayConfirming(false)
              }
            }}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 text-sm flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            {payConfirming ? 'İşleniyor...' : `₺${pendingPayment.amount.toLocaleString('tr-TR')} Kapora Öde`}
          </button>
        </div>
      )}

      {/* Başarı / Hata Mesajı */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
          <span className="text-green-600 text-sm font-medium">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-center justify-between gap-2">
          <span className="text-red-600 text-sm">{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-red-400 hover:text-red-600 text-xs font-bold shrink-0">✕</button>
        </div>
      )}

      {/* Rezervasyon Özeti ve Butonu */}
      {selectedSlot && (
        <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: '#f3f0fe', border: '1px solid #e0d9fc' }}>
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
                <span className="text-gray-500">Kapora</span>
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
            className="w-full text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
            style={{ backgroundColor: '#5d3ebc' }}
          >
            {reserveMutation.isPending
              ? 'İşleniyor...'
              : business.requiresDeposit
                ? 'Kapora Öde ve Rezerve Et'
                : 'Rezervasyonu Onayla'}
          </button>
        </div>
      )}
    </div>
  )
}
