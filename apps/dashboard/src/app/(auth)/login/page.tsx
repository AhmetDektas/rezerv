'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiRequest } from '@/lib/api'
import { Store } from 'lucide-react'

interface Business {
  id: string
  name: string
  category: string
}

interface LoginResponse {
  token: string
  user: { id: string; name: string; email: string; role: string }
}

interface MeResponse {
  user: { id: string; email: string; name: string }
  businesses: Business[]
}

const EmailField = ({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) => (
  <div>
    <label className="block text-sm font-semibold text-foreground mb-1">E-posta</label>
    <input
      type="email"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
      placeholder="isletme@email.com"
      autoComplete="email"
    />
  </div>
)

const PasswordField = ({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) => (
  <div>
    <label className="block text-sm font-semibold text-foreground mb-1">Şifre</label>
    <input
      type="password"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
      placeholder="••••••••"
      autoComplete="current-password"
    />
  </div>
)

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [token, setToken] = useState('')
  const [step, setStep] = useState<'login' | 'select'>('login')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // Use the shared auth login endpoint
      const res = await apiRequest<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      // Fetch businesses for this user
      const meRes = await apiRequest<MeResponse>('/api/dashboard/me', {
        headers: { Authorization: `Bearer ${res.token}` },
      })
      setToken(res.token)
      const bizList = meRes.businesses ?? []
      if (bizList.length === 1) {
        const biz = bizList[0]
        sessionStorage.setItem('dashboard_token', res.token)
        sessionStorage.setItem('dashboard_business_id', biz.id)
        sessionStorage.setItem('dashboard_business_name', biz.name)
        router.replace('/dashboard')
      } else if (bizList.length > 1) {
        setBusinesses(bizList)
        setStep('select')
      } else {
        setError('Bu hesaba bağlı işletme bulunamadı. İşletme sahibi hesabıyla giriş yapın.')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Giriş başarısız')
    } finally {
      setLoading(false)
    }
  }

  function handleSelectBusiness(biz: Business) {
    sessionStorage.setItem('dashboard_token', token)
    sessionStorage.setItem('dashboard_business_id', biz.id)
    sessionStorage.setItem('dashboard_business_name', biz.name)
    router.replace('/dashboard')
  }

  return (
    <div className="min-h-screen bg-brand-purple-light flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-purple mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Rezerv İşletme Paneli</h1>
          <p className="text-muted-foreground mt-1">İşletme hesabınıza giriş yapın</p>
        </div>

        <div className="bg-white rounded-2xl card-shadow p-8">
          {step === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <EmailField value={email} onChange={setEmail} />
              <PasswordField value={password} onChange={setPassword} />

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-brand-purple text-white font-semibold text-sm hover:bg-brand-purple-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Giriş yapılıyor...
                  </span>
                ) : (
                  'Giriş Yap'
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">İşletme Seçin</h2>
              <p className="text-sm text-muted-foreground">
                Birden fazla işletmeniz var. Yönetmek istediğiniz işletmeyi seçin.
              </p>
              <div className="space-y-2">
                {businesses.map((biz) => (
                  <button
                    key={biz.id}
                    onClick={() => handleSelectBusiness(biz)}
                    className="w-full text-left px-4 py-3 border border-border rounded-xl hover:border-brand-purple hover:bg-brand-purple-light transition-all flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-lg bg-brand-purple-light flex items-center justify-center flex-shrink-0">
                      <Store className="w-5 h-5 text-brand-purple" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-sm">{biz.name}</div>
                      <div className="text-xs text-muted-foreground">{biz.category}</div>
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep('login')}
                className="text-sm text-brand-purple hover:underline"
              >
                Geri dön
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
