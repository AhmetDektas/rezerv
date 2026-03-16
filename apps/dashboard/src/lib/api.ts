const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export function getToken() {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem('dashboard_token')
}

export function getBusinessId() {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem('dashboard_business_id')
}

export function setAuth(token: string, businessId: string) {
  sessionStorage.setItem('dashboard_token', token)
  sessionStorage.setItem('dashboard_business_id', businessId)
}

export function clearAuth() {
  sessionStorage.removeItem('dashboard_token')
  sessionStorage.removeItem('dashboard_business_id')
  sessionStorage.removeItem('dashboard_business_name')
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const businessId = getBusinessId()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(businessId ? { 'X-Business-Id': businessId } : {}),
      ...options.headers,
    },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
  // Unwrap { data: ... } envelope if present
  return (json.data !== undefined ? json.data : json) as T
}
