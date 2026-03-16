export default function MyBookingsPage() {
  const bookings = [
    { id: '1', business: 'Lezzet Durağı', date: '20 Mart 2026', time: '19:30', status: 'confirmed', category: '🍽️' },
    { id: '2', business: 'FitZone Gym', date: '22 Mart 2026', time: '10:00', status: 'pending', category: '🏋️' },
    { id: '3', business: 'Diş Kliniği Pro', date: '15 Mart 2026', time: '14:00', status: 'completed', category: '🏥' },
  ];

  const statusLabel: Record<string, { label: string; class: string }> = {
    confirmed: { label: 'Onaylandı', class: 'bg-green-50 text-green-600' },
    pending: { label: 'Beklemede', class: 'bg-yellow-50 text-yellow-600' },
    completed: { label: 'Tamamlandı', class: 'bg-gray-50 text-gray-500' },
    cancelled: { label: 'İptal', class: 'bg-red-50 text-red-500' },
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Rezervasyonlarım</h1>

      {bookings.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">Henüz rezervasyonunuz yok.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{b.category}</span>
                <div>
                  <p className="font-semibold text-gray-800">{b.business}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{b.date} — {b.time}</p>
                </div>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusLabel[b.status].class}`}>
                {statusLabel[b.status].label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
