import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const loadPrimeReactTheme = (theme) => {
  const themeLink = document.getElementById('primereact-theme')
  const themeName = theme === 'dark' ? 'lara-dark-indigo' : 'lara-light-indigo'
  const themePath = `https://unpkg.com/primereact/resources/themes/${themeName}/theme.css`
  
  if (themeLink) {
    themeLink.href = themePath
  } else {
    const link = document.createElement('link')
    link.id = 'primereact-theme'
    link.rel = 'stylesheet'
    link.href = themePath
    document.head.appendChild(link)
  }
}

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
        loadPrimeReactTheme(theme)
        set({ theme })
      },

      initTheme: () => {
        const stored = localStorage.getItem('theme') || 'light'
        if (stored === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        loadPrimeReactTheme(stored)
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
