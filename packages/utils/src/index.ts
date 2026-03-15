// ─── Slug ─────────────────────────────────────────────────────────────────────

export function slugify(text: string): string {
  const trMap: Record<string, string> = {
    ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u',
    Ç: 'C', Ğ: 'G', İ: 'I', Ö: 'O', Ş: 'S', Ü: 'U',
  }
  return text
    .split('')
    .map((c) => trMap[c] ?? c)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// ─── Tarih / Saat ──────────────────────────────────────────────────────────────

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function formatTime(time: string): string {
  return time.slice(0, 5)
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function hoursUntil(target: Date | string): number {
  const diff = new Date(target).getTime() - Date.now()
  return diff / (1000 * 60 * 60)
}

// ─── Para ──────────────────────────────────────────────────────────────────────

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(amount)
}

// ─── Kaparo Hesaplama ──────────────────────────────────────────────────────────

export type DepositInfo = {
  required: boolean
  amount: number
  label: string
}

export function calculateDeposit(
  business: {
    requiresDeposit: boolean
    depositType?: string | null
    depositAmount?: number | null
    depositPercent?: number | null
  },
  reservationTotal?: number
): DepositInfo {
  if (!business.requiresDeposit) {
    return { required: false, amount: 0, label: 'Kaparo gerekmiyor' }
  }

  if (business.depositType === 'FIXED' && business.depositAmount) {
    return {
      required: true,
      amount: business.depositAmount,
      label: `${formatCurrency(business.depositAmount)} kaparo`,
    }
  }

  if (business.depositType === 'PERCENTAGE' && business.depositPercent && reservationTotal) {
    const amount = (reservationTotal * business.depositPercent) / 100
    return {
      required: true,
      amount,
      label: `%${business.depositPercent} kaparo (${formatCurrency(amount)})`,
    }
  }

  return { required: false, amount: 0, label: '' }
}

// ─── İade Politikası ───────────────────────────────────────────────────────────

export type RefundPolicy = 'FULL' | 'HALF' | 'NONE'

export function getRefundPolicy(
  reservationDate: Date | string,
  fullRefundBefore: number,
  halfRefundBefore: number
): RefundPolicy {
  const hours = hoursUntil(reservationDate)
  if (hours >= fullRefundBefore) return 'FULL'
  if (hours >= halfRefundBefore) return 'HALF'
  return 'NONE'
}

// ─── Pixel Art ─────────────────────────────────────────────────────────────────

export const PIXEL_ART_SIZE = 16

export function createEmptyPixelArt(fillColor = '#ffffff'): string[] {
  return Array(PIXEL_ART_SIZE * PIXEL_ART_SIZE).fill(fillColor)
}

export function pixelArtToDataUrl(grid: string[]): string {
  // Canvas API ile DataURL oluşturmak için kullanılır (tarayıcı taraflı)
  // Burada sadece serialize/deserialize yardımcısı
  return JSON.stringify(grid)
}
