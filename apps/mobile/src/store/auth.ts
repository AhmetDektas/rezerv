import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'

type User = {
  id: string
  name: string
  email: string
  phone: string
  role: 'CUSTOMER' | 'BUSINESS_OWNER' | 'ADMIN'
  avatarUrl: string | null
}

type AuthState = {
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => Promise<void>
  logout: () => Promise<void>
  loadFromStorage: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,

  setAuth: async (token, user) => {
    await SecureStore.setItemAsync('token', token)
    await SecureStore.setItemAsync('user', JSON.stringify(user))
    set({ token, user })
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('token')
    await SecureStore.deleteItemAsync('user')
    set({ token: null, user: null })
  },

  loadFromStorage: async () => {
    const token = await SecureStore.getItemAsync('token')
    const userStr = await SecureStore.getItemAsync('user')
    if (token && userStr) {
      set({ token, user: JSON.parse(userStr) })
    }
  },
}))
