import React from 'react'
import { Sun, Moon } from 'lucide-react'
import useAuthStore from '../../store/authStore'

const ThemeToggle = () => {
  const theme = useAuthStore((s) => s.theme)
  const setTheme = useAuthStore((s) => s.setTheme)

  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border-0 bg-transparent text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  )
}

export default ThemeToggle
