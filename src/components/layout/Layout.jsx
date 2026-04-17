import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import ThemeToggle from '../ui/ThemeToggle'
import SyncStatusIndicator from '../ui/SyncStatusIndicator'
import useAuthStore from '../../store/authStore'
import { logout as logoutApi } from '../../api/auth'

const Layout = () => {
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const logoutStore = useAuthStore((s) => s.logout)
  const location = useLocation()
  const isGuestAboutPage = !accessToken && location.pathname === '/about'

  const handleLogout = async () => {
    await logoutApi().catch(() => null)
    logoutStore()
    window.location.href = '/login'
  }

  if (isGuestAboutPage) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Outlet />
      </main>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="md:hidden w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold">JT</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SyncStatusIndicator />
            <ThemeToggle />
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <User className="w-4 h-4" />
              <span className="hidden sm:block">{user?.name || user?.email || 'User'}</span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border-0 bg-transparent text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  )
}

export default Layout
