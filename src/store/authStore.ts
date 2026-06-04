import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  setTokens: (accessToken: string | null) => void
  setUser: (user: User | null) => void
  setSession: (accessToken: string, user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setTokens: (accessToken) => set({ accessToken }),
      setUser: (user) => set({ user }),
      setSession: (accessToken, user) => set({ accessToken, user }),
      logout: () => set({ user: null, accessToken: null }),
    }),
    {
      name: 'applywell-auth',
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
    },
  ),
)

export const isAuthenticated = () => !!useAuthStore.getState().accessToken
