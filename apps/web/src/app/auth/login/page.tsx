'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'

interface LoginResp {
  data: {
    token: string
    user: { id: string; name: string; email: string; phone: string; role: 'CUSTOMER' | 'BUSINESS_OWNER' | 'ADMIN'; avatarUrl: string | null }
  }
}

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post<LoginResp>('/api/auth/login', { email, password })
      setAuth(res.data.token, res.data.user)
      router.replace('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Giriş başarısız')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#f7f6fb' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold" style={{ color: '#4c3398' }}>
            Rezerv<span style={{ color: '#ffd300' }}>.</span>
          </Link>
          <p className="text-sm mt-2" style={{ color: '#6f6f6f' }}>Hesabınıza giriş yapın</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6f6f6f' }}>E-posta</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ornek@email.com"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6f6f6f' }}>Şifre</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-60"
              style={{ backgroundColor: '#5d3ebc' }}
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>

          <p className="text-center text-sm mt-5" style={{ color: '#6f6f6f' }}>
            Hesabınız yok mu?{' '}
            <Link href="/auth/register" className="font-semibold" style={{ color: '#5d3ebc' }}>
              Kayıt Ol
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
