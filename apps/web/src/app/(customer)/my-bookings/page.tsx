export default function MyBookingsPage() {
  const bookings = [
    { id: '1', business: 'Lezzet Durağı', date: '20 Mart 2026', time: '19:30', status: 'confirmed', category: '🍽️' },
    { id: '2', business: 'FitZone Gym', date: '22 Mart 2026', time: '10:00', status: 'pending', category: '🏋️' },
    { id: '3', business: 'Diş Kliniği Pro', date: '15 Mart 2026', time: '14:00', status: 'completed', category: '🏥' },
  ]

  const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    confirmed: { label: 'Onaylandı', bg: '#f0fdf4', color: '#188977' },
    pending: { label: 'Beklemede', bg: '#fefce8', color: '#b45309' },
    completed: { label: 'Tamamlandı', bg: '#f4f4f4', color: '#8d8d8d' },
    cancelled: { label: 'İptal', bg: '#fff1ee', color: '#db471e' },
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold" style={{ color: '#191919' }}>Rezervasyonlarım</h1>

      {bookings.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-sm" style={{ color: '#a2a2a2' }}>Henüz rezervasyonunuz yok.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const s = statusConfig[b.status]
            return (
              <div
                key={b.id}
                className="bg-white rounded-2xl p-4 flex items-center justify-between card-shadow"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                    style={{ backgroundColor: '#f3f0fe' }}
                  >
                    {b.category}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#191919' }}>{b.business}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#6f6f6f' }}>{b.date} · {b.time}</p>
                  </div>
                </div>
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ backgroundColor: s.bg, color: s.color }}
                >
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
