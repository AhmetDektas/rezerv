'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats`, {
        headers: { 'X-Admin-Token': token },
      })

      if (res.ok) {
        sessionStorage.setItem('admin_token', token)
        router.replace('/admin/businesses')
      } else {
        setError('Geçersiz admin token. Tekrar deneyin.')
      }
    } catch {
      setError('Sunucuya bağlanılamadı.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-3"
            style={{ backgroundColor: '#5d3ebc' }}
          >
            R
          </div>
          <h1 className="text-xl font-bold" style={{ color: '#191919' }}>Rezerv Admin</h1>
          <p className="text-sm mt-1" style={{ color: '#a2a2a2' }}>Devam etmek için giriş yapın</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="bg-white rounded-2xl p-6 space-y-4 shadow-sm border border-gray-100">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6f6f6f' }}>
              Admin Token
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full px-4 py-3 text-sm border rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
              style={{ borderColor: '#e2e2e2', color: '#191919' }}
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full py-3 text-sm font-bold rounded-xl text-white transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#5d3ebc' }}
          >
            {loading ? 'Kontrol ediliyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  )
}
