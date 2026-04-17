import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      theme: 'light',
      isLoading: false,

      get isAuthenticated() {
        return !!get().accessToken
      },

      setTokens: (accessToken) =>
        set({ accessToken }),

      setUser: (user) => set({ user }),

      logout: () =>
        set({ user: null, accessToken: null }),

      setTheme: (theme) => {
        localStorage.setItem('theme', theme)
        if (theme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        set({ theme })
      },

      initTheme: () => {
        const stored = localStorage.getItem('theme') || 'light'
        if (stored === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        set({ theme: stored })
      },

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        theme: state.theme,
      }),
    }
  )
)

export default useAuthStore
