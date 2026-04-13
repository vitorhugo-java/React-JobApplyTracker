import React from 'react'
import { Sun, Moon } from 'lucide-react'
import useAuthStore from '../../store/authStore'

const ThemeToggle = () => {
  const theme = useAuthStore((s) => s.theme)
  const setTheme = useAuthStore((s) => s.setTheme)

  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  )
}

export default ThemeToggle
