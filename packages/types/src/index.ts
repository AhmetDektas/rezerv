// ─── API Response Types ───────────────────────────────────────────────────────

export type ApiResponse<T> = {
  data: T
  message?: string
}

export type ApiError = {
  error: string
  code?: string
  details?: Record<string, string[]>
}

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// ─── Auth Types ───────────────────────────────────────────────────────────────

export type LoginInput = {
  email: string
  password: string
}

export type RegisterCustomerInput = {
  name: string
  email: string
  phone: string
  password: string
}

export type RegisterBusinessOwnerInput = {
  name: string
  email: string
  phone: string
  password: string
  businessName: string
}

export type AuthResponse = {
  token: string
  user: {
    id: string
    name: string
    email: string
    phone: string
    role: 'CUSTOMER' | 'BUSINESS_OWNER' | 'ADMIN'
    avatarUrl: string | null
  }
}

// ─── Business Types ───────────────────────────────────────────────────────────

export type Category = 'FOOD_DRINK' | 'HEALTH' | 'SPORTS' | 'VETERINARY'

export type CategoryMeta = {
  id: Category
  label: string
  emoji: string
  description: string
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'FOOD_DRINK', label: 'Yeme-İçme', emoji: '🍽️', description: 'Restoran, kafe, bar' },
  { id: 'HEALTH', label: 'Sağlık', emoji: '🏥', description: 'Klinik, diş, psikoloji' },
  { id: 'SPORTS', label: 'Spor', emoji: '🏋️', description: 'PT, yoga, pilates' },
  { id: 'VETERINARY', label: 'Veteriner', emoji: '🐾', description: 'Muayene, tıraş, konaklama' },
]

export type CreateBusinessInput = {
  name: string
  category: Category
  description?: string
  address: string
  lat: number
  lng: number
  phone: string
  email: string
}

export type UpdateBusinessInput = Partial<CreateBusinessInput> & {
  coverImage?: string
  logoUrl?: string
  requiresDeposit?: boolean
  depositType?: 'FIXED' | 'PERCENTAGE'
  depositAmount?: number
  depositPercent?: number
  fullRefundBefore?: number
  halfRefundBefore?: number
}

// ─── Reservation Types ────────────────────────────────────────────────────────

export type CreateReservationInput = {
  businessId: string
  slotId: string
  notes?: string
  petId?: string
}

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW' | 'COMPLETED'

// ─── Slot Types ───────────────────────────────────────────────────────────────

export type SlotWithAvailability = {
  id: string
  date: string
  startTime: string
  endTime: string
  capacity: number
  booked: number
  available: number
  isBlocked: boolean
}

// ─── Pet Types ────────────────────────────────────────────────────────────────

export type PetType = 'DOG' | 'CAT' | 'BIRD' | 'RABBIT' | 'OTHER'

export type PixelArtGrid = string[] // 256 hex renk kodu (16x16)

export type CreatePetInput = {
  name: string
  type: PetType
  breed?: string
  age?: number
  weight?: number
  notes?: string
  pixelArt?: PixelArtGrid
}

// ─── Payment Types ────────────────────────────────────────────────────────────

export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'CAPTURED' | 'FAILED'

export type InitiatePaymentInput = {
  reservationId: string
  provider: 'iyzico'
}

// ─── Subscription Types ───────────────────────────────────────────────────────

export type PlanType = 'SUBSCRIPTION' | 'COMMISSION'

export type BillingCycle = 'MONTHLY' | 'YEARLY'

export type SubscribeInput = {
  planId: string
  billingCycle?: BillingCycle
}
