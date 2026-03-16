'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'

interface RegisterResp {
  data: {
    token: string
    user: { id: string; name: string; email: string; phone: string; role: 'CUSTOMER' | 'BUSINESS_OWNER' | 'ADMIN'; avatarUrl: string | null }
  }
}

export default function RegisterPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post<RegisterResp>('/api/auth/register', form)
      setAuth(res.data.token, res.data.user)
      router.replace('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#f7f6fb' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold" style={{ color: '#4c3398' }}>
            Rezerv<span style={{ color: '#ffd300' }}>.</span>
          </Link>
          <p className="text-sm mt-2" style={{ color: '#6f6f6f' }}>Yeni hesap oluşturun</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            {([
              { key: 'name', label: 'Ad Soyad', type: 'text', placeholder: 'Adınız Soyadınız' },
              { key: 'email', label: 'E-posta', type: 'email', placeholder: 'ornek@email.com' },
              { key: 'phone', label: 'Telefon', type: 'tel', placeholder: '05XX XXX XX XX' },
              { key: 'password', label: 'Şifre', type: 'password', placeholder: 'En az 6 karakter' },
            ] as const).map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6f6f6f' }}>{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                  required
                  placeholder={placeholder}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            ))}

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-60"
              style={{ backgroundColor: '#5d3ebc' }}
            >
              {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
            </button>
          </form>

          <p className="text-center text-sm mt-5" style={{ color: '#6f6f6f' }}>
            Zaten hesabınız var mı?{' '}
            <Link href="/auth/login" className="font-semibold" style={{ color: '#5d3ebc' }}>
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
